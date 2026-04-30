from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

SECRET_KEY = "PCt7wo4!" 
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user_id(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodificamos el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        usuario_id: str = payload.get("sub") 
        if usuario_id is None:
            raise credentials_exception
        return usuario_id
    except JWTError:
        raise credentials_exception

def get_current_user_email(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Buscamos el correo dentro del token
        email: str = payload.get("email") 
        
        # Opcional: Si por alguna razón el token antiguo no traía correo, 
        # ponemos uno de fallback para que no explote mientras haces pruebas.
        if email is None:
            return "matykun12@gmail.com"
            
        return email
    except JWTError:
        raise credentials_exception
