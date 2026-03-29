from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.upload import router as upload_router
from routes.analyze import router as analyze_router
from routes.chat import router as chat_router

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="FinSight AI",
    description="Financial Document Analyzer API",
    version="1.0.0"
)

# CORS middleware — allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload_router, tags=["Upload"])
app.include_router(analyze_router, tags=["Analyze"])
app.include_router(chat_router, tags=["Chat"])


@app.get("/")
async def root():
    return {
        "app": "FinSight AI",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "upload": "POST /upload",
            "analyze": "POST /analyze",
            "chat": "POST /chat",
            "docs": "GET /docs"
        }
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
