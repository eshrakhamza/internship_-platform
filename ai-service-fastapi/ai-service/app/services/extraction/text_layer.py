import fitz  # PyMuPDF


def extract_text_layer(pdf_bytes: bytes) -> tuple[str, int]:
    """
    Attempts to pull the embedded text layer from a PDF.
    Returns (text, page_count). Text will be empty/short for scanned PDFs
    with no real text layer — caller decides whether to fall back to OCR.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_count = doc.page_count
    text_parts = [page.get_text() for page in doc]
    doc.close()
    return "\n".join(text_parts).strip(), page_count


def is_text_layer_sufficient(text: str, min_chars: int = 100) -> bool:
    """
    Heuristic: if the extracted text is too short, it's almost certainly
    a scanned image PDF with no real text layer, not a short CV.
    """
    return len(text) >= min_chars
