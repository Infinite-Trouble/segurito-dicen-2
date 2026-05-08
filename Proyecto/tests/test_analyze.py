import unittest
import os
from fastapi.testclient import TestClient
from src.main import app
#from src.main import app

# hay que subir una imagen en uploads para que corra!

class TestAnalyzeDocumentEndpoint(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """
        Preparación de datos: Instanciamos el cliente de FastAPI.
        """
        cls.client = TestClient(app)
        
        # 1. Ruta a la imagen REAL para el Caso 1 (Éxito)
        cls.real_image_path = "apps/scan-service/uploads/imagen.jpeg"
        
        # 2. Creación de imagen FALSA para el Caso 2 (Error/Excepción)
        cls.fake_image_path = "dummy_test_image.jpg"
        with open(cls.fake_image_path, "wb") as f:
            f.write(b"fake image data para pruebas")
            
    @classmethod
    def tearDownClass(cls):
        """
        Limpieza de datos.
        Solo borramos la imagen falsa, dejando intacta tu imagen real en uploads.
        """
        if os.path.exists(cls.fake_image_path):
            os.remove(cls.fake_image_path)

    def test_01_analyze_document_success(self):
        """
        Caso 1 (HU011): Éxito en Extracción de Datos
        Se usa una imagen real y válida. El sistema la procesa y retorna 200 OK.
        """
        # Usamos la imagen REAL
        with open(self.real_image_path, "rb") as f:
            response = self.client.post(
                "/analyze",
                files={"file": ("imagen.jpeg", f, "image/jpeg")},
                data={"document_type": "carnet"}
            )
        
        # Validaciones de la extracción
        self.assertEqual(response.status_code, 200, f"Debería retornar 200 OK, pero retornó {response.status_code}")
        self.assertIn("document_type", response.json())
        self.assertEqual(response.json()["document_type"], "carnet")

    def test_02_analyze_extraction_failure(self):
        """
        Caso 2 (HU011): Falla en Extracción por Documento Corrupto
        Se usa una imagen falsa/ilegible. El sistema debería lanzar un 400 Bad Request.
        """
        # Usamos la imagen FALSA
        with open(self.fake_image_path, "rb") as f:
            response = self.client.post(
                "/analyze",
                files={"file": ("dummy_test_image.jpg", f, "image/jpeg")},
                data={"document_type": "carnet"} 
            )
        
        # Validación de que se rechaza correctamente
        # Como hemos conversado, el test espera un 400, pero como la implementación
        # tiene un fallo, arrojará un 500, haciendo fallar la prueba.
        self.assertEqual(response.status_code, 400, f"Debería rechazar con 400, pero retornó {response.status_code}")

if __name__ == "__main__":
    unittest.main()