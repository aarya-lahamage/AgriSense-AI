"""
AgriSense AI — Advanced Agronomic AI Assistant Engine
Provides contextual agricultural advisory, pest/disease guidance, fertilizer dosage calculations,
irrigation timing, and government scheme navigation for Indian & Maharashtra farmers.
Supports Hinglish, Hindi, Marathi keywords, and English queries with intelligent semantic token matching.
"""

import re

# Stopwords to filter out for cleaner intent matching
STOPWORDS = {
    "hai", "hain", "kya", "kaise", "kare", "karna", "chahiye", "kab", "kaha", "kahan", "kitna",
    "me", "mein", "ka", "ki", "ke", "ko", "se", "aur", "ya", "par", "pe", "bhi", "tha", "the",
    "what", "how", "when", "where", "which", "is", "are", "the", "a", "an", "for", "in", "on",
    "to", "do", "does", "can", "should", "tell", "give", "help", "please", "batao", "bataye",
    "shetkari", "kisan", "farmer", "farm"
}

NAVIGATION_INTENTS = [
    {
        "keywords": ["crop", "recommend", "fasal", "which crop", "bav", "sowing choice", "selection"],
        "reply": "You can get high-accuracy crop recommendations tailored to your soil (N, P, K, pH) and local climate on the Crop Advisor page.",
        "suggestion": {"label": "Go to Crop Advisor", "path": "/crop-recommendation"},
    },
    {
        "keywords": ["disease", "photo", "leaf", "detect", "bimari", "keeda", "scan", "spot", "patta", "patti"],
        "reply": "Upload or take a photo of your affected crop leaf on the Disease Scan page. The AI will analyze lesions, estimate severity, and provide chemical and organic remedies.",
        "suggestion": {"label": "Scan Leaf for Disease", "path": "/disease-detection"},
    },
    {
        "keywords": ["fertilizer", "khad", "khaad", "urea", "dap", "potash", "dosage", "npk calculator"],
        "reply": "For tailored fertilizer dosages based on your specific crop and soil color in Western Maharashtra, use the Fertilizer page.",
        "suggestion": {"label": "Fertilizer Calculator", "path": "/fertilizer-treatment"},
    },
    {
        "keywords": ["weather", "rain", "barish", "mausam", "spray", "spraying window", "hawa", "wind"],
        "reply": "Check live temperature, humidity, rainfall forecasts, and today's spraying suitability score on the Weather page.",
        "suggestion": {"label": "Check Weather & Spray Radar", "path": "/weather-advisory"},
    },
    {
        "keywords": ["mandi", "bhav", "bhaav", "rate", "apmc", "market", "bazaar", "price", "kahan bechun"],
        "reply": "Compare live Maharashtra APMC mandi rates, Government MSP benchmarks, and top paying market hubs on the Mandi Rates page.",
        "suggestion": {"label": "View Live Mandi Rates", "path": "/mandi-rates"},
    },
    {
        "keywords": ["yield", "profit", "income", "production", "munafa", "kamai", "harvest"],
        "reply": "Estimate your expected crop yield per hectare and calculate estimated net profit on the Yield & Profit page.",
        "suggestion": {"label": "Estimate Yield & Profit", "path": "/yield-profit"},
    },
    {
        "keywords": ["expense", "kharcha", "hisab", "spent", "spending", "input cost"],
        "reply": "Track all your seeds, fertilizers, pesticides, labor, and machinery expenses on the Farm Expenses page.",
        "suggestion": {"label": "Manage Farm Expenses", "path": "/expenses"},
    },
    {
        "keywords": ["ocr", "soil card", "shc", "extract", "soil test report", "matti report"],
        "reply": "Upload your Soil Health Card photo to automatically scan and extract Nitrogen, Phosphorus, Potassium, and pH levels without typing.",
        "suggestion": {"label": "Scan Soil Health Card", "path": "/soil-card-ocr"},
    },
    {
        "keywords": ["budget", "planner", "cashflow", "cost per acre", "cost planning"],
        "reply": "Plan your season's input costs, operational expenses, and projected returns with the Farm Budget Planner.",
        "suggestion": {"label": "Open Farm Budget", "path": "/farm-budget"},
    },
    {
        "keywords": ["scheme", "yojana", "subsidy", "pm kisan", "mahadbt", "shetkari anudan"],
        "reply": "Explore Central and Maharashtra state agricultural subsidies, solar pump schemes, and crop insurance on the Government Schemes page.",
        "suggestion": {"label": "View Government Schemes", "path": "/government-schemes"},
    },
    {
        "keywords": ["report", "farm summary", "my farm", "history"],
        "reply": "View a unified snapshot of your latest predictions across Crop, Fertilizer, and Yield modules on the Farm Report page.",
        "suggestion": {"label": "Open My Farm Report", "path": "/farm-report"},
    },
]

