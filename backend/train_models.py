"""
train_models.py
Run this script to train all ML models from the dataset CSV and save them to models/
Usage: python train_models.py [--csv path/to/your_dataset.csv]
"""
import os
import argparse
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from xgboost import XGBClassifier
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FEATURES = [
    'WMC','DIT','NOC','CBO','RFC','LCOM','Ca','Ce','NPM','LOC',
    'DAM','MOA','MFA','CAM','IC','CBM','AMC','MCC','ACC',
    'Intensity','ANA','ARL','ACPD','ACM'
]

def train(csv_path):
    df = pd.read_csv(csv_path)
    X = df[FEATURES]
    y = df['isBuggy']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    models = {
        'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'knn': KNeighborsClassifier(n_neighbors=5),
        'logistic_regression': LogisticRegression(max_iter=5000),
        'naive_bayes': GaussianNB(),
        'xgboost': XGBClassifier(eval_metric='logloss', random_state=42)
    }

    models_dir = os.path.join(BASE_DIR, 'models')
    os.makedirs(models_dir, exist_ok=True)
    print(f"\n{'Model':<25} {'Acc':>7} {'Prec':>7} {'Rec':>7} {'F1':>7}")
    print("-" * 55)

    for name, model in models.items():
        model.fit(X_train, y_train)
        pred = model.predict(X_test)
        acc = accuracy_score(y_test, pred)
        prec = precision_score(y_test, pred)
        rec = recall_score(y_test, pred)
        f1 = f1_score(y_test, pred)
        print(f"{name:<25} {acc:>7.4f} {prec:>7.4f} {rec:>7.4f} {f1:>7.4f}")
        joblib.dump(model, os.path.join(models_dir, f'{name}.pkl'))

    print("\nAll models saved to models/")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--csv', default=os.path.join(BASE_DIR, 'dataset.csv'), help='Path to dataset CSV')
    args = parser.parse_args()
    train(args.csv)
