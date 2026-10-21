"""
OCR service for extracting soil parameters (N, P, K, pH) from soil health card images.
Requires: pytesseract, Pillow, and Tesseract-OCR installed on the system.
If any dependency is missing, functions will raise a RuntimeError with a friendly message.
"""

import re
import platform

# ── Lazy / safe imports ──────────────────────────────────────────
_TESSERACT_AVAILABLE = False
_IMPORT_ERROR_MSG = ""

try:
    from PIL import Image
    import pytesseract

    # Windows-specific Tesseract path
    if platform.system() == "Windows":
        pytesseract.pytesseract.tesseract_cmd = (
            r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        )

    _TESSERACT_AVAILABLE = True
except ImportError as e:
    _IMPORT_ERROR_MSG = (
        f"OCR dependency missing: {e}. "
        "Install with: pip install pytesseract Pillow  and install Tesseract-OCR on your system."
    )


def _check_available():
    if not _TESSERACT_AVAILABLE:
        raise RuntimeError(_IMPORT_ERROR_MSG)


# ── Regex helpers ────────────────────────────────────────────────

def _extract_value(text: str, patterns: list[str]) -> float | None:
    """Try each regex pattern in order; return the first numeric match or None."""
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                return float(m.group(1))
            except (ValueError, IndexError):
                continue
    return None


def extract_soil_params(raw_text: str) -> dict:
    """Parse N, P, K, pH from OCR text using common soil-card formats."""
    nitrogen = _extract_value(raw_text, [
        r"(?:nitrogen|N)\s*[:\-–=]\s*([\d.]+)",
        r"\bN\s+([\d.]+)",
    ])
    phosphorus = _extract_value(raw_text, [
        r"(?:phosphorus|phosphorous|P)\s*[:\-–=]\s*([\d.]+)",
        r"\bP\s+([\d.]+)",
    ])
    potassium = _extract_value(raw_text, [
        r"(?:potassium|K)\s*[:\-–=]\s*([\d.]+)",
        r"\bK\s+([\d.]+)",
    ])
    ph = _extract_value(raw_text, [
        r"(?:ph|pH)\s*[:\-–=]\s*([\d.]+)",
        r"\bpH\s+([\d.]+)",
    ])
    return {"N": nitrogen, "P": phosphorus, "K": potassium, "pH": ph}


def ocr_soil_card(image_file) -> dict:
    """
    Run OCR on an uploaded image file and extract soil parameters.
    Returns dict with keys: raw_text, N, P, K, pH.
    """
    _check_available()
    try:
        img = Image.open(image_file)
        raw_text = pytesseract.image_to_string(img)
    except Exception as e:
        raise RuntimeError(f"Tesseract OCR failed: {e}")

    params = extract_soil_params(raw_text)
    return {"raw_text": raw_text, **params}