AGRONOMY_KB = [
    # ── PESTS & DISEASES ──────────────────────────────────────────
    {
        "triggers": ["yellow", "leaves", "chlorosis", "peele", "patte", "peelapan", "peela"],
        "title": "Causes of Yellowing Leaves & Treatment",
        "answer": (
            "Yellowing leaves (Chlorosis) can happen due to 3 main causes:\n"
            "1. Nitrogen Deficiency: General yellowing starting from bottom older leaves. Treatment: Apply Urea or spray Nano Urea @ 4 ml/L.\n"
            "2. Iron / Zinc Deficiency: Yellowing between leaf veins while veins stay green (interveinal). Treatment: Foliar spray of Chelated Zinc (1 g/L) or Ferrous Sulphate (2.5 g/L).\n"
            "3. Waterlogging / Root Rot: Over-irrigation chokes roots. Ensure proper drainage immediately."
        ),
        "suggestion": {"label": "Scan Leaf Disease", "path": "/disease-detection"},
    },
    {
        "triggers": ["pink", "bollworm", "kapas", "sundi", "cotton", "gulabi", "larva"],
        "title": "Pink Bollworm Control in Cotton",
        "answer": (
            "Pink Bollworm (गुलाबी सुंडी) management in Cotton:\n"
            "• Install Pheromone Traps @ 8-10 traps/acre at 45-50 days crop stage for monitoring.\n"
            "• If trap catches exceed 8 moths/day or 10% rosette flowers: Spray Chlorantraniliprole 18.5% SC (Coragen) @ 0.3 ml/L or Emamectin Benzoate 5% SG @ 0.5 g/L.\n"
            "• Release Trichogramma bactrae parasitoids @ 60,000/acre weekly.\n"
            "• Terminate cotton crop by December-January to prevent overwintering of larvae."
        ),
        "suggestion": {"label": "Scan Affected Cotton", "path": "/disease-detection"},
    },
    {
        "triggers": ["whitefly", "safed", "makkhi", "jassid", "aphid", "thrips", "sucking", "keeda"],
        "title": "Sucking Pests Control (Whitefly, Thrips, Aphids)",
        "answer": (
            "For controlling sucking pests in Cotton, Chilli, Tomato & Vegetables:\n"
            "• Install Yellow & Blue Sticky Traps @ 15-20 traps per acre at canopy level.\n"
            "• Chemical Spray: Acetamiprid 20% SP @ 0.5 g/L or Thiamethoxam 25% WG @ 0.3 g/L or Flonicamid 50% WG @ 0.4 g/L.\n"
            "• Organic Spray: 10,000 ppm Neem Oil @ 3 ml/L mixed with mild soap solution.\n"
            "• Spray during early morning or late evening when pests are active."
        ),
        "suggestion": {"label": "Check Weather Before Spraying", "path": "/weather-advisory"},
    },
    {
        "triggers": ["blight", "early", "late", "tamatar", "tomato", "potato", "jhulsa"],
        "title": "Blight Management in Tomato & Potato",
        "answer": (
            "Early & Late Blight (झुलसा रोग) Management:\n"
            "• Early Blight (Concentric target spots): Spray Mancozeb 75% WP @ 2.5 g/L or Azoxystrobin 23% SC @ 1 ml/L.\n"
            "• Late Blight (Water-soaked dark lesions + white mold): Spray Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ) @ 2.5 g/L or Cymoxanil + Mancozeb @ 2 g/L.\n"
            "• Cultural practice: Avoid overhead watering; space plants for air circulation and remove lower infected leaves."
        ),
        "suggestion": {"label": "Scan Leaf for Confirmation", "path": "/disease-detection"},
    },
    {
        "triggers": ["rust", "gerua", "ratua", "soybean", "wheat", "pustule"],
        "title": "Rust Disease Control in Wheat and Soybean",
        "answer": (
            "Rust (रतुआ / गेरुआ) causes powdery orange, yellow, or reddish-brown pustules on leaves.\n"
            "• In Wheat (Yellow/Brown Rust): Spray Propiconazole 25% EC (Tilt) @ 1 ml/L or Tebuconazole 25.9% EC @ 1 ml/L at first appearance.\n"
            "• In Soybean (Asian Rust): Hexaconazole 5% EC @ 1 ml/L or Pyraclostrobin @ 1 g/L.\n"
            "• Always spray in 200 Litres water per acre for uniform coverage."
        ),
        "suggestion": {"label": "Disease Diagnosis", "path": "/disease-detection"},
    },
    {
        "triggers": ["wilt", "fusarium", "ukhtha", "sukha", "mar", "drying"],
        "title": "Wilt (उखठा रोग) Prevention & Treatment",
        "answer": (
            "Fusarium & Bacterial Wilt causes sudden drooping and drying of plants even in wet soil.\n"
            "• Drench soil around root zone with Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 2 g/L or Copper Oxychloride @ 3 g/L.\n"
            "• Biological remedy: Soil application of Trichoderma viride enriched in well-decomposed FYM (1 kg Trichoderma in 50 kg dung).\n"
            "• Rotate with non-host crops like maize or sorghum to starve fungal spores."
        ),
        "suggestion": {"label": "Crop Rotation Suggestions", "path": "/crop-recommendation"},
    },

    # ── FERTILIZERS & SOIL ────────────────────────────────────────
    {
        "triggers": ["urea", "dosage", "dosing", "urea kitna", "nano urea", "nitrogen"],
        "title": "Urea & Nano Urea Application Guidelines",
        "answer": (
            "Urea Application Best Practices:\n"
            "• Never broadcast all urea at once. Apply in 2-3 split doses (e.g. 50% at basal/sowing, 25% at tillering/active vegetative, 25% before flowering).\n"
            "• Nano Urea: 1 bottle (500 ml) equals one 45 kg bag of conventional urea. Spray @ 4 ml per Litre of water at active vegetative stage.\n"
            "• Apply urea when soil is moist, and lightly irrigate afterwards to prevent volatilization loss."
        ),
        "suggestion": {"label": "Fertilizer Calculator", "path": "/fertilizer-treatment"},
    },
    {
        "triggers": ["dap", "ssp", "phosphorus", "phosphorous", "potash", "mop"],
        "title": "DAP vs SSP & Potash Management",
        "answer": (
            "Understanding Phosphatic & Potassic Fertilizers:\n"
            "• DAP (18:46:0): Best applied at sowing/basal stage placed 5 cm below seed level. Do not broadcast on top soil.\n"
            "• SSP (Single Super Phosphate, 16% P + 11% Sulfur + 19% Calcium): Excellent for oilseeds (soybean, groundnut, mustard) as sulfur boosts oil content.\n"
            "• MOP (Muriate of Potash, 60% K): Essential for grain filling, drought tolerance, and disease resistance."
        ),
        "suggestion": {"label": "Calculate Exact NPK Needs", "path": "/fertilizer-treatment"},
    },
    {
        "triggers": ["soil", "ph", "acidic", "alkaline", "saline", "chunna", "gypsum"],
        "title": "Soil pH & Correction Methods",
        "answer": (
            "Ideal soil pH for most crops is 6.5 to 7.5.\n"
            "• Acidic Soil (pH < 6.0): Add Agricultural Lime (CaCO3) @ 500-1000 kg/acre to neutralize acidity.\n"
            "• Alkaline / Sodic Soil (pH > 8.0, common in Maharashtra black soils): Apply Agricultural Gypsum @ 1-2 tonnes/acre followed by deep leaching with fresh water.\n"
            "• High pH blocks phosphorus and zinc uptake even if applied in large quantities."
        ),
        "suggestion": {"label": "Scan Soil Card", "path": "/soil-card-ocr"},
    },
    {
        "triggers": ["organic", "jeevamrit", "vermicompost", "gobar", "compost", "jaivik"],
        "title": "Organic Manures & Jeevamrit Preparation",
        "answer": (
            "Jeevamrit Preparation for 1 Acre:\n"
            "• Mix 10 kg fresh cow dung + 10 L cow urine + 2 kg jaggery (gud) + 2 kg pulse flour (besan) + a handful of virgin forest/field soil in 200 L water.\n"
            "• Stir clockwise twice daily for 4-7 days in shade.\n"
            "• Apply with irrigation water or spray diluted 1:10 as a foliar tonic to multiply beneficial soil microbes."
        ),
        "suggestion": {"label": "Track Organic Inputs", "path": "/expenses"},
    },

    # ── IRRIGATION & WEATHER ──────────────────────────────────────
    {
        "triggers": ["irrigation", "paani", "drip", "sprinkler", "watering", "sinchai"],
        "title": "Smart Irrigation Timing & Critical Stages",
        "answer": (
            "Irrigation Best Practices:\n"
            "• Water early morning (before 8 AM) or evening (after 5 PM) to reduce 25-30% evaporation loss.\n"
            "• Check moisture at 5-10 cm root zone: if soil forms a firm moist ball when squeezed, delay watering.\n"
            "• Critical watering stages: Flowering & Grain/Pod filling — moisture stress at these stages reduces yield by up to 40%.\n"
            "• Under Maharashtra MahaDBT, micro-irrigation (Drip/Sprinkler) gets up to 75-80% government subsidy."
        ),
        "suggestion": {"label": "Check Weather Outlook", "path": "/weather-advisory"},
    },
    {
        "triggers": ["spray", "spraying", "chhidkaw", "wind", "rain spray"],
        "title": "Optimal Pesticide / Foliar Spraying Rules",
        "answer": (
            "Safe Spraying Guidelines:\n"
            "• Do NOT spray if rain is forecast within 4-6 hours — chemical will wash off.\n"
            "• Avoid spraying if wind speed exceeds 15 km/h to prevent drift onto neighboring fields.\n"
            "• Ideal temperature: 20-30°C. Never spray during hot midday (>35°C) to prevent leaf scorching.\n"
            "• Always wear protective mask and use a spreader/sticker (2 ml/10L) for waxy leaves like onion and cabbage."
        ),
        "suggestion": {"label": "Check Today's Spray Score", "path": "/weather-advisory"},
    },

    # ── WEED MANAGEMENT ───────────────────────────────────────────
    {
        "triggers": ["weed", "kharpatwar", "ghas", "herbicide", "nindai", "tarbuj"],
        "title": "Weed Management & Herbicide Application",
        "answer": (
            "Effective Weed Control:\n"
            "• Pre-emergence (within 48 hours of sowing): Spray Pendimethalin 30% EC @ 1-1.25 L/acre on moist soil to suppress seed germination.\n"
            "• Post-emergence in Soybean/Pulses (at 15-20 days): Imazethapyr 10% SL @ 400 ml/acre or Quizalofop ethyl 5% EC @ 400 ml/acre.\n"
            "• In Wheat: Clodinafop-propargyl 15% WP @ 160 g/acre for grassy weeds (Phalaris minor / Mandusi).\n"
            "• Always spray herbicides using flat fan nozzle in calm wind."
        ),
        "suggestion": {"label": "Log Herbicide Costs", "path": "/expenses"},
    },

    # ── MANDI & MARKETING ─────────────────────────────────────────
    {
        "triggers": ["mandi", "msp", "market", "bhav", "rate", "bechun", "sell"],
        "title": "Maximizing Returns at APMC Mandis",
        "answer": (
            "Tips for Best Mandi Rates:\n"
            "• Test Moisture First: Produce with moisture under 10-12% commands ₹150-250 higher auction price per quintal.\n"
            "• Grade and Clean: Sieve out broken grains, dust, and immature pods before taking to mandi.\n"
            "• Watch MSP Floor: If open market trades below MSP, register at Govt. Procurement Centers (NAFED / FCI) to ensure guaranteed MSP.\n"
            "• Check nearby APMC rates in our Mandi Rates module before loading transport."
        ),
        "suggestion": {"label": "Compare Mandi Prices", "path": "/mandi-rates"},
    },

    # ── GOVERNMENT SCHEMES ────────────────────────────────────────
    {
        "triggers": ["pm kisan", "kisan samman", "6000", "installment", "kist"],
        "title": "PM-Kisan Samman Nidhi & Namo Shetkari Yojana",
        "answer": (
            "PM-Kisan provides ₹6,000/year in 3 installments of ₹2,000 directly into farmer bank accounts.\n"
            "• Maharashtra's Namo Shetkari MahaSanman Yojana adds an extra ₹6,000, giving Maharashtra farmers ₹12,000 annually.\n"
            "• Mandatory requirements: Aadhaar-seeded bank account, Land seeding (Bhumi abhilekh verified), and Active e-KYC on pmkisan.gov.in."
        ),
        "suggestion": {"label": "Check Schemes Detail", "path": "/government-schemes"},
    },
    {
        "triggers": ["solar", "pump", "kusum", "bijli", "electricity", "solar pump"],
        "title": "PM KUSUM & Magel Tyala Solar Pump Scheme",
        "answer": (
            "PM-KUSUM / Magel Tyala Saur Krishi Pump Yojana (Maharashtra):\n"
            "• Provides 90% to 95% subsidy for 3 HP, 5 HP, and 7.5 HP DC solar water pumps for farmers without traditional grid connection.\n"
            "• Apply online at mahadiscom.in / solar with 7/12 extract, Aadhaar card, and caste certificate (if applicable).\n"
            "• Delivers free daytime irrigation for 25 years with zero diesel or electricity bills."
        ),
        "suggestion": {"label": "Apply via Schemes Page", "path": "/government-schemes"},
    },
    {
        "triggers": ["insurance", "pmfby", "bima", "crop damage", "loss", "nuksan"],
        "title": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "answer": (
            "In Maharashtra, crop insurance is available under the ₹1 Crop Insurance Scheme (1 Rupaya Pik Vima Yojana).\n"
            "• Farmers pay only ₹1 token fee; state covers remaining premium.\n"
            "• Critical Rule: Report crop damage due to unseasonal rain, hail, or drought within 72 hours via the Crop Insurance App or toll-free number 1800-200-5142."
        ),
        "suggestion": {"label": "View Crop Insurance Rules", "path": "/government-schemes"},
    },
]

