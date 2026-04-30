from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "PCt7wo4!"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # 24 horas para desarrollo

def create_access_token(data: dict):
    """
    Crea un token JWT firmado.
    Incluye un 'payload' con los datos del usuario y una fecha de expiración.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)