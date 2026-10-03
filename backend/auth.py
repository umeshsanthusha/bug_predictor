"""
CrossBugSense — Supabase Auth token verification for the Flask API.

Authentication (signup, login, password reset, profile, chats) is handled
entirely by Supabase from the frontend:
  - auth:        Supabase Auth (GoTrue), access tokens issued to the browser
  - profiles:    public.profiles  (RLS, auto-created by a trigger on signup)
  - chats:       public.chats     (RLS, read/written via PostgREST)

The Flask ML endpoints only need to verify the caller's Supabase access token
(a JWT) before running a prediction. Two verification modes:
  - HS256 with the project JWT secret  -> env SUPABASE_JWT_SECRET (dashboard: Settings -> API)
  - RS256 via the project JWKS         -> env SUPABASE_URL (default: the linked project)
"""
import functools
import os

import jwt
from flask import g, jsonify, request

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://oyhbwkoylcddgpcqzmdk.supabase.co')
SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET', '')

# Cache the decoded JWKS so key fetching only happens when the kid changes.
_JWKS_CACHE = {'client': None}


def _jwks_client():
    if _JWKS_CACHE['client'] is None:
        _JWKS_CACHE['client'] = jwt.PyJWKClient(f'{SUPABASE_URL}/auth/v1/.well-known/jwks.json')
    return _JWKS_CACHE['client']


def _verify_token(token: str) -> dict:
    """Decode and verify a Supabase access token; raises jwt.PyJWTError if invalid."""
    audience = ['authenticated', 'anon', 'service_role']
    if SUPABASE_JWT_SECRET:
        return jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=['HS256'], audience=audience)
    # Newer projects sign with ES256, older ones with RS256; JWKS advertises both.
    signing_key = _jwks_client().get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=['ES256', 'RS256'],
        issuer=f'{SUPABASE_URL}/auth/v1',
        audience=audience,
    )


def require_supabase_user(fn):
    """Reject requests without a valid `Authorization: Bearer <supabase access token>`."""
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get('Authorization', '')
        token = header[7:] if header.startswith('Bearer ') else ''
        if not token:
            return jsonify({'error': 'Missing authentication token.'}), 401
        try:
            claims = _verify_token(token)
        except jwt.PyJWTError:
            return jsonify({'error': 'Invalid or expired session. Please sign in again.'}), 401
        g.supabase_user = {
            'id': claims.get('sub'),
            'email': claims.get('email'),
            'role': claims.get('role'),
        }
        return fn(*args, **kwargs)
    return wrapper
