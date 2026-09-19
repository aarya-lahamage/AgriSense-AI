# Model trained by Shweta — see /docs/PROJECT_CONTEXT.md for details
import joblib
import numpy as np
import requests
from datetime import date, timedelta
import os

_DIR = os.path.join(os.path.dirname(__file__), "models", "yield")

yield_model = joblib.load(os.path.join(_DIR, "crop_yield_model.pkl"))
_saved = joblib.load(os.path.join(_DIR, "encoders.pkl"))
encoders = _saved["encoders"]
feature_cols = _saved["feature_cols"]

CROP_TYPES = sorted(encoders["Item"].classes_.tolist())

# India's national pesticide use is a country-level figure in the training
# data, not something an individual farmer can report. Recent GOI/FAO
# figures put this around 52,000-61,000 tonnes/year — we use a rounded
# mid-range estimate as a fixed default rather than asking the farmer.
INDIA_PESTICIDE_TONNES_DEFAULT = 55000

# Approximate typical growing duration (sowing to harvest) in days, for the
# crops this model was trained on. General agronomy figures, used only to
# decide how many days of historical weather to average.
CROP_DURATION_DAYS = {
    "Maize": 100, "Cassava": 300, "Plantains and others": 330,
    "Potatoes": 100, "Rice, paddy": 130, "Sorghum": 110,
    "Soybeans": 100, "Sweet potatoes": 120, "Wheat": 130, "Yams": 210,
}


def predict_yield(crop, rainfall, avg_temp, pesticides_tonnes=None):
    """Year is not farmer input — it only captures a historical technology
    trend in the training data, so we always use the current year."""
    year = date.today().year
    pesticides = pesticides_tonnes if pesticides_tonnes is not None else INDIA_PESTICIDE_TONNES_DEFAULT

    area_encoded = encoders["Area"].transform(["India"])[0]
    try:
        item_encoded = encoders["Item"].transform([crop])[0]
    except ValueError:
        raise ValueError(f"'{crop}' not in training data. Valid: {CROP_TYPES}")

    features = np.array([[area_encoded, item_encoded, year, rainfall, pesticides, avg_temp]])
    pred_hg_ha = float(yield_model.predict(features)[0])
    pred_tonnes_ha = pred_hg_ha / 10000

    return round(pred_hg_ha, 2), round(pred_tonnes_ha, 4)


def compute_profit(yield_tonnes_per_ha, land_area_acres, price_per_quintal, cultivation_cost):
    """Simple arithmetic, not ML — profit depends on market price and costs
    the farmer knows far better than any model could guess."""
    land_area_ha = land_area_acres * 0.404686
    total_production_tonnes = yield_tonnes_per_ha * land_area_ha
    price_per_tonne = price_per_quintal * 10  # 1 tonne = 10 quintals
    revenue = total_production_tonnes * price_per_tonne
    profit = revenue - cultivation_cost

    return {
        "total_production_tonnes": round(total_production_tonnes, 3),
        "estimated_revenue": round(revenue, 2),
        "estimated_profit": round(profit, 2),
    }


def get_seasonal_climate_estimate(lat, lon, crop):
    """Historical average rainfall & temperature over the crop's typical
    growing duration, averaged across the last 2 years — NOT today's
    weather, since yield depends on the whole season, not a single day."""
    duration = CROP_DURATION_DAYS.get(crop, 120)

    rainfalls, temps = [], []
    for years_back in [1, 2]:
        end = date.today() - timedelta(days=365 * years_back)
        start = end - timedelta(days=duration)
        url = (
            f"https://archive-api.open-meteo.com/v1/archive"
            f"?latitude={lat}&longitude={lon}"
            f"&start_date={start}&end_date={end}"
            f"&daily=precipitation_sum,temperature_2m_mean&timezone=auto"
        )
        res = requests.get(url, timeout=10)
        data = res.json().get("daily", {})
        precip = [v for v in data.get("precipitation_sum", []) if v is not None]
        temp = [v for v in data.get("temperature_2m_mean", []) if v is not None]
        if precip:
            rainfalls.append(sum(precip))
        if temp:
            temps.append(sum(temp) / len(temp))

    avg_rainfall = round(sum(rainfalls) / len(rainfalls), 1) if rainfalls else None
    avg_temp = round(sum(temps) / len(temps), 1) if temps else None

    return {
        "avg_rainfall": avg_rainfall,
        "avg_temp": avg_temp,
        "duration_days": duration,
        "note": f"Based on the last 2 years' weather over a typical {duration}-day growing season for this crop — not today's weather.",
    }