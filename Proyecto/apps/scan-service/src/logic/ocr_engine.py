from google.cloud import vision
from dotenv import load_dotenv

load_dotenv()

class OCREngine:
    def __init__(self):

        self.client = vision.ImageAnnotatorClient()

    def detect_text(self, content: bytes):
        """
        Recibe el contenido binario de una imagen y devuelve las anotaciones de texto. Con esto no guardamos archivos en el pc
        """
        image = vision.Image(content=content)
        response = self.client.text_detection(image=image)
        
        if response.error.message:
            raise Exception(f"Error en Google Cloud Vision API: {response.error.message}")
        
        if not response.text_annotations:
            return ""

        # El primer elemento contiene el texto completo detectado
        return response.text_annotations[0].description
