from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from logic.valid_rut import validar_rut # la wea del rut

class UserCreate(BaseModel):
    rut: str
    nombre: str
    apellido: str
    email: EmailStr
    password: str
    telefono: Optional[str] = None
    @validator('rut')
    def check_rut(cls, v):
        if not validar_rut(v):
            raise ValueError('El RUT ingresado no es válido (dígito verificador incorrecto)')
        # Importante: Retornar el valor normalizado para que no llegue como None a la DB
        return v.replace(".", "").replace("-", "").upper().strip()
class UserLogin(BaseModel):
    email: EmailStr
    password: str