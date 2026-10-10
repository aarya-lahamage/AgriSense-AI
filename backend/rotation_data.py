# Static agronomic crop rotation recommendations for common crops in Maharashtra and India

ROTATION_DATA = {
    "rice": [
        {
            "next_crop": "Chickpea / Gram",
            "season": "Rabi",
            "reason": "Legumes fix atmospheric nitrogen to restore depleted soil fertility after heavy nitrogen uptake by rice."
        },
        {
            "next_crop": "Wheat",
            "season": "Rabi",
            "reason": "Traditional cereal-cereal sequence that thrives on residual soil moisture with minimal turnaround time."
        },
        {
            "next_crop": "Mustard",
            "season": "Rabi",
            "reason": "Deep taproot breaks the hard plow pan formed during rice puddling and extracts residual nutrients."
        }
    ],
    "wheat": [
        {
            "next_crop": "Soybean",
            "season": "Kharif",
            "reason": "Replenishes nitrogen consumed by wheat and requires moderate water during the monsoon onset."
        },
        {
            "next_crop": "Moong / Green Gram",
            "season": "Zaid / Summer",
            "reason": "Short-duration summer pulse that fits easily between wheat harvest and kharif planting while enriching soil."
        },
        {
            "next_crop": "Cotton",
            "season": "Kharif",
            "reason": "Deep rooting pattern explores lower soil strata compared to wheat's shallow fibrous roots."
        }
    ],
    "cotton": [
        {
            "next_crop": "Wheat",
            "season": "Rabi",
            "reason": "Breaks the cycle of devastating cotton pests (like pink bollworm) and reduces soil-borne pathogens."
        },
        {
            "next_crop": "Chickpea / Bengal Gram",
            "season": "Rabi",
            "reason": "Adds organic nitrogen back to the field and prevents nutrient exhaustion from prolonged cotton growth."
        },
        {
            "next_crop": "Sorghum / Jowar",
            "season": "Rabi / Summer",
            "reason": "High biomass crop that adds valuable organic mulch and tolerates drier conditions."
        }
    ],
    "sugarcane": [
        {
            "next_crop": "Soybean or Chickpea",
            "season": "Kharif / Rabi",
            "reason": "Provides a crucial break from intensive sugarcane cultivation to restore soil structure and organic carbon."
        },
        {
            "next_crop": "Wheat",
            "season": "Rabi",
            "reason": "Common rotation following ratoon cane destruction to diversify crop family and break pest cycles."
        },
        {
            "next_crop": "Green Manure (Dhaincha / Sunn Hemp)",
            "season": "Pre-Kharif",
            "reason": "Significantly improves soil microbial health and soil organic matter depleted over multiple ratoon years."
        }
    ],
    "soybean": [
        {
            "next_crop": "Wheat",
            "season": "Rabi",
            "reason": "Wheat directly benefits from residual nitrogen fixed by soybean nodules, cutting fertilizer costs."
        },
        {
            "next_crop": "Chickpea",
            "season": "Rabi",
            "reason": "Low water requirement pulse that sustains soil friability and performs well on black cotton soils."
        },
        {
            "next_crop": "Onion",
            "season": "Late Kharif / Rabi",
            "reason": "Provides a high-value cash crop option following early-maturing soybean varieties."
        }
    ],
    "onion": [
        {
            "next_crop": "Maize",
            "season": "Kharif",
            "reason": "Heavy feeder that absorbs leftover nutrients from onion fertilization and requires different weed management."
        },
        {
            "next_crop": "Soybean",
            "season": "Kharif",
            "reason": "Restores soil microbial flora after intensive fungicide and pesticide sprays often used on onion."
        },
        {
            "next_crop": "Groundnut",
            "season": "Summer / Kharif",
            "reason": "Prevents buildup of onion root rot and basal rot fungal spores through non-host crop rotation."
        }
    ],
    "grapes": [
        {
            "next_crop": "Leguminous Intercrops (Cowpea / Sunn Hemp)",
            "season": "Inter-row",
            "reason": "Provides living green manure between vineyard rows, controls erosion, and suppresses noxious weeds."
        },
        {
            "next_crop": "Marigold",
            "season": "Inter-row",
            "reason": "Acts as an effective bio-fumigant and natural repellent against soil nematodes attacking grape vine roots."
        }
    ],
    "tomato": [
        {
            "next_crop": "Sweet Corn / Maize",
            "season": "Next Season",
            "reason": "Non-solanaceous crop that starves out tomato bacterial wilt and early blight fungal spores."
        },
        {
            "next_crop": "French Beans / Cowpea",
            "season": "Next Season",
            "reason": "Fixes nitrogen and gives solanaceous vegetables a needed rest period to halt nematode buildup."
        },
        {
            "next_crop": "Marigold",
            "season": "Next Season",
            "reason": "Nematicidal root exudates clear root-knot nematodes before planting subsequent vegetables."
        }
    ],
    "maize": [
        {
            "next_crop": "Chickpea",
            "season": "Rabi",
            "reason": "Fixes nitrogen after maize's heavy nutrient extraction and uses residual post-monsoon soil moisture."
        },
        {
            "next_crop": "Mustard",
            "season": "Rabi",
            "reason": "Diversifies root depth and utilizes residual phosphorous efficiently."
        }
    ],
    "chickpea": [
        {
            "next_crop": "Sorghum / Jowar",
            "season": "Kharif",
            "reason": "Utilizes residual organic nitrogen and breaks soil pathogen cycles."
        },
        {
            "next_crop": "Cotton",
            "season": "Kharif",
            "reason": "Deep-rooted cash crop that benefits from nitrogen fixed during the rabi season."
        }
    ]
}

# Generic fallback for unlisted crops
DEFAULT_ROTATION = [
    {
        "next_crop": "Legume / Pulse (Chickpea or Moong)",
        "season": "Next Season",
        "reason": "Rebuilds depleted soil nitrogen naturally and improves root-zone microbial activity."
    },
    {
        "next_crop": "Green Manure (Sunn Hemp / Dhaincha)",
        "season": "Pre-Season",
        "reason": "Suppresses soil-borne pathogens and adds high-quality organic matter before the next major crop."
    }
]