GREETINGS = ["hi", "hello", "hey", "namaste", "namaskar", "ram ram", "radhe radhe", "hii", "helo", "kem cho"]


def _tokenize(text: str) -> set:
    """Extract clean words and filter stopwords."""
    words = re.findall(r"\w+", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) > 1}


def get_response(message: str) -> dict:
    text = message.lower().strip()

    # 1. Greetings
    if any(text == g or text.startswith(g + " ") for g in GREETINGS):
        primary = "Namaste! I am your AgriSense Smart Farming Assistant. You can ask me about crop diseases, pest control, fertilizer dosages, weather spraying advice, live mandi rates, or government subsidies. How can I assist your farm today?"
        alternate = "Hello! Feel free to ask any farming related question, and I will help you with recommendations and information."
        return {
            "replyPrimary": primary,
            "replyAlternate": alternate,
            "suggestions": [
                {"label": "Recommend a Crop", "path": "/crop-recommendation"},
                {"label": "Scan Leaf for Disease", "path": "/disease-detection"},
                {"label": "Check Mandi Rates", "path": "/mandi-rates"},
                {"label": "Check Weather Radar", "path": "/weather-advisory"},
            ],
        }

    tokens = _tokenize(text)

    # 2. Navigation Intents (Direct app feature queries)
    for intent in NAVIGATION_INTENTS:
        if any(kw in text for kw in intent["keywords"]):
            primary = intent["reply"]
            alternate = f"You can also {intent["suggestion"]["label"].lower()} via the navigation menu."
            return {
                "replyPrimary": primary,
                "replyAlternate": alternate,
                "suggestions": [intent["suggestion"]],
            }

    # 3. Intelligent Semantic Scoring against Agronomy Knowledgebase
    best_score = 0
    best_item = None

    for item in AGRONOMY_KB:
        score = 0
        for trigger in item["triggers"]:
            if trigger in text:
                score += 3
            elif trigger in tokens:
                score += 2
        if score > best_score:
            best_score = score
            best_item = item

    if best_score >= 2 and best_item:
        primary = f"{best_item['title']}\n\n{best_item['answer']}"
        alternate = f"For more details on {best_item['title'].lower()}, you can explore the related section in the app."
        suggestions = [best_item["suggestion"]] if "suggestion" in best_item else []
        return {
            "replyPrimary": primary,
            "replyAlternate": alternate,
            "suggestions": suggestions,
        }

    # 4. Smart Fallback with Actionable Prompts
    fallback_primary = (
        "I couldn't pinpoint your exact agronomic query, but I can help you with:\n"
        "• Diagnosing leaf diseases and pest attacks (Yellow leaves, Pink bollworm, Blight, Rust)\n"
        "• Fertilizer dosages for Urea, DAP, Potash, and Nano Urea\n"
        "• Safe spraying weather conditions & irrigation timing\n"
        "• Live Maharashtra Mandi rates and MSP comparisons\n"
        "• Government schemes (PM-Kisan, ₹1 Pik Vima, Solar pump subsidy)\n\n"
        "Try rephrasing with crop name and symptom (e.g., 'tamatar me patte peele kyu ho rahe hai' or 'urea dosage')."
    )
    fallback_alternate = "You can also browse the app's sections for crop recommendation, disease detection, and more."
    return {
        "replyPrimary": fallback_primary,
        "replyAlternate": fallback_alternate,
        "suggestions": [
            {"label": "Diagnose Leaf Disease", "path": "/disease-detection"},
            {"label": "Check Mandi Rates", "path": "/mandi-rates"},
            {"label": "Calculate Fertilizer", "path": "/fertilizer-treatment"},
            {"label": "View Government Schemes", "path": "/government-schemes"},
        ],
    }