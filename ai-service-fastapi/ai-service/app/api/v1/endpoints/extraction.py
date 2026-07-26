from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.security import verify_internal_key
from app.schemas.cv import ExtractionResponse
from app.services.extraction.ocr import extract_text_ocr
from app.services.extraction.text_layer import (
    extract_text_layer,
    is_text_layer_sufficient,
)

router = APIRouter()


@router.post("/cv", response_model=ExtractionResponse, dependencies=[Depends(verify_internal_key)])
async def extract_cv(file: UploadFile = File(...)) -> ExtractionResponse:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    pdf_bytes = await file.read()

    text, page_count = extract_text_layer(pdf_bytes)

    if is_text_layer_sufficient(text):
        return ExtractionResponse(text=text, method="text_layer", page_count=page_count)

    # Text layer empty or too short — likely a scanned CV, fall back to OCR
    ocr_text = extract_text_ocr(pdf_bytes)
    return ExtractionResponse(text=ocr_text, method="ocr", page_count=page_count)
