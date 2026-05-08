# import unittest
# from apps.logic import generar_sugerencias_inteligentes

# #estas pruebas fueron como de caja blanca porque igual vi el código un tanto para orientarme
# # la idea no es ser canalla, tampoco bonachon, justo

# class TestSimuladorInteligente(unittest.TestCase):

#     def setUp(self):
#         """Configuración de datos base para las pruebas
#          La gracia es que así no tenemos que reescribir un montón de veces lo mismo
#         y además este ejemplo en principio funciona"""
#         self.ingreso_normal = 1000000
#         self.deuda_baja = 10000
#         self.factor_valido = 1.0

#     def test_ca1_escalabilidad_montos(self): # test criterio de aceptación 1, escalabilidad de montos. si el sueldo es alto, los préstamos también
#         """Verifica que el sistema sugiera montos acordes a ingresos altos"""
#         ingreso_alto = 50000000  
#         resultado = generar_sugerencias_inteligentes(ingreso_alto, 0, 1.0) # si para 1 millon con 0 deuda y trabajo indefinido entrega 5 palos a 24 meses
#                                                                                 # mínimo que entregue 50 veces más para 50 millones, 0 de deuda y contrato indefinido
        
#         montos = [r['monto'] for r in resultado]
#         self.assertTrue(any(m > 20000000 for m in montos), 
#                         "FALLO: El sistema no escala a montos superiores a 20M.") 
#                         # si no se entrega un préstamo mayor a 20M es un problema, porque el banco está perdiendo dinero en tanto costo oportunidad

#     def test_ca2_robustez_factor_cero(self):
#         """Dividiendo por 0""" # se supone que no debería tirar nada ni dar error, porque 0 es una condición laboral inexistente, algo que se puede ver en el archivo calculator.py que está en loan-service/src/logic
#         try:
#             generar_sugerencias_inteligentes(self.ingreso_normal, self.deuda_baja, 0)
#         except ZeroDivisionError:
#             self.fail("ERROR CRÍTICO: El backend lanzó ZeroDivisionError con factor 0.")
#         except Exception as e:
#             self.fail(f"ERROR INESPERADO: {type(e).__name__} con factor 0.")
#             # al final la idea es que esto no arroje

#     def test_ingreso_negativo_vacio(self): # no es un criterio de aceptación, pero vale la pena considerarlo, porque es una clase de equivalencia, si el ingreso es 1, -1 también es un ingreso 
#         """Verifica que ingresos inválidos no generen ofertas"""
#         resultado = generar_sugerencias_inteligentes(-1, 0, 1)
#         self.assertEqual(resultado, [], "Debería retornar lista vacía para ingresos negativos.")


# if __name__ == '__main__':
#     unittest.main()


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