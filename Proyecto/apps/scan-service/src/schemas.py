from pydantic import BaseModel
from typing import Optional

class ScanResult(BaseModel):
    document_type: str
    data: dict
    archivo_url: str
    raw_text: Optional[str] = None

class ErrorResponse(BaseModel):
    detail: str

class CedulaData(BaseModel):
    nombre: str
    rut: str
    numero_cedula: str
    vigencia: bool
    
class LiquidacionData(BaseModel):
    total_haberes: int | None = None
    total_descuento: int | None = None
    sueldo_liquido: int | None = None

class CotizacionesData(BaseModel):
    meses_cotizados_consecutivos: int
    rut_empleador: Optional[str]=None

class DeudaData(BaseModel):
    deudas_totales: int
    mora_90_dias: int

