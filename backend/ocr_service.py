"""
OCR service for extracting soil parameters from soil health card images.
Extracts: pH, EC, Organic Carbon, Nitrogen, Phosphorus, Potassium,
          Sulphur, Zinc, Boron, Iron, Manganese, Copper — with values and units.

Architecture:
1. Google Gemini Vision API (zero external OS binary needed, 100% cloud-reliable).
2. Native Windows Media OCR (built into Windows 10/11) if available.
3. Tesseract OCR fallback if installed.
"""

import re
import os
import io
import json
import base64
import platform
import requests
from PIL import Image, ImageOps

# ── Check available local engines ─────────────────────────────────
_WINRT_OCR_AVAILABLE = False
try:
    if platform.system() == "Windows":
        import winrt.windows.graphics.imaging as win_imaging
        import winrt.windows.media.ocr as win_ocr
        import winrt.windows.storage.streams as win_streams
        _WINRT_OCR_AVAILABLE = True
except Exception:
    _WINRT_OCR_AVAILABLE = False

_TESSERACT_AVAILABLE = False
try:
    import pytesseract
    if platform.system() == "Windows":
        _WIN_PATHS = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expanduser(r"~\AppData\Local\Tesseract-OCR\tesseract.exe"),
            os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
        ]
        for p in _WIN_PATHS:
            if os.path.isfile(p):
                pytesseract.pytesseract.tesseract_cmd = p
                _TESSERACT_AVAILABLE = True
                break
    else:
        # Check if tesseract binary exists in path
        import shutil
        if shutil.which("tesseract"):
            _TESSERACT_AVAILABLE = True
except Exception:
    _TESSERACT_AVAILABLE = False


# ── Image Preprocessing ─────────────────────────────────────────

def _preprocess_image(img: Image.Image) -> Image.Image:
    """Correct orientation and scale for maximum OCR accuracy."""
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    if img.mode != "RGB":
        img = img.convert("RGB")

    w, h = img.size
    if max(w, h) < 1800:
        scale = 1800 / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    return img


# ── Cloud Vision OCR via Gemini (High Precision & Universal) ──────

