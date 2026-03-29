import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from pypdf import PdfReader

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF financial document and extract text.
    Returns the extracted text content.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file type
    allowed_types = [".pdf"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Please upload a PDF file."
        )

    try:
        # Save uploaded file temporarily
        temp_path = os.path.join(UPLOAD_DIR, file.filename)
        content = await file.read()

        with open(temp_path, "wb") as f:
            f.write(content)

        # Extract text from PDF
        extracted_text = ""
        reader = PdfReader(temp_path)

        for page_num, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                extracted_text += f"\n--- Page {page_num + 1} ---\n{page_text}"

        # Clean up
        os.remove(temp_path)

        if not extracted_text.strip():
            return {
                "success": True,
                "filename": file.filename,
                "pages": len(reader.pages),
                "text": "",
                "warning": "No text could be extracted. The PDF may be image-based. OCR support coming soon."
            }

        return {
            "success": True,
            "filename": file.filename,
            "pages": len(reader.pages),
            "text": extracted_text.strip(),
            "characters": len(extracted_text.strip())
        }

    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
