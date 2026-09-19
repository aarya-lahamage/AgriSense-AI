from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os
import requests
from datetime import date, timedelta
import fertilizer_service
import yield_service

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
            place_name = (
                address.get("town") or address.get("city") or address.get("village")
                or address.get("suburb") or address.get("municipality")
                or address.get("city_district") or address.get("hamlet")
                or address.get("county") or "Your area"
            )
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


CROP_PROFILES = {
    "rice": {"label": "Rice", "heat_limit": 35, "humid_disease": 80, "water_need": "high"},
    "wheat": {"label": "Wheat", "heat_limit": 32, "humid_disease": 75, "water_need": "medium"},
    "cotton": {"label": "Cotton", "heat_limit": 40, "humid_disease": 75, "water_need": "medium"},
    "sugarcane": {"label": "Sugarcane", "heat_limit": 38, "humid_disease": 80, "water_need": "high"},
    "soybean": {"label": "Soybean", "heat_limit": 35, "humid_disease": 78, "water_need": "medium"},
    "onion": {"label": "Onion", "heat_limit": 33, "humid_disease": 70, "water_need": "medium"},
    "grapes": {"label": "Grapes", "heat_limit": 36, "humid_disease": 70, "water_need": "low"},
    "tomato": {"label": "Tomato", "heat_limit": 32, "humid_disease": 75, "water_need": "medium"},
    "general": {"label": "General / Not sure", "heat_limit": 38, "humid_disease": 80, "water_need": "medium"},
}


def _spray_score(rainfall, wind, temp):
    """Score 0-100 for how suitable a day is for spraying."""
    score = 100
    if rainfall >= 10:
        score -= 70
    elif rainfall >= 5:
        score -= 50
    elif rainfall >= 2:
        score -= 30
    elif rainfall >= 0.5:
        score -= 10

    if wind > 20:
        score -= 40
    elif wind > 15:
        score -= 25
    elif wind > 10:
        score -= 10

    if temp > 35:
        score -= 20
    elif temp > 32:
        score -= 10

    return max(0, min(100, score))


