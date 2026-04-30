from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

SECRET_KEY = "PCt7wo4!" 
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user_id(token: str = Depends(oauth2_scheme)):
    try:
        # Decodificamos el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        usuario_id: str = payload.get("sub") 
        if usuario_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token no contiene el identificador de usuario (sub)",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return usuario_id
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Error al validar credenciales: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )