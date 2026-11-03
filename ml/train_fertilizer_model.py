"""
AgriSense AI - Fertilizer Model Training Script
Trains an ExtraTreesClassifier on the Western Maharashtra Crop and Fertilizer dataset.
Features: Nitrogen, Phosphorus, Potassium, pH, Rainfall, Temperature, Soil_color, Crop
Target: Fertilizer

Outputs saved to: backend/models/fertilizer/
- fertilizer_model.pkl (compressed)
- soil_encoder.pkl
- crop_encoder.pkl
- fertilizer_encoder.pkl
- feature_cols.pkl
"""

import os
from pathlib import Path
import joblib
import pandas as pd
from sklearn.ensemble import ExtraTreesClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

WORKSPACE = Path(__file__).resolve().parent.parent
DATA_PATH = WORKSPACE / "data" / "Crop and fertilizer dataset.csv"
OUT_DIR = WORKSPACE / "backend" / "models" / "fertilizer"
OUT_DIR.mkdir(parents=True, exist_ok=True)

print("Loading dataset from:", DATA_PATH)
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows, {len(df.columns)} columns.")

# Encoders
soil_enc = LabelEncoder()
crop_enc = LabelEncoder()
fert_enc = LabelEncoder()

df["Soil_enc"] = soil_enc.fit_transform(df["Soil_color"].str.strip())
df["Crop_enc"] = crop_enc.fit_transform(df["Crop"].str.strip())
df["Fertilizer_enc"] = fert_enc.fit_transform(df["Fertilizer"].str.strip())

feature_cols = [
    "Nitrogen", "Phosphorus", "Potassium", "pH", "Rainfall", "Temperature",
    "Soil_enc", "Crop_enc"
]

X = df[feature_cols]
y = df["Fertilizer_enc"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training set: {X_train.shape}, Test set: {X_test.shape}")
model = ExtraTreesClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"Fertilizer Model Accuracy: {acc * 100:.2f}%")

# Save artifacts with compression to remain within lightweight cloud deployment limits (< 5 MB)
joblib.dump(model, OUT_DIR / "fertilizer_model.pkl", compress=9)
joblib.dump(soil_enc, OUT_DIR / "soil_encoder.pkl")
joblib.dump(crop_enc, OUT_DIR / "crop_encoder.pkl")
joblib.dump(fert_enc, OUT_DIR / "fertilizer_encoder.pkl")
joblib.dump(feature_cols, OUT_DIR / "feature_cols.pkl")

print("Saved model and encoders to:", OUT_DIR)