def _generate_advisories(temp, humidity, wind, rainfall_today, forecast, crop_key):
    """Actionable, crop-aware farming advice."""
    crop = CROP_PROFILES.get(crop_key, CROP_PROFILES["general"])
    crop_name = crop["label"]
    advisories = []

    rain_days = [(i, f["rainfall"]) for i, f in enumerate(forecast)]
    rain_next_3days = round(sum(r for i, r in rain_days[1:4]), 1)
    day_names = ["today", "tomorrow", "in 2 days", "in 3 days"]

    # --- SPRAYING ---
    if rain_days[0][1] >= 2:
        next_dry = next((i for i, r in rain_days if i > 0 and r < 2), None)
        advisories.append({
            "type": "spraying", "level": "danger",
            "title": "Do not spray today",
            "message": f"About {rain_days[0][1]}mm rain is expected today. Pesticides and foliar sprays will wash off before the plant absorbs them — you lose both the chemical and the cost."
                       + (f" Wait until {day_names[next_dry]}, which looks dry." if next_dry is not None else " Wait for a dry day."),
            "action": "Postpone spraying",
        })
    elif wind > 15:
        advisories.append({
            "type": "spraying", "level": "warning",
            "title": "Too windy to spray",
            "message": f"Wind is {wind} km/h. Above 15 km/h, spray drifts away from the target and can damage neighbouring fields. Spray early morning when wind is usually calmest.",
            "action": "Wait for calmer wind",
        })
    elif rain_next_3days > 5:
        advisories.append({
            "type": "spraying", "level": "warning",
            "title": "Spray today if due",
            "message": f"Today is dry with manageable wind, but {rain_next_3days}mm rain is forecast over the next 3 days. If spraying is due, do it today and allow 4-6 hours before any rain.",
            "action": "Spray early today",
        })
    else:
        advisories.append({
            "type": "spraying", "level": "ok",
            "title": "Good spraying conditions",
            "message": f"Low rain risk and wind at {wind} km/h. Spray during early morning or late evening to minimise evaporation and drift.",
            "action": "Safe to spray",
        })

    # --- IRRIGATION (crop-aware) ---
    water_need = crop["water_need"]
    rain_threshold = {"high": 15, "medium": 20, "low": 25}[water_need]

    if rain_next_3days > rain_threshold:
        advisories.append({
            "type": "irrigation", "level": "info",
            "title": "Skip irrigation",
            "message": f"Around {rain_next_3days}mm rain is forecast over 3 days — enough for {crop_name} at this stage. Irrigating now risks waterlogging and root rot.",
            "action": "Save water this cycle",
        })
    elif rainfall_today < 1 and temp > 32:
        advisories.append({
            "type": "irrigation", "level": "warning",
            "title": "Irrigate soon",
            "message": f"{temp}°C with no rain today. {crop_name} has {water_need} water needs — irrigate before 8 AM or after 6 PM, since midday watering loses up to 30% to evaporation.",
            "action": "Irrigate early morning",
        })
    else:
        advisories.append({
            "type": "irrigation", "level": "ok",
            "title": "Normal irrigation",
            "message": "Moisture conditions are moderate. Check soil 5cm deep before watering — if it's damp, wait a day.",
            "action": "Follow routine",
        })

    # --- DISEASE RISK (crop-aware threshold) ---
    disease_threshold = crop["humid_disease"]
    if humidity > disease_threshold and 20 <= temp <= 30:
        advisories.append({
            "type": "disease", "level": "danger",
            "title": f"High disease risk for {crop_name}",
            "message": f"Humidity {humidity}% at {temp}°C is ideal for blight, downy mildew and leaf spot. Inspect the underside of leaves today — yellow or water-soaked patches mean you should act within 48 hours.",
            "action": "Inspect leaves today",
        })
    elif humidity > disease_threshold - 10:
        advisories.append({
            "type": "disease", "level": "warning",
            "title": "Moderate disease risk",
            "message": f"Humidity at {humidity}% is elevated for {crop_name}. Remove weeds between rows to improve airflow, and avoid overhead irrigation which keeps leaves wet.",
            "action": "Improve airflow",
        })
    else:
        advisories.append({
            "type": "disease", "level": "ok",
            "title": "Low disease risk",
            "message": "Current humidity is not favourable for most fungal diseases. Good time for routine field inspection.",
            "action": "Routine monitoring",
        })

    # --- HEAT STRESS (crop-aware limit) ---
    if temp > crop["heat_limit"]:
        advisories.append({
            "type": "heat", "level": "danger",
            "title": "Heat stress warning",
            "message": f"{temp}°C is above the comfortable limit for {crop_name} ({crop['heat_limit']}°C). Flowering and fruit-set can fail. Apply mulch around plants and consider light evening irrigation to cool the canopy.",
            "action": "Mulch and cool the field",
        })

    order = {"danger": 0, "warning": 1, "info": 2, "ok": 3}
    advisories.sort(key=lambda a: order.get(a["level"], 9))
    return advisories


@app.get("/crops")
def get_crops():
    """Crop list for the weather advisory dropdown."""
    return {k: v["label"] for k, v in CROP_PROFILES.items()}


