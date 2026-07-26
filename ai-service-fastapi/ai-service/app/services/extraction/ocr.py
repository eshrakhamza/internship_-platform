import io

import fitz  # PyMuPDF, used here only to rasterize pages to images
import pytesseract
from PIL import Image

from app.core.config import settings

if settings.tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


def extract_text_ocr(pdf_bytes: bytes, dpi: int = 200) -> str:
    """
    Renders each PDF page to an image and runs Tesseract OCR on it.
    Slower than the text-layer path (seconds per page on CPU) —
    only called when the text layer extraction comes back empty.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    text_parts = []
    for page in doc:
        pix = page.get_pixmap(matrix=matrix)
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        text_parts.append(pytesseract.image_to_string(img, lang="eng+fra"))

    doc.close()
    return "\n".join(text_parts).strip()
