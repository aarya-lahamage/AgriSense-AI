import re

NAVIGATION_INTENTS = [
    {
        "keywords": ["crop", "recommend", "which crop", "kaunsi fasal", "फसल"],
        "reply": "I can help you find the best crop for your farm based on soil and climate. Head to the Crop Advisor page to get started.",
        "suggestion": {"label": "Go to Crop Advisor", "path": "/crop-recommendation"},
    },
    {
        "keywords": ["fertilizer", "khad", "khaad", "urea", "dap", "npk fertilizer"],
        "reply": "For fertilizer recommendations based on your crop and soil, check out the Fertilizer page.",
        "suggestion": {"label": "Go to Fertilizer", "path": "/fertilizer-treatment"},
    },
    {
        "keywords": ["weather", "rain", "barish", "mausam", "spray", "wind"],
        "reply": "You can check live weather and farming advisories like the best spraying window on the Weather page.",
        "suggestion": {"label": "Go to Weather", "path": "/weather-advisory"},
    },
    {
        "keywords": ["yield", "profit", "paisa", "income", "kitna kamaunga", "production"],
        "reply": "To estimate your expected yield and profit, use the Yield & Profit page.",
        "suggestion": {"label": "Go to Yield & Profit", "path": "/yield-profit"},
    },
    {
        "keywords": ["disease", "pest", "keeda", "bimari", "leaf spot", "fungus"],
        "reply": "Disease detection from leaf photos is coming soon to this app. For now, check the Weather page — it includes disease risk warnings based on humidity and temperature.",
        "suggestion": {"label": "Go to Weather", "path": "/weather-advisory"},
    },
]

FAQ_KB = [
    {
        "keywords": ["what is npk", "npk matlab", "npk kya"],
        "answer": "NPK stands for Nitrogen (N), Phosphorus (P), and Potassium (K) — the three primary nutrients plants need. Nitrogen supports leafy growth, Phosphorus supports roots and flowers, and Potassium supports overall plant health and fruit quality.",
    },
    {
        "keywords": ["soil health card", "shc", "soil card"],
        "answer": "A Soil Health Card is a free government report showing your soil's N, P, K and pH levels. You can get one by submitting a soil sample at your nearest Krishi Vigyan Kendra or Soil Testing Lab, or apply online at soilhealth.dac.gov.in.",
    },
    {
        "keywords": ["what is ph", "soil ph", "ph matlab"],
        "answer": "Soil pH measures how acidic or alkaline your soil is, on a scale of 0-14. Most crops grow best between pH 6-7.5. Very acidic or alkaline soil can block nutrient absorption even if fertilizer is applied.",
    },
    {
        "keywords": ["when to irrigate", "irrigation timing", "paani kab de"],
        "answer": "Irrigate early morning or late evening to reduce water loss to evaporation. Avoid midday watering. Always check soil moisture 5cm deep before irrigating — if it's still damp, you can usually wait.",
    },
    {
        "keywords": ["crop rotation", "fasal chakra"],
        "answer": "Crop rotation means growing different crops in the same field across seasons. It helps balance soil nutrients, breaks pest and disease cycles, and improves long-term soil health.",
    },
    {
        "keywords": ["organic vs chemical", "organic fertilizer", "natural fertilizer"],
        "answer": "Organic fertilizers (compost, manure) release nutrients slowly and improve soil structure over time. Chemical fertilizers act faster but don't improve soil health long-term. Many farmers use a combination of both.",
    },
    {
        "keywords": ["fungal disease", "leaf yellow", "leaf spot causes"],
        "answer": "Fungal diseases usually thrive in high humidity (above 80%) combined with moderate temperatures (20-30°C). Improve airflow between plants, avoid overhead watering, and inspect leaves regularly during humid weather.",
    },
    {
        "keywords": ["how much water", "water requirement"],
        "answer": "Water needs vary by crop — rice and sugarcane need high water, cotton and soybean need medium, and crops like grapes need relatively less. Check the Weather page for irrigation advice tailored to your selected crop.",
    },
    {
        "keywords": ["best time to sow", "sowing time", "bijai"],
        "answer": "Sowing time depends on the crop and monsoon pattern in your area. Kharif crops (rice, cotton, soybean) are typically sown June-July with the monsoon. Rabi crops (wheat, gram) are sown October-November.",
    },
    {
        "keywords": ["mulching", "mulch"],
        "answer": "Mulching means covering soil around plants with straw, dry leaves, or plastic sheets. It retains soil moisture, reduces weed growth, and keeps root-zone temperature stable during heat stress.",
    },
]

GREETINGS = ["hi", "hello", "hey", "namaste", "namaskar", "hii", "helo"]


def get_response(message: str):
    text = message.lower().strip()

    if any(g == text or text.startswith(g + " ") for g in GREETINGS):
        return {
            "reply": "Hello! I'm your farming assistant. I can help you navigate this app or answer basic farming questions. What would you like to know?",
            "suggestions": [
                {"label": "Recommend a crop", "path": "/crop-recommendation"},
                {"label": "Check weather", "path": "/weather-advisory"},
            ],
        }

    for intent in NAVIGATION_INTENTS:
        if any(kw in text for kw in intent["keywords"]):
            return {"reply": intent["reply"], "suggestions": [intent["suggestion"]]}

    for faq in FAQ_KB:
        if any(kw in text for kw in faq["keywords"]):
            return {"reply": faq["answer"], "suggestions": []}

    return {
        "reply": "I'm a simple rule-based assistant, so I might not understand everything. I can help you navigate to Crop Advisor, Fertilizer, Weather, or Yield & Profit, and answer basic questions about soil, NPK, irrigation, and fertilizers. Try asking about one of these topics!",
        "suggestions": [
            {"label": "What is NPK?", "path": None},
            {"label": "Recommend a crop", "path": "/crop-recommendation"},
        ],
    }