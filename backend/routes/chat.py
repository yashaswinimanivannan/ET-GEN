from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.ai_service import chat_about_document
from services.translator import translate_text

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    document_text: str = ""
    language: str = "English"


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Chat about a financial document. Ask questions and get answers
    in the selected language.
    """
    if not request.question or len(request.question.strip()) < 2:
        raise HTTPException(status_code=400, detail="Please provide a valid question.")

    try:
        # Get AI response
        answer = chat_about_document(
            document_text=request.document_text,
            question=request.question
        )

        # Translate if needed
        if request.language.lower() != "english":
            answer = translate_text(answer, request.language)

        return {
            "answer": answer,
            "language": request.language.capitalize()
        }

    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