@app.get("/weather-advisory")
def weather_advisory(lat: float, lon: float, crop: str = "general"):
    """Current weather plus crop-aware, actionable farming advisories."""
    if not (MAHARASHTRA_BOUNDS["lat_min"] <= lat <= MAHARASHTRA_BOUNDS["lat_max"] and
            MAHARASHTRA_BOUNDS["lon_min"] <= lon <= MAHARASHTRA_BOUNDS["lon_max"]):
        raise HTTPException(status_code=400, detail="This app currently supports Maharashtra locations only")

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m"
            f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max"
            f"&wind_speed_unit=kmh&forecast_days=4&timezone=auto"
        )
        res = requests.get(url, timeout=8)
        data = res.json()

        current = data["current"]
        daily = data["daily"]

        temp = current["temperature_2m"]
        humidity = current["relative_humidity_2m"]
        wind = current["wind_speed_10m"]
        gusts = current.get("wind_gusts_10m")
        rainfall_today = daily["precipitation_sum"][0] or 0

        forecast = []
        for i in range(len(daily["time"])):
            day_rain = daily["precipitation_sum"][i] or 0
            day_wind = daily["wind_speed_10m_max"][i] or 0
            day_temp = daily["temperature_2m_max"][i]
            forecast.append({
                "date": daily["time"][i],
                "max_temp": day_temp,
                "min_temp": daily["temperature_2m_min"][i],
                "rainfall": day_rain,
                "max_wind": day_wind,
                "spray_score": _spray_score(day_rain, day_wind, day_temp),
            })

        best_day = max(forecast, key=lambda d: d["spray_score"])
        best_spray_day = best_day["date"] if best_day["spray_score"] >= 50 else None

        advisories = _generate_advisories(temp, humidity, wind, rainfall_today, forecast, crop)

        return {
            "current": {
                "temperature": temp,
                "humidity": humidity,
                "wind_speed": wind,
                "wind_gusts": gusts,
                "rainfall_today": rainfall_today,
            },
            "forecast": forecast,
            "advisories": advisories,
            "best_spray_day": best_spray_day,
            "best_spray_score": best_day["spray_score"],
            "crop": CROP_PROFILES.get(crop, CROP_PROFILES["general"])["label"],
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Weather service unavailable")

class FertilizerInput(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    ph: float
    rainfall: float
    temperature: float
    soil_color: str
    crop: str


class YieldInput(BaseModel):
    crop: str
    rainfall: float
    avg_temp: float
    land_area_acres: float
    price_per_quintal: float
    cultivation_cost: float


@app.get("/fertilizer-options")
def fertilizer_options():
    return {
        "soil_types": fertilizer_service.SOIL_TYPES,
        "crop_types": fertilizer_service.CROP_TYPES,
    }


@app.post("/predict/fertilizer")
def predict_fertilizer_endpoint(data: FertilizerInput):
    try:
        results = fertilizer_service.top_fertilizers(
            data.nitrogen, data.phosphorus, data.potassium,
            data.ph, data.rainfall, data.temperature,
            data.soil_color, data.crop,
        )
        return {
            "suggestions": results,
            "note": "Trained on 4,513 samples from Western Maharashtra districts (Kolhapur, Satara, Sangli, Solapur, Pune) — 92% test accuracy.",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/yield-crops")
def yield_crops():
    return {"crops": yield_service.CROP_TYPES}


@app.get("/yield-seasonal-estimate")
def yield_seasonal_estimate(lat: float, lon: float, crop: str):
    if not (MAHARASHTRA_BOUNDS["lat_min"] <= lat <= MAHARASHTRA_BOUNDS["lat_max"] and
            MAHARASHTRA_BOUNDS["lon_min"] <= lon <= MAHARASHTRA_BOUNDS["lon_max"]):
        raise HTTPException(status_code=400, detail="This app currently supports Maharashtra locations only")
    try:
        return yield_service.get_seasonal_climate_estimate(lat, lon, crop)
    except Exception:
        raise HTTPException(status_code=503, detail="Climate service unavailable")


@app.post("/predict/yield")
def predict_yield_endpoint(data: YieldInput):
    try:
        yield_hg, yield_tonnes = yield_service.predict_yield(
            data.crop, data.rainfall, data.avg_temp,
        )
        profit = yield_service.compute_profit(
            yield_tonnes, data.land_area_acres, data.price_per_quintal, data.cultivation_cost,
        )
        return {
            "predicted_yield_hg_per_ha": yield_hg,
            "predicted_yield_tonnes_per_ha": yield_tonnes,
            "pesticide_used_tonnes": yield_service.INDIA_PESTICIDE_TONNES_DEFAULT,
            "profit": profit,
            "disclaimer": "This model considers only crop type, rainfall, temperature and national pesticide-use trends. It does not account for soil quality, farm management, seed variety or irrigation method — treat it as a rough estimate.",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))