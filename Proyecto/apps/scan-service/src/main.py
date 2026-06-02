from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .logic.ocr_engine import OCREngine
from .logic.parsers import DocumentParser
from . import schemas
import os
import uuid

app = FastAPI(title="Scan Service", description="Servicio de extracción de datos mediante OCR")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción, limitar al origen del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear directorio de uploads si no existe
# cuando uno corre el test desde proyecto esto crea la carpeta uploads a la misma altura, entonces
# de preferencia eliminarlo!
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Montar archivos estáticos para poder acceder a los documentos subidos
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

ocr_engine = OCREngine()

@app.get("/")
def health_check():
    return {"status": "ok", "service": "scan-service"}

@app.post("/analyze", response_model=schemas.ScanResult)
async def analyze_document(
    file: UploadFile = File(...),
    document_type: str = Form(...) # carnet, liquidacion, cotizaciones, deuda
):
    """
    Recibe un archivo (imagen/pdf) y el tipo de documento para extraer sus datos.
    """
    try:
        # 1. Generar nombre único y guardar archivo
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # 2. Ejecutar OCR de forma segura
        try:
            raw_text = ocr_engine.detect_text(content)
        except Exception as ocr_error:
            # Si cloud vision falla (ej: archivo corrupto), lanzamos un 400 controlado
            print(f"Error de cloud vision al procesar el archivo. Detalle: {ocr_error}")
            raise HTTPException(
                status_code=400, 
                detail="El archivo proporcionado está corrupto o no es un formato de imagen legible."
            )
        
        if not raw_text:
            raise HTTPException(status_code=400, detail="No se pudo detectar texto en el documento.")

        # 3. Parsear según tipo
        data = {}
        if document_type == "carnet":
            data = DocumentParser.parse_cedula(raw_text)
        elif document_type == "liquidacion":
            data = DocumentParser.parse_liquidacion(raw_text)
        elif document_type == "cotizaciones":
            data = DocumentParser.parse_cotizaciones(raw_text)
        elif document_type == "deuda":
            data = DocumentParser.parse_deudas(raw_text)
        else:
            raise HTTPException(status_code=400, detail=f"Tipo de documento '{document_type}' no soportado.")

        if not data:
            raise HTTPException(status_code=422, detail="Error al extraer datos específicos del documento.")

        # Construir URL (asumiendo que corre en el puerto 8002)
        archivo_url = f"http://localhost:8002/uploads/{unique_filename}"

        return {
            "document_type": document_type,
            "data": data,
            "archivo_url": archivo_url,
            "raw_text": raw_text
        }

    except HTTPException:
        # Si el error es un HTTPException (400, 422) que nosotros lanzamos intencionalmente, lo dejamos pasar
        raise 
    except Exception as e:
        # Solo si es un error verdaderamente inesperado, lanzamos 500
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
