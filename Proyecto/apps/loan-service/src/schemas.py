from typing import List
from pydantic import BaseModel

class SimulacionRequest(BaseModel):
    monto: float
    cuotas: int

class SimulacionResponse(BaseModel):
    cuota_mensual: float
    tasa_aplicada: float
    total_pagar: float
    cae: float

class SolicitudCreate(BaseModel):
    monto: int
    plazo: int

class SolicitudResponse(BaseModel):
    id: int
    usuario_id: str
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
