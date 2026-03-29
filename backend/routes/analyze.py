from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from services.ai_service import analyze_document
from services.risk_detector import detect_risks
from services.translator import translate_analysis

router = APIRouter()


class AnalyzeRequest(BaseModel):
    text: str
    income: Optional[float] = None
    goal: Optional[str] = None
    language: str = "English"


class AnalyzeResponse(BaseModel):
    summary: str
    risks: list
    suggestions: list
    risk_score: str
    language: str


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """
    Analyze extracted document text using AI and rule-based risk detection.
    Translates output to selected language.
    """
    if not request.text or len(request.text.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Document text is too short or empty. Please upload a valid document."
        )

    try:
        # Step 1: AI Analysis
        ai_result = analyze_document(
            document_text=request.text,
            income=request.income,
            goal=request.goal
        )

        # Step 2: Rule-based risk detection
        rule_risks = detect_risks(request.text, request.income)

        # Step 3: Merge AI risks with rule-based risks
        ai_risks = ai_result.get("risks", [])
        all_risks = ai_risks.copy()

        # Add rule-based risks that aren't duplicates
        existing_types = {r.get("type", "").lower() for r in all_risks if isinstance(r, dict)}
        for rule_risk in rule_risks["risks"]:
            if rule_risk["type"].lower() not in existing_types:
                all_risks.append(rule_risk)

        # Build response
        analysis = {
            "summary": ai_result.get("summary", "Unable to generate summary."),
            "risks": all_risks,
            "suggestions": ai_result.get("suggestions", []),
            "risk_score": rule_risks["risk_score"],
            "language": "English"
        }

        # Step 4: Translate if needed
        if request.language.lower() != "english":
            analysis = translate_analysis(analysis, request.language)
            analysis["risk_score"] = rule_risks["risk_score"]  # Keep risk score in English

        analysis["language"] = request.language.capitalize()

        return analysis

    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
