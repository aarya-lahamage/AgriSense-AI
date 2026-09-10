# Approximate soil data for Maharashtra's 9 Agro-Climatic Zones.
# Source: ICAR-ATARI Pune zone classification + standard soil-type
# science (soil type -> nutrient tendency) + cross-verified against
# 5 real published district-level studies where available.
#
# confidence = "high" -> backed by real cited research data for that zone
# confidence = "low"  -> estimated from soil-type science only (no direct study)
#
# NOTE: N, P, K values are approximated to match the scale used by our
# training dataset (Kaggle Crop Recommendation dataset), NOT raw
# Soil Health Card kg/ha units, since those use P2O5/K2O compound form.

AGRO_CLIMATIC_ZONES = {
    "south_konkan_coastal": {
        "label": "South Konkan Coastal (e.g. Ratnagiri, Sindhudurg)",
        "N": 78, "P": 9, "K": 45, "ph": 5.8,
        "confidence": "high",
        "source": "Cross-verified with Sindhudurg district soil study (Phytojournal, 2018)",
    },
    "north_konkan_coastal": {
        "label": "North Konkan Coastal (e.g. Thane, Raigad)",
        "N": 72, "P": 10, "K": 48, "ph": 6.0,
        "confidence": "low",
        "source": "Estimated from non-lateritic soil-type tendency",
    },
    "western_ghat": {
        "label": "Western Ghat Hill Zone (parts of Kolhapur, Satara, Pune, Nashik)",
        "N": 66, "P": 12, "K": 40, "ph": 5.5,
        "confidence": "low",
        "source": "Estimated from light hill-soil tendency",
    },
    "sub_mountain_transition1": {
        "label": "Sub-Mountain Zone (Transition-1)",
        "N": 69, "P": 13, "K": 44, "ph": 6.2,
        "confidence": "low",
        "source": "Estimated from red-brown soil tendency",
    },
    "western_mh_plain_transition2": {
        "label": "Western Maharashtra Plain (Transition-2)",
        "N": 60, "P": 15, "K": 85, "ph": 7.0,
        "confidence": "high",
        "source": "Explicit regional description: 'Poor N, Low-Med P, Well-supplied K'",
    },
    "western_mh_scarcity": {
        "label": "Western Maharashtra Scarcity Zone (e.g. Solapur)",
        "N": 63, "P": 14, "K": 80, "ph": 7.5,
        "confidence": "low",
        "source": "Estimated from calcareous vertisol tendency",
    },
    "central_mh_plateau": {
        "label": "Central Maharashtra Plateau (e.g. Aurangabad, Beed, Jalna)",
        "N": 69, "P": 11, "K": 105, "ph": 7.2,
        "confidence": "high",
        "source": "Cross-verified with Beed district soil study (Scholars Research Library, 2018)",
    },
    "central_vidarbha": {
        "label": "Central Vidarbha (e.g. Nagpur, Amravati, Wardha)",
        "N": 68, "P": 24, "K": 97, "ph": 7.0,
        "confidence": "high",
        "source": "Cross-verified with Nagpur district soil study (Academia.edu, 2018-19)",
    },
    "eastern_vidarbha": {
        "label": "Eastern Vidarbha (e.g. Bhandara, parts of Chandrapur)",
        "N": 72, "P": 13, "K": 62, "ph": 6.5,
        "confidence": "low",
        "source": "Estimated from granite-derived soil tendency",
    },
}

# Approximate mapping of major Maharashtra districts to their dominant
# agro-climatic zone. Some districts genuinely span more than one zone
# (e.g. Pune has both plains and hill areas) — mapped here to ONE
# dominant zone for simplicity. This is a disclosed approximation.

DISTRICT_TO_ZONE = {
    "Ratnagiri": "south_konkan_coastal",
    "Sindhudurg": "south_konkan_coastal",
    "Thane": "north_konkan_coastal",
    "Raigad": "north_konkan_coastal",
    "Palghar": "north_konkan_coastal",
    "Mumbai": "north_konkan_coastal",
    "Mumbai Suburban": "north_konkan_coastal",
    "Kolhapur": "western_ghat",
    "Satara": "western_ghat",
    "Pune": "western_ghat",
    "Nashik": "western_ghat",
    "Ahmednagar": "sub_mountain_transition1",
    "Dhule": "sub_mountain_transition1",
    "Nandurbar": "sub_mountain_transition1",
    "Jalgaon": "sub_mountain_transition1",
    "Sangli": "western_mh_plain_transition2",
    "Solapur": "western_mh_scarcity",
    "Chhatrapati Sambhajinagar": "central_mh_plateau",
    "Aurangabad": "central_mh_plateau",
    "Jalna": "central_mh_plateau",
    "Beed": "central_mh_plateau",
    "Dharashiv": "central_mh_plateau",
    "Osmanabad": "central_mh_plateau",
    "Latur": "central_mh_plateau",
    "Nanded": "central_mh_plateau",
    "Parbhani": "central_mh_plateau",
    "Hingoli": "central_mh_plateau",
    "Nagpur": "central_vidarbha",
    "Amravati": "central_vidarbha",
    "Wardha": "central_vidarbha",
    "Yavatmal": "central_vidarbha",
    "Akola": "central_vidarbha",
    "Washim": "central_vidarbha",
    "Buldhana": "central_vidarbha",
    "Bhandara": "eastern_vidarbha",
    "Gondia": "eastern_vidarbha",
    "Chandrapur": "eastern_vidarbha",
    "Gadchiroli": "eastern_vidarbha",
}


