from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from .logic.ocr_engine import OCREngine
from .logic.parsers import DocumentParser
from . import schemas
from jose import JWTError, jwt
from dotenv import load_dotenv
import os
import uuid

app = FastAPI(title="Scan Service", description="Servicio de extracción de datos mediante OCR")
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
        # 1. Leer el contenido PRIMERO en memoria para validarlo
        content = await file.read()

        # VALIDACIÓN DE MAGIC BYTES (Seguridad)
        # Diccionario con las firmas hexadecimales de los formatos permitidos
        ALLOWED_SIGNATURES = {
            b'\xff\xd8\xff': '.jpg',         # Firma de JPEG/JPG
            b'\x89PNG\r\n\x1a\n': '.png',   # Firma de PNG
            b'%PDF-': '.pdf'                # Firma de PDF
        }

        extension_real = None
        
        # Comparamos los primeros bytes del archivo con nuestras firmas permitidas
        for signature, ext in ALLOWED_SIGNATURES.items():
            if content.startswith(signature):
                extension_real = ext
                break

        # Si el archivo no coincide con ninguna firma válida, lo rechazamos inmediatamente
        if not extension_real:
            raise HTTPException(
                status_code=415, # 415 = Unsupported Media Type
                detail="Formato de archivo no válido o malicioso. Solo se permiten imágenes reales (JPG, PNG) o PDF."
            )

        # 2. Generar nombre único usando la extensión REAL (Seguridad)
        unique_filename = f"{uuid.uuid4()}{extension_real}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Guardar archivo verificado en disco
        with open(file_path, "wb") as f:
            f.write(content)
        
        # 3. Ejecutar OCR
        try:
            raw_text = ocr_engine.detect_text(content)
        except Exception as ocr_error:
            # si cloud vision falla porque le están mandando un archivo corrupto, dejamos texto vacío no más
            print(f"Error de cloud vision al procesar el archivo. Detalle: {ocr_error}")
            raw_text = None
        
        if not raw_text:
            raise HTTPException(status_code=400, detail="No se pudo detectar texto en el documento.")

        # 4. Parsear según tipo
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

        # 5. Construir URL
        archivo_url = f"http://localhost:8002/uploads/{unique_filename}"

        return {
            "document_type": document_type,
            "data": data,
            "archivo_url": archivo_url,
            "raw_text": raw_text
        }
    
    except HTTPException as http_ex:
        # si se capturó un problema con cloud vision o validación de bytes, que lo muestre
        raise http_ex

    except Exception as e:
        # si llegamos aquí no se manejaron bien los errores y hay "error interno del servidor"
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/uploads/{filename}")
def obtener_archivo_seguro(
    filename: str, 
    token: str = Depends(oauth2_scheme)
):
    """
    Endpoint protegido. Reemplaza a StaticFiles manteniendo la misma URL.
    """
    # 1. Validar el Token JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = payload.get("sub")
        if not usuario_id:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="No autorizado o sesión expirada")

    # 2. Verificar que el archivo existe en el disco
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    # 3. Servir el archivo de forma segura
    return FileResponse(file_path)
