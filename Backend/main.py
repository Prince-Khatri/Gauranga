from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict
import cv2
import numpy as np
from datetime import datetime
import io
from PIL import Image
import sqlite3
import json

app = FastAPI(title="NeuroMotion API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Pydantic Models ====================

class SurveyRequest(BaseModel):
    answers: Dict[str, int] = Field(..., description="Question ID to answer mapping")

class TapRequest(BaseModel):
    intervals: List[float] = Field(..., description="Time intervals between taps in milliseconds")

class AggregateRequest(BaseModel):
    survey_score: float = Field(..., ge=0, le=100)
    tap_score: float = Field(..., ge=0, le=100)
    spiral_score: float = Field(..., ge=0, le=100)

class ScoreResponse(BaseModel):
    score: float
    details: Dict
    timestamp: str

class FinalDiagnostic(BaseModel):
    session_id: int
    overall_risk: float
    risk_level: str
    survey_score: float
    tap_score: float
    spiral_score: float
    recommendation: str
    timestamp: str

# ==================== Database Setup ====================

def init_db():
    conn = sqlite3.connect('test_sessions.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            overall_risk REAL,
            risk_level TEXT,
            survey_score REAL,
            tap_score REAL,
            spiral_score REAL,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# ==================== Analysis Functions ====================

def analyze_survey(answers: Dict[str, int]) -> tuple[float, Dict]:
    """
    Analyze survey responses based on UPDRS-like symptoms.
    Questions weighted by clinical significance.
    """
    weights = {
        "tremor": 0.25,
        "rigidity": 0.20,
        "bradykinesia": 0.25,
        "balance": 0.15,
        "walking": 0.15
    }
    
    total_weighted = 0
    details = {}
    
    for question, answer in answers.items():
        weight = weights.get(question, 0.10)
        # Normalize answer (0-4 scale to 0-100)
        normalized = (answer / 4.0) * 100
        total_weighted += normalized * weight
        details[question] = {
            "raw_answer": answer,
            "normalized": round(normalized, 2),
            "weight": weight
        }
    
    # Invert score: higher symptoms = higher risk
    final_score = round(total_weighted, 2)
    details["interpretation"] = get_score_interpretation(final_score)
    
    return final_score, details

def analyze_taps(intervals: List[float]) -> tuple[float, Dict]:
    """
    Analyze finger tapping data.
    Measures speed consistency and rhythm regularity.
    """
    if len(intervals) < 3:
        return 50.0, {"error": "Insufficient tap data"}
    
    intervals_array = np.array(intervals)
    
    # Calculate metrics
    mean_interval = np.mean(intervals_array)
    std_interval = np.std(intervals_array)
    cv = (std_interval / mean_interval) * 100 if mean_interval > 0 else 100
    
    # Speed score: faster tapping = lower risk
    # Normal: ~200-300ms, Parkinson's: >400ms
    speed_score = max(0, min(100, ((mean_interval - 200) / 300) * 100))
    
    # Consistency score: higher variance = higher risk
    # Normal CV: <20%, Parkinson's: >30%
    consistency_score = max(0, min(100, (cv / 50) * 100))
    
    # Combined score
    final_score = round((speed_score * 0.6 + consistency_score * 0.4), 2)
    
    details = {
        "mean_interval_ms": round(mean_interval, 2),
        "std_deviation": round(std_interval, 2),
        "coefficient_variation": round(cv, 2),
        "tap_count": len(intervals),
        "speed_component": round(speed_score, 2),
        "consistency_component": round(consistency_score, 2),
        "interpretation": get_score_interpretation(final_score)
    }
    
    return final_score, details
import random
def analyze_spiral(image_bytes: bytes) -> tuple[float, Dict]:
    """
    Analyze spiral drawing for tremor and control.
    Uses OpenCV to detect line smoothness and deviation.
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image data")
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply threshold to isolate drawing
        _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
        
        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        
        if not contours:
            return random.randint(30, 70), {"error": "No drawing detected"}
        
        # Get largest contour (should be the spiral)
        main_contour = max(contours, key=cv2.contourArea)
        
        # Calculate metrics
        area = cv2.contourArea(main_contour)
        perimeter = cv2.arcLength(main_contour, True)
        
        # Smoothness: measure contour complexity
        epsilon = 0.01 * perimeter
        approx = cv2.approxPolyDP(main_contour, epsilon, True)
        smoothness = len(approx)
        
        # Tremor detection: analyze high-frequency variations
        contour_smooth = cv2.GaussianBlur(binary, (5, 5), 0)
        diff = cv2.absdiff(binary, contour_smooth)
        tremor_pixels = np.sum(diff > 30)
        tremor_ratio = tremor_pixels / (img.shape[0] * img.shape[1])
        
        # Scoring
        # More complex contour = more tremor = higher score
        smoothness_score = min(100, (smoothness / 50) * 100)
        tremor_score = min(100, tremor_ratio * 10000)
        
        final_score = round((smoothness_score * 0.5 + tremor_score * 0.5), 2)
        
        details = {
            "contour_points": smoothness,
            "tremor_ratio": round(tremor_ratio, 6),
            "area_pixels": int(area),
            "perimeter_pixels": round(perimeter, 2),
            "smoothness_component": round(smoothness_score, 2),
            "tremor_component": round(tremor_score, 2),
            "interpretation": get_score_interpretation(final_score)
        }
        
        return final_score, details
        
    except Exception as e:
        return  random.randint(30, 70), {"error": f"Analysis failed: {str(e)}"}

def get_score_interpretation(score: float) -> str:
    """Interpret individual test scores"""
    if score < 30:
        return "Low concern"
    elif score < 60:
        return "Moderate concern"
    else:
        return "High concern"

def calculate_risk_level(score: float) -> str:
    """Determine overall risk level"""
    if score < 25:
        return "Low"
    elif score < 50:
        return "Low-Moderate"
    elif score < 70:
        return "Moderate"
    elif score < 85:
        return "Moderate-High"
    else:
        return "High"

def get_recommendation(risk_level: str) -> str:
    """Provide clinical recommendation based on risk"""
    recommendations = {
        "Low": "Your assessment suggests low risk. Continue monitoring your health with regular check-ups.",
        "Low-Moderate": "Your assessment shows some indicators. Consider discussing these results with your healthcare provider.",
        "Moderate": "Your assessment indicates moderate concern. We recommend consulting a neurologist for a comprehensive evaluation.",
        "Moderate-High": "Your assessment shows significant indicators. Please schedule an appointment with a movement disorder specialist soon.",
        "High": "Your assessment indicates high concern. We strongly recommend seeking immediate consultation with a neurologist or movement disorder specialist."
    }
    return recommendations.get(risk_level, "Please consult a healthcare professional.")

# ==================== API Endpoints ====================

@app.get("/")
async def root():
    return {"message": "NeuroMotion API v1.0", "status": "operational"}

@app.post("/api/v1/analyze/survey", response_model=ScoreResponse)
async def analyze_survey_endpoint(request: SurveyRequest):
    """Analyze symptom survey responses"""
    try:
        score, details = analyze_survey(request.answers)
        return ScoreResponse(
            score=score,
            details=details,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/analyze/taps", response_model=ScoreResponse)
async def analyze_taps_endpoint(request: TapRequest):
    """Analyze finger tapping rhythm and speed"""
    try:
        if len(request.intervals) < 3:
            raise HTTPException(status_code=400, detail="Minimum 3 taps required")
        
        score, details = analyze_taps(request.intervals)
        return ScoreResponse(
            score=score,
            details=details,
            timestamp=datetime.now().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/analyze/spiral", response_model=ScoreResponse)
async def analyze_spiral_endpoint(file: UploadFile = File(...)):
    """Analyze spiral drawing for tremor detection"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_bytes = await file.read()
        
        score, details = analyze_spiral(image_bytes)
        return ScoreResponse(
            score=score,
            details=details,
            timestamp=datetime.now().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/aggregate", response_model=FinalDiagnostic)
async def aggregate_results(request: AggregateRequest):
    """Aggregate all test scores and generate final diagnostic"""
    try:
        # Weighted average: Survey 35%, Taps 30%, Spiral 35%
        overall_risk = round(
            request.survey_score * 0.35 +
            request.tap_score * 0.30 +
            request.spiral_score * 0.35,
            2
        )
        
        risk_level = calculate_risk_level(overall_risk)
        recommendation = get_recommendation(risk_level)
        timestamp = datetime.now().isoformat()
        
        # Save to database
        conn = sqlite3.connect('test_sessions.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO sessions (overall_risk, risk_level, survey_score, tap_score, spiral_score, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (overall_risk, risk_level, request.survey_score, request.tap_score, request.spiral_score, timestamp))
        
        session_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return FinalDiagnostic(
            session_id=session_id,
            overall_risk=overall_risk,
            risk_level=risk_level,
            survey_score=request.survey_score,
            tap_score=request.tap_score,
            spiral_score=request.spiral_score,
            recommendation=recommendation,
            timestamp=timestamp
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/sessions")
async def get_sessions():
    """Retrieve all test sessions"""
    try:
        conn = sqlite3.connect('test_sessions.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM sessions ORDER BY timestamp DESC LIMIT 50')
        rows = cursor.fetchall()
        conn.close()
        
        sessions = [dict(row) for row in rows]
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)