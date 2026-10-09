import requests
import math
import re
from typing import List, Dict, Set

# Mirrors for Overpass API
MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter"
]

# --------------------- Helper functions ---------------------

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
    """Construct a single Overpass QL query string.

    The query looks for:
    * shop=agrarian
    * shop=trade & trade=agricultural_supplies
    * shop=garden_centre
    * shop=country_store
    * any element whose name matches common agri‑keywords (case‑insensitive)
    The search is performed on nodes, ways and relations (nwr).
    """
    name_regex = "(?i)krushi|krishi|agro|agri|kisan|fertili|khad|seed"
    query = f"""
[out:json][timeout:30];
(
  nwr[\"shop\"] = \"agrarian\"(around:{radius_m},{lat},{lon});
  nwr[\"shop\"] = \"trade\"[\"trade\"] = \"agricultural_supplies\"(around:{radius_m},{lat},{lon});
  nwr[\"shop\"] = \"garden_centre\"(around:{radius_m},{lat},{lon});
  nwr[\"shop\"] = \"country_store\"(around:{radius_m},{lat},{lon});
  nwr[\"name\"]~\"{name_regex}\"(around:{radius_m},{lat},{lon});
);
out center tags;"""
    return query.strip()

def _fetch_overpass(query: str) -> List[Dict]:
    """Execute the Overpass query against mirrors, falling back if needed.
    Returns the list of OSM elements. Raises exception if all fail."""
    headers = {"User-Agent": "AgriSenseAI-StudentProject/1.0"}
    for url in MIRRORS:
        try:
            resp = requests.post(url, data={"data": query}, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            return data.get("elements", [])
        except Exception:
            continue
    raise ConnectionError("All mirrors failed")

def _is_excluded(tags: Dict) -> bool:
    """Return True if the element should be ignored because it is a non‑shop amenity.
    We exclude typical public‑service or hospitality tags.
    """
    excluded_amenities = {"restaurant", "cafe", "school", "college", "hospital", "bank", "hotel"}
    excluded_tourism = {"museum", "gallery", "zoo", "viewpoint"}
    if tags.get("amenity") in excluded_amenities:
        return True
    if tags.get("tourism") in excluded_tourism:
        return True
    return False

def _format_address(tags: Dict) -> str:
    parts = []
    for key in ["addr:housenumber", "addr:street", "addr:city", "addr:state", "addr:postcode"]:
        if tags.get(key):
            parts.append(tags[key])
    return ", ".join(parts)

# --------------------- Public API ---------------------

def get_nearby_shops(lat: float, lon: float, radius_km: float = 15.0) -> Dict:
    """Return nearby agricultural‑shop information.

    The function searches progressively larger radii (15 km → 40 km → 80 km) until at
    least three distinct results are found or the maximum radius is reached.
    The returned dictionary contains:
        * ``shops`` – list of up‑to‑8 shop dictionaries (name, distance_km, lat, lon,
          address, phone).
        * ``radius_km`` – the radius that finally produced the result set.
        * ``message`` – optional friendly message when no shops are found.
    """
    radii = [15, 40, 80]
    seen_ids: Set[int] = set()
    collected: List[Dict] = []
    used_radius = radii[-1]
    try:
        for r in radii:
            radius_m = int(r * 1000)
            query = _build_query(radius_m, lat, lon)
            elements = _fetch_overpass(query)
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
                name = tags.get("name", "Unnamed")
                address = _format_address(tags)
                phone = tags.get("phone") or tags.get("contact:phone") or ""
                shop_obj = {
                    "name": name,
                    "distance_km": round(distance, 1),
                    "lat": el_lat,
                    "lon": el_lon,
                    "address": address,
                    "phone": phone,
                }
                collected.append(shop_obj)
                seen_ids.add(el_id)
            if len(collected) >= 3:
                used_radius = r
                break
            else:
                used_radius = r
    except ConnectionError:
        if not collected:
            return {"status": "service_error", "shops": []}
        
    collected.sort(key=lambda s: s["distance_km"])
    shops = collected[:8]
    if not shops:
        return {"status": "no_results", "shops": [], "radius_km": used_radius}
    return {"status": "success", "shops": shops, "radius_km": used_radius}
