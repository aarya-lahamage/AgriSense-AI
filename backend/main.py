from fastapi import FastAPI

app = FastAPI(
    title="AgriSense AI API",
    description="Intelligent Agricultural Decision Support System",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "AgriSense AI API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }