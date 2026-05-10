import unittest
from fastapi.testclient import TestClient
from main import app

class TestEndpointSugerencias(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Inicializa cliente de pruebas para el endpoint"""
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        """Limpieza general"""
        pass

    def test_ca1_escalabilidad_montos(self):
        """
        CA1:
        Verifica que ingresos altos generen préstamos altos.

        caso observado:
        No se permiten mejores préstamos con mejores sueldos, está 'jarcodeado'
        """

        response = self.client.post(
            "/sugerencias",
            json={
                "ingreso": 50000000,
                "deuda": 0,
                "factor_contrato": 1.0
            }
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        montos = [op["monto"] for op in data["opciones"]]

        self.assertTrue(
            any(m > 20000000 for m in montos),
            "FALLO: El endpoint no escala a montos superiores a 20M."
        )

    def test_ca2_factor_cero_no_crash(self):
        """
        CA2:
        Verifica robustez ante factor_contrato = 0.

        Caso observado:
        actualmente el backend responde HTTP 500.
        """

        response = self.client.post(
            "/sugerencias",
            json={
                "ingreso": 1000000,
                "deuda": 10,
                "factor_contrato": 0
            }
        )

        self.assertNotEqual(
            response.status_code,
            500,
            "FALLO: El endpoint lanzó Internal Server Error con factor 0."
        )


if __name__ == '__main__':
    unittest.main()




    # fastapi httpx python-jose dotenv sqlalchemy psycopg2