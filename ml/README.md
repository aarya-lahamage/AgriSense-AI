# AgriSense AI — Machine Learning Pipelines

This folder contains the authoritative, reproducible training and evaluation scripts for AgriSense AI's core predictive models.

---

## 1. Crop Recommendation Model
- **Script**: [`train_crop_model.py`](train_crop_model.py)
- **Algorithm**: `RandomForestClassifier(n_estimators=100, random_state=42)`
- **Dataset**: `data/Crop_recommendation.csv` (2,200 samples across 22 crops)
- **Features**: Nitrogen (N), Phosphorus (P), Potassium (K), Temperature (°C), Humidity (%), pH, Rainfall (mm)
- **Target**: `label` (Crop class)
- **Performance**: ~99.3% test accuracy
- **Model Output**: `models/crop_model.pkl` (consumed by `backend/main.py`)

### Reproduction:
```bash
python ml/train_crop_model.py
```

---

## 2. Soil & Crop Fertilizer Prescription Model
- **Script**: [`train_fertilizer_model.py`](train_fertilizer_model.py)
- **Algorithm**: `ExtraTreesClassifier(n_estimators=100, random_state=42, n_jobs=-1)`
- **Dataset**: `data/Crop and fertilizer dataset.csv` (4,513 samples across Western Maharashtra: Kolhapur, Solapur, Satara, Sangli, Pune)
- **Features**: Nitrogen, Phosphorus, Potassium, pH, Rainfall, Temperature, Soil Color, Target Crop
- **Target**: Fertilizer Prescription (e.g. Urea, DAP, MOP, 10:26:26 NPK, SSP, etc.)
- **Performance**: ~98.2% test accuracy
- **Model Output**: `backend/models/fertilizer/fertilizer_model.pkl` (compressed `< 5 MB` to satisfy Render 512 MB RAM limits)

### Reproduction:
```bash
python ml/train_fertilizer_model.py
```

---

## 3. Agro-Climatic Yield & Net Profit Prediction Engine
- **Service**: `backend/yield_service.py`
- **Architecture**: Calibrated Regional Production Function calibrated to Western Maharashtra agro-climatic zones, seasonal precipitation curves, and current APMC mandi market price benchmarks.
- **Benefits**: Lightweight in-memory footprint (`< 1 MB`), avoiding Render free-tier Out Of Memory crashes caused by unpickling 200+ MB regression models.
