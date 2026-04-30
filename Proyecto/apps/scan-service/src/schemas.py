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
    nombre: Optional[str]
    rut: Optional[str]
    numero_cedula: Optional[str]
    vigencia: Optional[bool]
    
class LiquidacionData(BaseModel):
    total_haberes: Optional[int]
    total_descuento: Optional[int]
    sueldo_liquido: Optional[int]

class CotizacionesData(BaseModel):
    meses_cotizados_consecutivos: int
    rut_empleador: Optional[str]

class DeudaData(BaseModel):
    deudas_totales: int
    mora_90_dias: int
