from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os
import requests
from datetime import date, timedelta

from soil_data import AGRO_CLIMATIC_ZONES, DISTRICT_TO_ZONE, MAHARASHTRA_CITIES
app = FastAPI(
    title="AgriSense AI API",
    description="Intelligent Agricultural Decision Support System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "crop_model.pkl")
crop_model = joblib.load(MODEL_PATH)

FEATURE_NAMES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

MAHARASHTRA_BOUNDS = {
    "lat_min": 15.6, "lat_max": 22.1,
    "lon_min": 72.6, "lon_max": 80.9,
}


class CropInput(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float


@app.get("/")
def root():
    return {"message": "AgriSense AI API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/zones")
def get_zones():
    return {
        zone_id: {"label": z["label"], "confidence": z["confidence"]}
        for zone_id, z in AGRO_CLIMATIC_ZONES.items()
    }


@app.get("/soil-lookup/{zone_id}")
def soil_lookup(zone_id: str):
    if zone_id not in AGRO_CLIMATIC_ZONES:
        raise HTTPException(status_code=404, detail="Zone not found")
    return AGRO_CLIMATIC_ZONES[zone_id]


@app.get("/city-search")
def city_search(query: str):
    q = query.strip().lower()
    if len(q) < 1:
        return {"results": []}

    matches = [c for c in MAHARASHTRA_CITIES if c["name"].lower().startswith(q)]
    matches.sort(key=lambda x: x["name"])
    return {"results": matches[:10]}

def _get_annual_rainfall(lat, lon):
    """Approximate annual rainfall by summing the last 365 days of rain."""
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=365)
    url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={lat}&longitude={lon}"
        f"&start_date={start}&end_date={end}"
        f"&daily=precipitation_sum&timezone=auto"
    )
    res = requests.get(url, timeout=10)
    data = res.json()
    values = data.get("daily", {}).get("precipitation_sum", [])
    values = [v for v in values if v is not None]
    return round(sum(values), 1) if values else 0


def _match_zone(district_name, place_name):
    """Try to match a district (or fallback to place name) to a known zone."""
    for key in (district_name, place_name):
        if not key:
            continue
        clean = key.replace(" District", "").strip()
        if clean in DISTRICT_TO_ZONE:
            zone_id = DISTRICT_TO_ZONE[clean]
            return zone_id, AGRO_CLIMATIC_ZONES[zone_id]
    return None, None


@app.get("/resolve-location")
def resolve_location(lat: float = None, lon: float = None, place: str = None, district: str = None):
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="lat and lon are required")

    if not (MAHARASHTRA_BOUNDS["lat_min"] <= lat <= MAHARASHTRA_BOUNDS["lat_max"] and
            MAHARASHTRA_BOUNDS["lon_min"] <= lon <= MAHARASHTRA_BOUNDS["lon_max"]):
        raise HTTPException(status_code=400, detail="This app currently supports Maharashtra locations only")

    if place and district:
        place_name, district_name = place, district
    else:
        try:
            geo_url = "https://nominatim.openstreetmap.org/reverse"
            geo_params = {"format": "json", "lat": lat, "lon": lon, "zoom": 10}
            geo_headers = {"User-Agent": "AgriSenseAI-StudentProject/1.0"}
            geo_res = requests.get(geo_url, params=geo_params, headers=geo_headers, timeout=5)
            address = geo_res.json().get("address", {})
            place_name = address.get("town") or address.get("city") or address.get("village") or "Unknown"
            district_name = address.get("state_district") or address.get("county") or place_name
        except Exception:
            place_name, district_name = "Unknown", None

    zone_id, zone_data = _match_zone(district_name, place_name)

    try:
        weather_url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m"
            f"&timezone=auto"
        )
        weather_res = requests.get(weather_url, timeout=5)
        weather_data = weather_res.json()
        temperature = weather_data["current"]["temperature_2m"]
        humidity = weather_data["current"]["relative_humidity_2m"]
        rainfall = _get_annual_rainfall(lat, lon)
    except Exception:
        raise HTTPException(status_code=503, detail="Weather service unavailable")

    return {
        "place": place_name,
        "district": district_name,
        "zone_id": zone_id,
        "zone": zone_data,
        "weather": {"temperature": temperature, "humidity": humidity, "rainfall": rainfall},
    }

@app.post("/predict/crop")
def predict_crop(data: CropInput):
    input_array = np.array([[
        data.N, data.P, data.K,
        data.temperature, data.humidity,
        data.ph, data.rainfall
    ]])

    probabilities = crop_model.predict_proba(input_array)[0]
    classes = crop_model.classes_
    ranked = sorted(zip(classes, probabilities), key=lambda x: x[1], reverse=True)
    top_3 = ranked[:3]

    importances = crop_model.feature_importances_
    feature_importance = sorted(
        zip(FEATURE_NAMES, importances),
        key=lambda x: x[1],
        reverse=True
    )
    top_reasons = [
        f"{name} ({round(score * 100, 1)}% influence)"
        for name, score in feature_importance[:3]
    ]

    suggestions = [
        {"crop": crop, "confidence": round(float(prob) * 100, 1)}
        for crop, prob in top_3
    ]

    return {"suggestions": suggestions, "top_factors": top_reasons}