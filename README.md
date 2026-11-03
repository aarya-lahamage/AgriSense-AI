# AgriSense AI 🌱

### Adaptive Agriculture Intelligence Platform

**AgriSense AI** is a full-stack, AI-powered agricultural decision support system designed to help Indian farmers make data-driven farming decisions. Built with React + Vite (frontend) and FastAPI (backend), it integrates Google Gemini, real-time weather data, APMC mandi rates, soil-card OCR, and an **Adaptive Agriculture Intelligence Agent** powered by the [Adaption Adaptive Data platform](https://adaptionlabs.ai).

---

## 🔬 Adaptive Agriculture Intelligence (Hackathon Feature)

This project integrates the **Adaption Adaptive Data platform** to implement a closed-loop agriculture knowledge improvement workflow:

```
Farmer Question
  → Language detection (Marathi / Hindi / English)
  → Retrieval from Verified Agriculture KB (20 ICAR-sourced records)
  → Grounded Gemini response generation
  → Farmer feedback collection (helpful / not helpful)
  → Human-in-loop review gate (prevents unverified data from entering training)
  → Verified corrections enter adaptation pipeline
  → Dataset uploaded to Adaption platform
  → Adaptation job run on platform
  → Evaluation metrics tracked (before / after)
  → Dashboard shows real platform status
```

**Dataset**: 20 verified agriculture records in Marathi (12), Hindi (5), and English (3).  
**Sources**: ICAR-IISR, MPKV Rahuri, VNMKV Parbhani, ICAR-DOGR, CICR Nagpur, VSI Pune, ICAR-IIHR, ICAR-IIMR, ICAR-CSSRI, MSAMB.

> **Adaption API Key**: Set `ADAPTION_API_KEY` in `backend/.env` to enable real platform operations (upload, adapt, evaluate). Without this key, the module shows an honest "blocked" status — no fake responses are generated.

---

## 🚀 Features

| Module | Description |
|---|---|
| 🏠 Dashboard | Live weather, farm snapshot, yield trends |
| 🌾 Crop Recommendation | ML-based (Random Forest) + Soil Health Card upload |
| 🔬 Disease Detection | Leaf image → disease diagnosis (FastAPI microservice) |
| 🌤️ Weather Advisory | 7-day forecast with spray-window analysis |
| 💊 Fertilizer Treatment | ML-based NPK fertilizer recommendation |
| 📈 Yield & Profit | Yield prediction + profit/loss analysis |
| 🤖 AI Assistant | Multilingual agronomic Q&A (Marathi/Hindi/English) with adaptive grounding |
| 🪪 Soil Card OCR | Upload Govt. Soil Health Card → auto-extract values |
| 🏛️ Government Schemes | PM-KISAN, Fasal Bima, subsidies browser |
| 💰 Expenses | Farm expense tracker |
| 📊 Farm Budget Planner | Income vs. expense planning |
| 📉 Mandi Rates | Live APMC market rates |
| 🧠 Adaptive Intelligence | Adaptive Data pipeline dashboard with dataset stats, evaluation, and feedback review |

---

## 🏗️ Architecture

```
AgriSense-AI/
├── frontend/                  # React + Vite + Tailwind CSS v4
│   └── src/
│       ├── pages/             # 13 feature pages
│       ├── components/        # Shared UI components
│       ├── context/           # Auth + Location context
│       └── utils/             # Speech synthesis helpers
├── backend/                   # FastAPI Python backend
│   ├── main.py                # Entry point + all API routes
│   ├── adaptive_service.py    # Adaption SDK integration + KB retrieval
│   ├── assistant_service.py   # Gemini AI + adaptive grounding
│   ├── crop_service.py        # Crop recommendation ML
│   ├── fertilizer_service.py  # Fertilizer recommendation ML
│   ├── yield_service.py       # Yield prediction ML
│   ├── ocr_service.py         # Soil card OCR
│   ├── weather_service.py     # Weather API integration
│   └── requirements.txt
└── data/
    └── adaptive/
        ├── agrisense_kb_train.jsonl   # 20 verified agriculture records
        ├── agrisense_kb_eval.jsonl    # 5 evaluation benchmarks
        └── agrisense_kb_train.csv     # CSV format for Adaption SDK
```

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- (Optional) Tesseract OCR for soil card scanning on Linux

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env: add GEMINI_API_KEY and optionally ADAPTION_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
# Create .env.local with:
# VITE_API_BASE_URL=http://127.0.0.1:8000
npm run dev
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key from [aistudio.google.com](https://aistudio.google.com) |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-2.5-flash` |
| `ADAPTION_API_KEY` | For Adaptive Intelligence | Adaption platform key from [adaptionlabs.ai](https://adaptionlabs.ai) |
| `ALLOWED_ORIGINS` | Production only | Comma-separated frontend URLs for CORS |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API URL (default: `http://127.0.0.1:8000`) |

---

## 🤝 Credits & Acknowledgements

- **[Adaption Adaptive Data Platform](https://adaptionlabs.ai)** — Used for agricultural dataset adaptation, evaluation, and continuous improvement workflow.
- **Google Gemini** — Powering the multilingual agronomic AI assistant.
- **ICAR (Indian Council of Agricultural Research)** — Agriculture knowledge sources for the verified dataset.
- **APMC / eNAM** — Market rate data.
- **Open-Meteo** — Free weather API.

---

## 📄 Dataset

The agriculture knowledge base (`data/adaptive/`) is open-sourced for research use.  
**License**: CC BY 4.0  
**Languages**: Marathi, Hindi, English  
**Records**: 20 verified + 5 evaluation benchmarks  
**Topics**: Fertilizer management, pest control, disease management, irrigation, soil health, organic farming, government schemes, market intelligence

---


