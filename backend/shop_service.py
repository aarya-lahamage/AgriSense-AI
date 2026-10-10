import requests
import math
import re
from typing import List, Dict, Set, Tuple

# Mirrors for Overpass API
MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
]

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return distance in kilometres between two lat/lon points using the Haversine formula."""
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def _build_query(radius_m: int, lat: float, lon: float) -> str:
    """Construct an Overpass QL query searching for agricultural supply shops."""
    query = f"""[out:json][timeout:25];
(
  nwr["shop"="agrarian"](around:{radius_m},{lat},{lon});
  nwr["shop"="trade"]["trade"="agricultural_supplies"](around:{radius_m},{lat},{lon});
  nwr["shop"="garden_centre"](around:{radius_m},{lat},{lon});
  nwr["shop"="country_store"](around:{radius_m},{lat},{lon});
  nwr["shop"]["name"~"krushi|krishi|agro|agri|kisan|fertili|khad|beej|seed",i](around:{radius_m},{lat},{lon});
  node["name"~"krushi|krishi|agro|agri|kisan|fertili|khad|beej|seed",i](around:{radius_m},{lat},{lon});
);
out center tags;"""
    return query.strip()


def _fetch_overpass(query: str) -> Tuple[List[Dict], List[Dict]]:
    """Execute the Overpass query against mirrors, falling back if needed."""
    headers = {"User-Agent": "AgriSenseAI-StudentProject/1.0"}
    attempts = []
    for url in MIRRORS:
        try:
            resp = requests.post(url, data={"data": query}, headers=headers, timeout=8)
            attempts.append({"mirror": url, "status_code": resp.status_code})
            if resp.status_code == 200:
                data = resp.json()
                return data.get("elements", []), attempts
        except Exception as e:
            attempts.append({"mirror": url, "error": str(e)})
            continue
    return [], attempts


def _is_excluded(tags: Dict) -> bool:
    """Return True if the element is non-agri (amenities, restaurants, butcher, hotels, tutorials, etc.)."""
    excluded_amenities = {
        "restaurant", "cafe", "fast_food", "school", "college", "hospital",
        "bank", "hotel", "atm", "pharmacy", "fuel", "place_of_worship", "bar", "pub"
    }
    excluded_tourism = {"museum", "gallery", "zoo", "viewpoint", "hotel", "guest_house", "hostel", "motel"}
    excluded_shops = {"butcher", "seafood", "fish", "clothes", "shoes", "hairdresser", "beauty", "jewelry"}

    amenity = tags.get("amenity")
    if amenity in excluded_amenities:
        return True

    tourism = tags.get("tourism")
    if tourism in excluded_tourism:
        return True

    shop = tags.get("shop")
    if shop in excluded_shops:
        return True

    name = tags.get("name", "").lower()
    if re.search(r"\b(fish|chicken|mutton|meat|hotel|school|college|hospital|bank|tutorials|classes|coaching|institute|academy)\b", name):
        return True

    return False


def _format_address(tags: Dict) -> str:
    parts = []
    for key in ["addr:housenumber", "addr:street", "addr:suburb", "addr:city", "addr:state", "addr:postcode"]:
        if tags.get(key):
            parts.append(tags[key])
    return ", ".join(parts)


def find_nearby_shops(lat: float, lon: float, radius_km: float = 15.0) -> Dict:
    """Return nearby agricultural supply shops using progressive radius (15 -> 40 -> 80 km)."""
    radii = [15, 40, 80]
    seen_ids: Set[int] = set()
    collected: List[Dict] = []
    used_radius = radii[0]
    all_attempts: List[Dict] = []
    service_failed = True

    for r in radii:
        used_radius = r
        radius_m = int(r * 1000)
        query = _build_query(radius_m, lat, lon)
        elements, attempts = _fetch_overpass(query)
        all_attempts.extend(attempts)

        if any(a.get("status_code") == 200 for a in attempts):
            service_failed = False

        for el in elements:
            el_id = el.get("id")
            if el_id in seen_ids:
                continue

            tags = el.get("tags", {})
            if _is_excluded(tags):
                continue

            # Determine coordinates
            if el["type"] == "node":
                el_lat, el_lon = el.get("lat"), el.get("lon")
            elif el["type"] in {"way", "relation"} and "center" in el:
                el_lat, el_lon = el["center"].get("lat"), el["center"].get("lon")
            else:
                continue

            if el_lat is None or el_lon is None:
                continue

            distance = _haversine(lat, lon, el_lat, el_lon)
            name = tags.get("name")
            if not name or name.strip() == "":
                # Fallback readable name based on shop type
                shop_type = tags.get("shop", "Agricultural Supplies")
                name = f"{shop_type.replace('_', ' ').title()} Store"

            address = _format_address(tags)
            phone = tags.get("phone") or tags.get("contact:phone") or ""

            shop_obj = {
                "name": name,
                "distance_km": round(distance, 1),
                "lat": round(el_lat, 5),
                "lon": round(el_lon, 5),
                "address": address,
                "phone": phone,
            }
            collected.append(shop_obj)
            seen_ids.add(el_id)

        if len(collected) >= 3:
            break

    if service_failed and not collected:
        return {
            "status": "service_error",
            "shops": [],
            "radius_km": used_radius,
            "attempts": all_attempts,
        }

    collected.sort(key=lambda s: s["distance_km"])
    shops = collected[:8]

    if not shops:
        return {
            "status": "no_results",
            "shops": [],
            "radius_km": used_radius,
            "attempts": all_attempts,
        }

    return {
        "status": "ok",
        "shops": shops,
        "radius_km": used_radius,
        "attempts": all_attempts,
    }


# Backwards compatibility alias
get_nearby_shops = find_nearby_shops
