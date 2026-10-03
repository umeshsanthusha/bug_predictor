"""
CrossBugSense — Flask API backend
Serves prediction endpoints for the React (Vite) frontend.
Auth is Supabase Auth: the frontend sends its Supabase access token and we
verify it here (see auth.py). Accounts and chats live in Supabase.
Run: python app.py  (listens on http://localhost:5000)
"""
import os
import re
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

from auth import require_supabase_user

app = Flask(__name__)
# Allow the Vite dev server to call the API directly (proxy also configured in vite.config.ts)
CORS(app, resources={r'/api/*': {'origins': ['http://localhost:5173', 'http://127.0.0.1:5173']}})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

FEATURES = [
    'WMC','DIT','NOC','CBO','RFC','LCOM','Ca','Ce','NPM','LOC',
    'DAM','MOA','MFA','CAM','IC','CBM','AMC','MCC','ACC',
    'Intensity','ANA','ARL','ACPD','ACM'
]

MODEL_DISPLAY = {
    'random_forest': 'Random Forest',
    'knn': 'K-Nearest Neighbors',
    'logistic_regression': 'Logistic Regression',
    'naive_bayes': 'Naïve Bayes',
    'xgboost': 'XGBoost'
}

MODEL_ACCURACY = {
    'random_forest': 92.59,
    'knn': 92.59,
    'logistic_regression': 91.36,
    'naive_bayes': 92.59,
    'xgboost': 91.36
}

def load_models():
    models = {}
    for name in MODEL_DISPLAY:
        path = os.path.join(MODELS_DIR, f'{name}.pkl')
        if os.path.exists(path):
            models[name] = joblib.load(path)
    return models

LOADED_MODELS = load_models()

def extract_metrics_from_code(code: str, language: str) -> dict:
    """
    Extract approximate source code metrics from raw file content.
    These are heuristic estimates based on the code content.
    """
    lines = code.splitlines()
    loc = len([l for l in lines if l.strip()])

    # WMC: count method/function definitions
    if language == 'csharp':
        wmc = len(re.findall(r'\b(public|private|protected|internal|static)\s+\w+\s+\w+\s*\(', code))
    else:  # javascript
        wmc = len(re.findall(r'\bfunction\b|\=\s*\(.*\)\s*\=\>|\bconst\s+\w+\s*=\s*function', code))
    wmc = max(1, wmc)

    # CBO: count imports/dependencies
    if language == 'csharp':
        cbo = len(re.findall(r'\busing\s+\w+', code))
    else:
        cbo = len(re.findall(r'\brequire\s*\(|\bimport\b', code))

    # RFC: unique method calls
    rfc = len(set(re.findall(r'\b\w+\s*\(', code)))

    # LCOM: rough coupling - number of unique identifiers
    lcom = len(set(re.findall(r'\b[a-zA-Z_]\w{2,}\b', code))) // 3

    # NOC / DIT: class relationships
    if language == 'csharp':
        noc = len(re.findall(r'\bclass\s+\w+', code))
        dit = len(re.findall(r'\bextends\b|\b:\s*\w+\b', code))
    else:
        noc = len(re.findall(r'\bclass\s+\w+', code))
        dit = len(re.findall(r'\bextends\b', code))

    ca = max(0, cbo - 1)
    ce = cbo
    npm = wmc

    dam = min(1.0, len(re.findall(r'\bprivate\b|\bprotected\b', code)) / max(1, wmc))
    moa = min(1.0, noc / max(1, wmc))
    mfa = min(1.0, dit / max(1, noc + 1))
    cam = min(1.0, rfc / max(1, loc / 10))
    ic = max(0, dit - 1)
    cbm = max(0, cbo - 2)
    amc = loc / max(1, wmc)
    mcc = wmc  # approx cyclomatic
    acc = max(0, ca - 1)

    # Code smell metrics (heuristic)
    complexity_ratio = rfc / max(1, loc / 10)
    intensity = min(10, complexity_ratio * 3 + (lcom / 10))
    ana = min(10, dit * 1.5 + noc * 0.5)
    arl = min(10, amc / 5)
    acpd = min(10, cbo * 0.8)
    acm = min(10, mcc * 0.5)

    return {
        'WMC': wmc, 'DIT': max(0, dit), 'NOC': max(0, noc),
        'CBO': cbo, 'RFC': rfc, 'LCOM': lcom,
        'Ca': ca, 'Ce': ce, 'NPM': npm, 'LOC': loc,
        'DAM': round(dam, 4), 'MOA': round(moa, 4),
        'MFA': round(mfa, 4), 'CAM': round(cam, 4),
        'IC': ic, 'CBM': cbm, 'AMC': round(amc, 4),
        'MCC': mcc, 'ACC': acc,
        'Intensity': round(intensity, 4),
        'ANA': round(ana, 4), 'ARL': round(arl, 4),
        'ACPD': round(acpd, 4), 'ACM': round(acm, 4)
    }

def detect_language(filename: str) -> str:
    ext = filename.rsplit('.', 1)[-1].lower()
    if ext in ['cs', 'csharp']:
        return 'csharp'
    elif ext in ['js', 'jsx', 'ts', 'tsx']:
        return 'javascript'
    return 'unknown'

@app.route('/api/models', methods=['GET'])
@require_supabase_user
def list_models():
    data = [
        {'key': key, 'name': name, 'accuracy': MODEL_ACCURACY[key]}
        for key, name in MODEL_DISPLAY.items()
        if key in LOADED_MODELS
    ]
    return jsonify({'models': data})

@app.route('/api/predict', methods=['POST'])
@require_supabase_user
def predict():
    if 'file1' not in request.files or 'file2' not in request.files:
        return jsonify({'error': 'Please upload exactly 2 files.'}), 400

    selected_model = request.form.get('model', 'random_forest')
    if selected_model not in LOADED_MODELS:
        return jsonify({'error': 'Model not found.'}), 400

    model = LOADED_MODELS[selected_model]
    results = []

    for key in ['file1', 'file2']:
        f = request.files[key]
        filename = f.filename
        code = f.read().decode('utf-8', errors='ignore')
        lang = detect_language(filename)

        metrics = extract_metrics_from_code(code, lang)
        X = pd.DataFrame([metrics])[FEATURES]

        prob = model.predict_proba(X)[0]
        pred = int(model.predict(X)[0])
        buggy_prob = float(prob[1]) if len(prob) > 1 else float(pred)

        results.append({
            'filename': filename,
            'language': lang,
            'prediction': pred,
            'buggy_probability': round(buggy_prob * 100, 2),
            'metrics': metrics
        })

    return jsonify({
        'model': MODEL_DISPLAY[selected_model],
        'model_accuracy': MODEL_ACCURACY[selected_model],
        'files': results
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