def _run_gemini_vision_ocr(img: Image.Image) -> dict:
    """
    Use Gemini Vision API to accurately extract soil parameters directly from image.
    Requires GEMINI_API_KEY (already configured in production).
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    model = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest").strip() or "gemini-flash-lite-latest"

    # Convert image to JPEG bytes
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG", quality=90)
    img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    prompt = (
        "You are an expert Indian Government Soil Health Card OCR parser. "
        "Analyze this soil card document and extract the numerical test results for these 12 soil parameters:\n"
        "- pH\n"
        "- EC (Electrical Conductivity in dS/m)\n"
        "- OC (Organic Carbon in %)\n"
        "- N (Available Nitrogen in kg/ha)\n"
        "- P (Available Phosphorus in kg/ha)\n"
        "- K (Available Potassium in kg/ha)\n"
        "- S (Available Sulphur in ppm)\n"
        "- Zn (Available Zinc in ppm)\n"
        "- B (Available Boron in ppm)\n"
        "- Fe (Available Iron in ppm)\n"
        "- Mn (Available Manganese in ppm)\n"
        "- Cu (Available Copper in ppm)\n\n"
        "Return ONLY a valid JSON object with keys: \"raw_text\" (a full textual transcription of the card's table/text) "
        "and a dictionary \"extracted\" containing key-value pairs where key is one of pH, EC, OC, N, P, K, S, Zn, B, Fe, Mn, Cu "
        "and value is a float number (or null if not found on the card). "
        "Do NOT return markdown fences like ```json, return only the raw JSON."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": img_b64
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 1024
        }
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    res = requests.post(url, params={"key": api_key}, json=payload, timeout=30)
    
    if res.status_code != 200:
        error_msg = res.text
        try:
            error_msg = res.json().get("error", {}).get("message", error_msg)
        except Exception:
            pass
        raise RuntimeError(f"Vision API request failed: {error_msg}")

    data = res.json()
    candidates = data.get("candidates", [])
    if not candidates:
        raise RuntimeError("No response from Vision OCR model.")

    part_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
    
    # Strip markdown if present
    if part_text.startswith("```"):
        part_text = re.sub(r"^```(?:json)?\s*", "", part_text)
        part_text = re.sub(r"\s*```$", "", part_text)

    parsed = json.loads(part_text)
    return parsed


# ── Windows Native Media OCR Execution ──────────────────────────

def _run_windows_media_ocr(img: Image.Image) -> str:
    """Execute Windows 10/11 native OCR engine with spatial line reconstruction."""
    import winrt.windows.graphics.imaging as win_imaging
    import winrt.windows.media.ocr as win_ocr
    import winrt.windows.storage.streams as win_streams

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    data = buf.getvalue()

    writer = win_streams.DataWriter()
    writer.write_bytes(data)
    stream = win_streams.InMemoryRandomAccessStream()
    stream.write_async(writer.detach_buffer()).get()
    stream.seek(0)

    decoder = win_imaging.BitmapDecoder.create_async(stream).get()
    bitmap = decoder.get_software_bitmap_async().get()

    engine = win_ocr.OcrEngine.try_create_from_user_profile_languages()
    if engine is None:
        import winrt.windows.globalization as glob
        engine = win_ocr.OcrEngine.try_create_from_language(glob.Language("en-US"))

    if engine is None:
        raise RuntimeError("Windows Media OCR engine could not be initialized.")

    result = engine.recognize_async(bitmap).get()

    lines = list(result.lines)
    if not lines:
        return result.text

    rows = {}
    for line in lines:
        if not line.words:
            continue
        y = line.words[0].bounding_rect.y
        matched = None
        for bucket_y in rows:
            if abs(bucket_y - y) <= 16:
                matched = bucket_y
                break
        if matched is None:
            rows[y] = [line]
        else:
            rows[matched].append(line)

    reconstructed_lines = []
    for y in sorted(rows.keys()):
        row_lines = sorted(rows[y], key=lambda l: l.words[0].bounding_rect.x)
        reconstructed_lines.append("  |  ".join(l.text for l in row_lines))

    return "\n".join(reconstructed_lines)


# ── Tesseract OCR Execution ─────────────────────────────────────

def _run_tesseract(img: Image.Image) -> str:
    """Fallback execution via Tesseract binary."""
    gray = img.convert("L")
    gray = ImageOps.autocontrast(gray, cutoff=2)
    return pytesseract.image_to_string(gray, config="--psm 6")


# ── Parameter Extraction Logic from Regex Text ──────────────────

_UNIT_MAP = {
    "pH": "",
    "EC": "dS/m",
    "OC": "%",
    "N": "kg/ha",
    "P": "kg/ha",
    "K": "kg/ha",
    "S": "ppm",
    "Zn": "ppm",
    "B": "ppm",
    "Fe": "ppm",
    "Mn": "ppm",
    "Cu": "ppm",
}

_PARAM_LABELS = {
    "pH": "pH Reading",
    "EC": "Electrical Conductivity (EC)",
    "OC": "Organic Carbon (OC)",
    "N": "Available Nitrogen (N)",
    "P": "Available Phosphorus (P)",
    "K": "Available Potassium (K)",
    "S": "Available Sulphur (S)",
    "Zn": "Available Zinc (Zn)",
    "B": "Available Boron (B)",
    "Fe": "Available Iron (Fe)",
    "Mn": "Available Manganese (Mn)",
    "Cu": "Available Copper (Cu)",
}


def _clean_val(s: str) -> float | None:
    if not s:
        return None
    s = s.replace(",", ".").strip()
    try:
        val = float(s)
        return val
    except ValueError:
        return None


def extract_soil_params(text: str) -> dict:
    """
    Regex fallback extractor for raw text parsed from OCR.
    """
    params = {}
    lines = text.split("\n")

    for line in lines:
        l = line.strip()
        lower = l.lower()

        # pH
        if re.search(r"\bph\b", lower):
            m = re.search(r"\bph\b[^\d]*([0-9]+\.?[0-9]*)", l, re.I)
            if m and "pH" not in params:
                val = _clean_val(m.group(1))
                if val and 3.0 <= val <= 11.0:
                    params["pH"] = val

        # EC
        if "ec" in lower or "conduct" in lower:
            m = re.search(r"(?:ec|conduct)[^\d]*([0-9]+\.?[0-9]*)", l, re.I)
            if m and "EC" not in params:
                val = _clean_val(m.group(1))
                if val and val <= 20.0:
                    params["EC"] = val

        # OC
        if "carbon" in lower or re.search(r"\boc\b", lower):
            m = re.search(r"(?:carbon|\boc\b)[^\d]*([0-9]+\.?[0-9]*)", l, re.I)
            if m and "OC" not in params:
                val = _clean_val(m.group(1))
                if val and val <= 10.0:
                    params["OC"] = val

        # Nitrogen (N)
        if "nitrogen" in lower or "(n)" in lower:
            m = re.search(r"(?:nitrogen|\(n\))[^\d]*([0-9]+\.?[0-9]*)", l, re.I)
            if m and "N" not in params:
                val = _clean_val(m.group(1))
                if val:
                    params["N"] = val

        # Phosphorus (P)
        if "phosphorus" in lower or "(p)" in lower:
            m = re.search(r"(?:phosphorus|\(p\))[^\d]*([0-9]+\.?[0-9]*)", l, re.I)
            if m and "P" not in params:
                val = _clean_val(m.group(1))
                if val:
                    params["P"] = val

        # Potassium (K)
        if "potassium" in lower or "(k)" in lower:
            m = re.search(r"(?:potassium|\(k\))[^\d]*([0-9]+\.?[0-9]*)", l, re.I)
            if m and "K" not in params:
                val = _clean_val(m.group(1))
                if val:
                    params["K"] = val

    return params


def ocr_soil_card(image_file) -> dict:
    """
    Run OCR on an uploaded image file and extract all 12 soil parameters.
    Prioritizes Gemini Vision API (works on all cloud servers without Tesseract),
    and falls back to Windows Media OCR or Tesseract if local.
    """
    img = Image.open(image_file)
    img = _preprocess_image(img)

    raw_text = ""
    extracted = {}

    # 1. Primary Cloud Engine: Gemini Vision
    if os.getenv("GEMINI_API_KEY"):
        try:
            cloud_res = _run_gemini_vision_ocr(img)
            raw_text = cloud_res.get("raw_text", "")
            extracted = {k: v for k, v in cloud_res.get("extracted", {}).items() if v is not None}
        except Exception as e:
            print(f"[ocr_service] Cloud Vision attempt error: {e}")

    # 2. Local fallback if Cloud Vision didn't complete
    if not extracted:
        if _WINRT_OCR_AVAILABLE:
            raw_text = _run_windows_media_ocr(img)
            extracted = extract_soil_params(raw_text)
        elif _TESSERACT_AVAILABLE:
            raw_text = _run_tesseract(img)
            extracted = extract_soil_params(raw_text)
        elif not raw_text:
            raise RuntimeError(
                "OCR processing failed: Cloud Vision API key is missing and local Tesseract/Windows OCR is not available on this host."
            )

    # Build structured parameters list
    parameters = []
    for key in ["pH", "EC", "OC", "N", "P", "K", "S", "Zn", "B", "Fe", "Mn", "Cu"]:
        parameters.append({
            "key": key,
            "name": _PARAM_LABELS[key],
            "value": extracted.get(key),
            "unit": _UNIT_MAP.get(key, ""),
        })

    return {
        "raw_text": raw_text or "Processed via Intelligent Vision Parser",
        "parameters": parameters,
        **extracted,
    }
