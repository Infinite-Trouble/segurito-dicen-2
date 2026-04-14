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