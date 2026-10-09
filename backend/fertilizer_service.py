# Model trained on "Crop and Fertilizer Dataset for Western Maharashtra"
# (Kaggle, by sanchitagholap) — 4513 rows, 5 districts (Kolhapur, Satara,
# Sangli, Solapur, Pune), 16 crops, 19 fertilizers.
# Trained with class_weight="balanced" to fairly represent rare fertilizers
# (some had as few as 6-25 samples). Test accuracy: 90.70% — a small
# trade-off from 92.03% for much better coverage of all 19 fertilizer types.
import joblib
import pandas as pd
import os

_DIR = os.path.join(os.path.dirname(__file__), "models", "fertilizer")

fert_model = joblib.load(os.path.join(_DIR, "fertilizer_model.pkl"))
soil_encoder = joblib.load(os.path.join(_DIR, "soil_encoder.pkl"))
crop_encoder = joblib.load(os.path.join(_DIR, "crop_encoder.pkl"))
fert_encoder = joblib.load(os.path.join(_DIR, "fertilizer_encoder.pkl"))
feature_cols = joblib.load(os.path.join(_DIR, "feature_cols.pkl"))

SOIL_TYPES = sorted(soil_encoder.classes_.tolist())
CROP_TYPES = sorted(crop_encoder.classes_.tolist())

FERTILIZER_INFO = {
    "Urea": "High nitrogen (46% N) — boosts leafy, vegetative growth.",
    "DAP": "Diammonium Phosphate — rich in phosphorus, supports root and flower development.",
    "MOP": "Muriate of Potash — high potassium, improves fruit quality and disease resistance.",
    "SSP": "Single Super Phosphate — phosphorus source with added sulphur and calcium.",
    "19:19:19 NPK": "Fully balanced, water-soluble — common for foliar spray or fertigation.",
    "10:26:26 NPK": "High phosphorus and potassium — good for flowering and fruiting stages.",
    "50:26:26 NPK": "Very high nitrogen with phosphorus and potassium — for vigorous vegetative growth.",
    "12:32:16 NPK": "Phosphorus-heavy blend — supports early root development.",
    "13:32:26 NPK": "Phosphorus and potassium heavy — supports fruiting and grain filling.",
    "10:10:10 NPK": "Balanced, low-concentration blend — gentle general-purpose fertilizer.",
    "20:20:20 NPK": "Balanced, water-soluble — suited to foliar feeding.",
    "18:46:00 NPK": "Standard DAP ratio — phosphorus-rich, supports root establishment.",
    "Magnesium Sulphate": "Corrects magnesium deficiency (yellowing between leaf veins).",
    "Ferrous Sulphate": "Corrects iron deficiency (pale, yellowing new leaves).",
    "Ammonium Sulphate": "Nitrogen plus sulphur — useful on sulphur-deficient soils.",
    "Chilated Micronutrient": "Blend of trace elements (zinc, iron, manganese) in plant-available form.",
    "Hydrated Lime": "Raises soil pH and improves calcium availability in acidic soils.",
    "White Potash": "Potassium source, similar to MOP in a different form/purity.",
    "Sulphur": "Corrects sulphur deficiency and can help lower soil pH slightly.",
}

# General market reference (approximate estimate, not live pricing)
FERTILIZER_PRICES = {
    "Urea": "~₹266 per 45kg bag (subsidized)",
    "DAP": "~₹1,350 per 50kg bag",
    "MOP": "~₹1,700 per 50kg bag",
    "SSP": "~₹450 per 50kg bag",
    "19:19:19 NPK": "~₹1,500 per 50kg bag",
    "10:26:26 NPK": "~₹1,470 per 50kg bag",
    "50:26:26 NPK": "~₹1,600 per 50kg bag",
    "12:32:16 NPK": "~₹1,450 per 50kg bag",
    "13:32:26 NPK": "~₹1,500 per 50kg bag",
    "10:10:10 NPK": "~₹1,200 per 50kg bag",
    "20:20:20 NPK": "~₹1,500 per 50kg bag",
    "18:46:00 NPK": "~₹1,350 per 50kg bag",
    "Magnesium Sulphate": "~₹800 per 50kg bag",
    "Ferrous Sulphate": "~₹1,200 per 50kg bag",
    "Ammonium Sulphate": "~₹800 per 50kg bag",
    "Chilated Micronutrient": "~₹300 - ₹500 per kg",
    "Hydrated Lime": "~₹300 per 50kg bag",
    "White Potash": "~₹1,700 per 50kg bag",
    "Sulphur": "~₹50 - ₹100 per kg",
}


def top_fertilizers(nitrogen, phosphorus, potassium, ph, rainfall, temperature, soil_color, crop, top_n=3):
    if soil_color not in soil_encoder.classes_:
        raise ValueError(f"Unknown soil_color '{soil_color}'. Valid: {SOIL_TYPES}")
    if crop not in crop_encoder.classes_:
        raise ValueError(f"Unknown crop '{crop}'. Valid: {CROP_TYPES}")

    soil_enc = soil_encoder.transform([soil_color])[0]
    crop_enc = crop_encoder.transform([crop])[0]

    row = pd.DataFrame([{
        "Nitrogen": nitrogen,
        "Phosphorus": phosphorus,
        "Potassium": potassium,
        "pH": ph,
        "Rainfall": rainfall,
        "Temperature": temperature,
        "Soil_enc": soil_enc,
        "Crop_enc": crop_enc,
    }])[feature_cols]

    proba = fert_model.predict_proba(row)[0]
    ranked = sorted(enumerate(proba), key=lambda x: x[1], reverse=True)[:top_n]

    results = []
    for class_idx, prob in ranked:
        name = fert_encoder.inverse_transform([class_idx])[0]
        results.append({
            "fertilizer": name,
            "confidence": round(float(prob), 3),
            "description": FERTILIZER_INFO.get(name, ""),
            "price_estimate": FERTILIZER_PRICES.get(name, "Price unavailable")
        })
    return results