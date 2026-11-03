#!/usr/bin/env bash
# Render build script for AgriSense AI backend
# Installs dependencies excluding Windows-only packages

set -o errexit

# Install core dependencies, skip winocr (Windows-only)
pip install fastapi uvicorn python-dotenv requests scikit-learn numpy pandas \
    joblib Pillow pytesseract PyJWT python-multipart pydantic \
    google-generativeai httpx adaption==0.18.0

echo "Build complete."
