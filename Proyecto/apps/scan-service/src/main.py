from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .logic.ocr_engine import OCREngine
from .logic.parsers import DocumentParser
from . import schemas

app = FastAPI(title="Scan Service", description="Servicio de extracción de datos mediante OCR")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción, limitar al origen del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        # 1. Leer contenido del archivo
        content = await file.read()
        
        # 2. Ejecutar OCR
        raw_text = ocr_engine.detect_text(content)
        
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

        return {
            "document_type": document_type,
            "data": data,
            "raw_text": raw_text # Opcional: para depuración o para que el usuario vea el texto original
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
