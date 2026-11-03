"""
OCR service for extracting soil parameters from soil health card images.
Extracts: pH, EC, Organic Carbon, Nitrogen, Phosphorus, Potassium,
          Sulphur, Zinc, Boron, Iron, Manganese, Copper — with values and units.

Architecture:
1. Native Windows Media OCR (built into Windows 10/11) — zero external binary needed.
2. Tesseract OCR fallback — used if installed and available on system PATH.
"""

import re
import os
import io
import platform
from PIL import Image, ImageOps

# ── Check available engines ──────────────────────────────────────
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
        _TESSERACT_AVAILABLE = True
except Exception:
    _TESSERACT_AVAILABLE = False


def _check_available():
    if not _WINRT_OCR_AVAILABLE and not _TESSERACT_AVAILABLE:
        raise RuntimeError(
            "No OCR engine available. On Windows, ensure 'winocr' is installed, "
            "or install Tesseract-OCR."
        )


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


# ── Parameter Extraction Logic ──────────────────────────────────

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
    s = (
        s.replace("SS", "85")
        .replace("O", "0")
        .replace("o", "0")
        .replace("l", "1")
        .replace(",", ".")
        .replace(";", ".")
    )
    m = re.search(r"(\d+(?:\.\d+)?)", s)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            return None
    return None


def extract_soil_params(raw_text: str) -> dict:
    """Parse all 12 chemical parameters from structured lines or raw text."""
    params = {}
    lines = raw_text.splitlines()

    for l in lines:
        lower = l.lower()

        # 1. pH
        if "alkaline" in lower or "acidic" in lower or "neutral" in lower:
            m = re.search(r"([0-9]+\.[0-9]+)", l)
            if m and "pH" not in params:
                val = float(m.group(1))
                if 3.0 <= val <= 11.0:
                    params["pH"] = val
        elif "ph" in lower and "phosph" not in lower and "sulph" not in lower:
            m = re.search(r"(?:ph|\bph\b)[^\d]*([0-9]+\.[0-9]+)", l, re.I)
            if m and "pH" not in params:
                val = float(m.group(1))
                if 3.0 <= val <= 11.0:
                    params["pH"] = val

        # 2. EC (Electrical Conductivity)
        if "ds" in lower or "ec" in lower:
            m = re.search(r"([0-9]+\.[0-9]+)\s*d[sS]", l)
            if m and "EC" not in params:
                params["EC"] = float(m.group(1))
            elif "ec" in lower and "sector" not in lower and "EC" not in params:
                m2 = re.search(r"(?:ec|electrical\s+conductivity)[^\d]*([0-9]+\.[0-9]+)", l, re.I)
                if m2:
                    params["EC"] = float(m2.group(1))

        # 3. Organic Carbon (OC)
        if "organic" in lower or "(oc)" in lower:
            m = re.search(r"(?:organic\s+carbon|\(oc\))[^\d]*([0-9]+\.[0-9]+)", l, re.I)
            if m and "OC" not in params:
                params["OC"] = float(m.group(1))

        # 4. Available Nitrogen (N)
        if "nitrogen" in lower or "(n)" in lower:
            m = re.search(r"(?:nitrogen|\(n\))[^\d]*([0-9]+\.[0-9]+)", l, re.I)
            if m and "N" not in params:
                params["N"] = float(m.group(1))

        # 5. Available Phosphorus (P)
        if "phosphor" in lower or "(p)" in lower:
            m = re.search(r"(?:phosphor\w*|\(p\))[^\d]*([0-9]+\.[0-9]+)", l, re.I)
            if m and "P" not in params:
                params["P"] = float(m.group(1))

        # 6. Available Potassium (K)
        if "potassium" in lower or "(k)" in lower:
            m = re.search(r"(?:potassium|\(k\))[^\d]*([0-9]+[.,][0-9A-Za-z]+)", l, re.I)
            if m and "K" not in params:
                val_str = m.group(1).replace("SS", "85").replace("S", "5").replace(",", ".")
                try:
                    params["K"] = float(val_str)
                except ValueError:
                    pass

        # 7. Available Sulphur (S)
        if "sulphur" in lower or "sulfur" in lower or "(s)" in lower:
            m = re.search(r"(?:sulphur|sulfur|\(s\))[^\d]*([0-9]+\.[0-9]+)", l, re.I)
            if m and "S" not in params:
                params["S"] = float(m.group(1))

        # 8. Available Zinc (Zn)
        if "zinc" in lower or "(zn)" in lower:
            m = re.search(r"(?:zinc|\(zn\))[^\d]*([0-9]+\.[0-9]+)", l, re.I)
            if m and "Zn" not in params:
                params["Zn"] = float(m.group(1))

        # 9. Available Boron (B) & 10. Available Iron (Fe)
        if ("boron" in lower or "(b)" in lower) and ("iron" in lower or "(fe)" in lower):
            all_floats = re.findall(r"([0-9]+\.[0-9]+)", l)
            if len(all_floats) >= 2:
                if "B" not in params:
                    params["B"] = float(all_floats[0])
                if "Fe" not in params:
                    params["Fe"] = float(all_floats[1])
        else:
            if "boron" in lower or "(b)" in lower:
                m = re.search(r"(?:boron|\(b\))[^\d]*([0-9]+\.[0-9]+)", l, re.I)
                if m and "B" not in params:
                    params["B"] = float(m.group(1))
            if "iron" in lower or "(fe)" in lower:
                m = re.search(r"(?:iron|\(fe\))[^\d]*([0-9]+\.[0-9]+)", l, re.I)
                if m and "Fe" not in params:
                    params["Fe"] = float(m.group(1))

        # 11. Available Manganese (Mn)
        if "manganese" in lower or "(mn)" in lower:
            m = re.search(r"(?:manganese|\(mn\))[^\d]*([0-9]+\.[0-9]+)", l, re.I)
            if m and "Mn" not in params:
                params["Mn"] = float(m.group(1))

        # 12. Available Copper (Cu)
        if "copper" in lower or "(cu)" in lower:
            m = re.search(r"(?:copper|\(cu\))[^\d]*([0-9]+\.[0-9]+)", l, re.I)
            if m and "Cu" not in params:
                params["Cu"] = float(m.group(1))

    return params


def ocr_soil_card(image_file) -> dict:
    """
    Run OCR on an uploaded image file and extract all 12 soil parameters.
    Uses Native Windows OCR engine, falling back to Tesseract if present.
    """
    _check_available()

    try:
        img = Image.open(image_file)
        img = _preprocess_image(img)

        # 1. Primary Engine: Windows Native Media OCR
        if _WINRT_OCR_AVAILABLE:
            raw_text = _run_windows_media_ocr(img)
        # 2. Fallback Engine: Tesseract
        elif _TESSERACT_AVAILABLE:
            raw_text = _run_tesseract(img)
        else:
            raise RuntimeError("No OCR engine available.")

    except Exception as e:
        raise RuntimeError(f"OCR processing failed: {e}")

    extracted = extract_soil_params(raw_text)

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
        "raw_text": raw_text,
        "parameters": parameters,
        **extracted,
    }
