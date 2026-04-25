Para ver cómo funciona la wea en principio se puede hacer ordinariamente en PoC

Para verlo medio medianamente real, así:

cd apps/scan-service
source venv/bin/activate
pip install fastapi uvicorn google-cloud-vision python-dotenv python-multipart pydantic  
uvicorn src.main:app --reload --host 0.0.0.0 --port 8002

Si se levanta, para probar a la mala (porque no hay frontend todavía) es lo siguiente:

curl -X POST http://localhost:8002/analyze \
-F "file=@test_carnet.jpeg" \
-F "document_type=carnet"






Aquí tienes el resumen ejecutivo para nuestra próxima sesión:

  Estado del Proyecto: Microservicio scan-service

   1. Arquitectura Implementada: Se creó un nuevo microservicio en apps/scan-service usando FastAPI, estructurado en capas:
       * src/main.py: Endpoint POST /analyze que recibe archivos y el tipo de documento.
       * src/logic/ocr_engine.py: Integración con Google Cloud Vision API para extracción de texto crudo.
       * src/logic/parsers.py: Lógica de extracción mediante Regex.
       * src/schemas.py: Modelos Pydantic para tipado de respuestas.
   2. Hitos Logrados:
       * Migración Exitosa: Se profesionalizó la prueba de concepto (POC) inicial.
       * Parser de Cédula Chilena (Robusto): 
           * Extrae RUT, Nombre Completo y Número de Documento.
           * Lógica de Vigencia Inteligente: Identifica todas las fechas del documento y selecciona la mayor como fecha de
             vencimiento (evitando confusiones con fechas de nacimiento o emisión).
           * Soporta variaciones de formato (espacios, saltos de línea y meses de longitud variable como MAYO vs MAY).
       * Ejecución: El servicio corre en el puerto 8002 y ha sido validado mediante curl con imágenes reales.
   3. Pendientes:
       * Perfeccionar Parsers: Ajustar las Regex para liquidacion (haberes/líquido), cotizaciones y deuda usando el raw_text de
         muestras reales.
       * Integración: Conectar el flujo para que los datos validados se guarden en las tablas de loans_db del loan-service.
   1 cd apps/scan-service && source venv/bin/activate && uvicorn src.main:app --reload --host 0.0.0.0 --port 8002

  ¡Nos vemos en la próxima sesión para terminar los parsers y la integración!
