from google.cloud import vision
from dotenv import load_dotenv
import fitz  

load_dotenv()

class OCREngine:
    def __init__(self):
        self.client = vision.ImageAnnotatorClient()

    def detect_text(self, content: bytes) -> str:
        """
        Recibe bytes de imagen o PDF de una página.
        Si es PDF, lo convierte a imagen antes de procesar.
        """
        if content[:4] == b'%PDF':
            content = self._pdf_to_image_bytes(content)

        image = vision.Image(content=content)
        response = self.client.text_detection(image=image)

        if response.error.message:
            raise Exception(f"Error en Google Cloud Vision API: {response.error.message}")

        if not response.text_annotations:
            return ""

        return response.text_annotations[0].description

    @staticmethod
    def _pdf_to_image_bytes(content: bytes) -> bytes:
        """Convierte la primera página de un PDF a PNG en memoria."""
        with fitz.open(stream=content, filetype="pdf") as pdf:
            page = pdf[0]
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
            return pixmap.tobytes("png")
