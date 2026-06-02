from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import date

class SimulacionRequest(BaseModel):
    monto: float
    cuotas: int

class SimulacionResponse(BaseModel):
    cuota_mensual: float
    tasa_aplicada: float
    total_pagar: float
    cae: float




#---- ESTRUCTURAS DE AUDITORÍA Y PORTAL DE PAGOS ----


class CuotaResponse(BaseModel):
    id: int
    monto: int
    fecha_limite: date
    estado: str

    class Config:
        from_attributes = True

class PagoRequest(BaseModel):
    cuota_ids: List[int]
    metodo_pago: str

# --- ESQUEMAS PARA DOCUMENTOS ---

class CarnetCreate(BaseModel):
    nombre: str
    rut: str
    numero_cedula: str
    vigencia: bool
    archivo_url: str

class LiquidacionCreate(BaseModel):
    total_haberes: int
    total_descuento: int
    sueldo_liquido: int
    archivo_url: str

class CotizacionesCreate(BaseModel):
    meses_cotizados_consecutivos: int
    rut_empleador: Optional[str] = None
    archivo_url: str

class DeudaCreate(BaseModel):
    deudas_totales: int
    mora_90_dias: int
    archivo_url: str

class SolicitudCreate(BaseModel):
    monto: int
    plazo: int
    carnet: CarnetCreate
    liquidacion: LiquidacionCreate
    cotizaciones: CotizacionesCreate
    deudas: DeudaCreate

class SolicitudResponse(BaseModel):
    id: UUID
    usuario_id: UUID
    fecha_solicitud: Optional[date] = None
    estado: str
    monto: int
    plazo: int

    class Config:
        from_attributes = True

# --- NUEVOS SCHEMAS PARA EVALUACIÓN DE RIESGO ---

class DatosSocioeconomicos(BaseModel):
    ingreso: float
    deuda: float
    factor_contrato: float

class ProbabilidadRequest(DatosSocioeconomicos):
    cuota: float

class ProbabilidadResponse(BaseModel):
    texto: str
    color: str

class OpcionSugerida(BaseModel):
    monto: float
    cuotas: int
    cuota_simulada: float
    tasa_aplicada: float
    cae: float
    total_pagar: float
    carga_financiera: float
    probabilidad: str
    tipo_probabilidad: str

class SugerenciasResponse(BaseModel):
    opciones: List[OpcionSugerida]
