# Issue

## Issue Description

## Where's the Issue?

```
# si llegamos aquí no se manejaron bien los errores y hay "error interno del servidor"
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/uploads/{filename}")
def obtener_archivo_seguro(
    
filename: str, 
    token: str = Depends(oauth2_scheme)
):
    """
    Endpoint protegido. Reemplaza a StaticFiles manteniendo la misma URL.
    """
    # 1. Validar el Token JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = payload.get("sub")
        if not usuario_id:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="No autorizado o sesión expirada")
    # 2. Verificar que el archivo existe en el disco

file_path = 

os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    # 3. Servir el archivo de forma segura
    return 

FileResponse(file_path)
```

## Why is this an Issue?

Path injections occur when an application uses untrusted data to construct a file path and access this file without validating its path first.

A user with malicious intent would inject specially crafted values, such as ../, to change the initial intended path. The resulting path would resolve somewhere in the filesystem where the user should not normally have access to.

What is the potential impact?
A web application is vulnerable to path injection and an attacker is able to exploit it.

The files that can be affected are limited by the permission of the process that runs the application. Worst case scenario: the process runs with root privileges on Linux, and therefore any file can be affected.

Below are some real-world scenarios that illustrate some impacts of an attacker exploiting the vulnerability.

Override or delete arbitrary files
The injected path component tampers with the location of a file the application is supposed to delete or write into. The vulnerability is exploited to remove or corrupt files that are critical for the application or for the system to work properly.

It could result in data being lost or the application being unavailable.

Read arbitrary files
The injected path component tampers with the location of a file the application is supposed to read and output. The vulnerability is exploited to leak the content of arbitrary files from the file system, including sensitive files like SSH private keys.

## How can I fix It?



## More Info