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
    def chech_rut(cls,v):
        if not validar_rut(v):
            raise ValueError('El RUT ingresado no es válido (dígito verificador incorrecto)')
class UserLogin(BaseModel):
    email: EmailStr
    password: str