MAHARASHTRA_CITIES = [
    {"name": "Mumbai", "district": "Mumbai", "lat": 19.0760, "lon": 72.8777},
    {"name": "Navi Mumbai", "district": "Thane", "lat": 19.0330, "lon": 73.0297},
    {"name": "Thane", "district": "Thane", "lat": 19.2183, "lon": 72.9781},
    {"name": "Pune", "district": "Pune", "lat": 18.5204, "lon": 73.8567},
    {"name": "Pimpri-Chinchwad", "district": "Pune", "lat": 18.6298, "lon": 73.7997},
    {"name": "Nagpur", "district": "Nagpur", "lat": 21.1458, "lon": 79.0882},
    {"name": "Nashik", "district": "Nashik", "lat": 19.9975, "lon": 73.7898},
    {"name": "Nanded", "district": "Nanded", "lat": 19.1383, "lon": 77.3210},
    {"name": "Nandurbar", "district": "Nandurbar", "lat": 21.3667, "lon": 74.2400},
    {"name": "Aurangabad", "district": "Chhatrapati Sambhajinagar", "lat": 19.8762, "lon": 75.3433},
    {"name": "Chhatrapati Sambhajinagar", "district": "Chhatrapati Sambhajinagar", "lat": 19.8762, "lon": 75.3433},
    {"name": "Solapur", "district": "Solapur", "lat": 17.6599, "lon": 75.9064},
    {"name": "Kolhapur", "district": "Kolhapur", "lat": 16.7050, "lon": 74.2433},
    {"name": "Amravati", "district": "Amravati", "lat": 20.9374, "lon": 77.7796},
    {"name": "Akola", "district": "Akola", "lat": 20.7096, "lon": 77.0022},
    {"name": "Sangli", "district": "Sangli", "lat": 16.8524, "lon": 74.5815},
    {"name": "Jalgaon", "district": "Jalgaon", "lat": 21.0077, "lon": 75.5626},
    {"name": "Latur", "district": "Latur", "lat": 18.4088, "lon": 76.5604},
    {"name": "Dhule", "district": "Dhule", "lat": 20.9042, "lon": 74.7749},
    {"name": "Ahmednagar", "district": "Ahmednagar", "lat": 19.0952, "lon": 74.7496},
    {"name": "Chandrapur", "district": "Chandrapur", "lat": 19.9615, "lon": 79.2961},
    {"name": "Parbhani", "district": "Parbhani", "lat": 19.2704, "lon": 76.7607},
    {"name": "Jalna", "district": "Jalna", "lat": 19.8410, "lon": 75.8864},
    {"name": "Bhandara", "district": "Bhandara", "lat": 21.1700, "lon": 79.6500},
    {"name": "Gondia", "district": "Gondia", "lat": 21.4602, "lon": 80.1922},
    {"name": "Beed", "district": "Beed", "lat": 18.9891, "lon": 75.7601},
    {"name": "Yavatmal", "district": "Yavatmal", "lat": 20.3888, "lon": 78.1204},
    {"name": "Wardha", "district": "Wardha", "lat": 20.7453, "lon": 78.6022},
    {"name": "Osmanabad", "district": "Dharashiv", "lat": 18.1860, "lon": 76.0419},
    {"name": "Dharashiv", "district": "Dharashiv", "lat": 18.1860, "lon": 76.0419},
    {"name": "Washim", "district": "Washim", "lat": 20.1094, "lon": 77.1333},
    {"name": "Buldhana", "district": "Buldhana", "lat": 20.5293, "lon": 76.1809},
    {"name": "Hingoli", "district": "Hingoli", "lat": 19.7151, "lon": 77.1447},
    {"name": "Gadchiroli", "district": "Gadchiroli", "lat": 20.1809, "lon": 80.0021},
    {"name": "Ratnagiri", "district": "Ratnagiri", "lat": 16.9902, "lon": 73.3120},
    {"name": "Sindhudurg", "district": "Sindhudurg", "lat": 16.3667, "lon": 73.6833},
    {"name": "Palghar", "district": "Palghar", "lat": 19.6969, "lon": 72.7695},
    {"name": "Alibag", "district": "Raigad", "lat": 18.6414, "lon": 72.8722},
    {"name": "Satara", "district": "Satara", "lat": 17.6805, "lon": 74.0183},
    {"name": "Karad", "district": "Satara", "lat": 17.2891, "lon": 74.1826},
    {"name": "Baramati", "district": "Pune", "lat": 18.1514, "lon": 74.5815},
    {"name": "Malegaon", "district": "Nashik", "lat": 20.5579, "lon": 74.5287},
    {"name": "Ichalkaranji", "district": "Kolhapur", "lat": 16.6919, "lon": 74.4602},
]