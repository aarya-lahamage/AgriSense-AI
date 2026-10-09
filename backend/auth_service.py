import sqlite3
import hashlib
import os
import jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-dev-key")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

DB_PATH = os.path.join(os.path.dirname(__file__), "agrisense.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            region TEXT,
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            module TEXT NOT NULL,
            summary TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    conn.commit()
    conn.close()


def hash_password(password, salt=None):
    if salt is None:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 100_000).hex()
    return salt, hashed


def verify_password(password, salt, stored_hash):
    _, hashed = hash_password(password, salt)
    return hashed == stored_hash


def create_token(user_id, email):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ValueError("Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid session")


def register_user(name, email, password, region=None):
    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        raise ValueError("An account with this email already exists")

    salt, hashed = hash_password(password)
    cursor = conn.execute(
        "INSERT INTO users (name, email, password_hash, salt, region, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (name, email, hashed, salt, region, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return {"id": user_id, "name": name, "email": email, "region": region}


def authenticate_user(email, password):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not row:
        raise ValueError("No account found with this email")
    if not verify_password(password, row["salt"], row["password_hash"]):
        raise ValueError("Incorrect password")
    return {"id": row["id"], "name": row["name"], "email": row["email"], "region": row["region"]}


def get_user_by_id(user_id):
    conn = get_db()
    row = conn.execute("SELECT id, name, email, region FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row["id"], "name": row["name"], "email": row["email"], "region": row["region"]}


def save_prediction(user_id, module, summary):
    conn = get_db()
    conn.execute(
        "INSERT INTO predictions (user_id, module, summary, created_at) VALUES (?, ?, ?, ?)",
        (user_id, module, summary, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()


def get_user_history(user_id, limit=20):
    conn = get_db()
    rows = conn.execute(
        "SELECT id, module, summary, created_at FROM predictions WHERE user_id = ? ORDER BY id DESC LIMIT ?",
        (user_id, limit),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]
