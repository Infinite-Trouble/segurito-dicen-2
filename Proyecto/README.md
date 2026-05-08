# Sistema de Préstamos Online - Microservicios

Proyecto fintech de gestión de préstamos (consumo) con arquitectura en microservicios.

## 1. Arquitectura del proyecto

- `apps/user-service`: Servicio de gestión de usuarios (registro, login, perfil) con FastAPI, SQLAlchemy, PostgreSQL, JWT, Bcrypt.
- `apps/loan-service`: Servicio de simulación de préstamos (cálculo de cuota/tasa/total/CAE) con FastAPI.
- `apps/frontend`: SPA React (Vite) que consume ambos servicios.
- `apps/scan-service`: Servicio de OCR para gestionar la subida de documentos. En el fondo es un puro endpoint analyze. El problema es que funciona con la API de google cloud vision, entonces usted debe hacer un esfuerzo considerable por conseguir una llave JSON que le permita correr este servicio.
- `docker-compose.yml`: despliega PostgreSQL (`db`) para microservicios.

Diseño clave:
- Microservicios independientes, cada uno en su directorio y puerto.
- Infraestructura + dominio separados
- CORS configurado para `http://localhost:5173`.

## 2. Requisitos previos

- Git.
- Docker y Docker Compose (v2+).
- WSL 2 (Windows recomendado para Python/Linux).
- Python 3.12+.
- Node.js 20+ y npm (o pnpm/yarn).
- `curl` / Postman para pruebas.
- Cuenta de google cloud con llave de API para cloud vision habilitada
- Archivo de credenciales JSON que conecta con el servicio de google cloud

## 3. Clonar repo

```bash
git clone https://gitlab.com/grupo054/GRUPO05-2025-PROYINF.git
cd Proyecto/
```

## 4. Configurar la base de datos

### 4.1. Arrancar DB (crea automáticamente users_db y loans_db)

```bash
docker compose up -d
```
En caso de que usted ya tenga levantado el proyecto tiene que hacer:

```bash
docker compose down -v && docker compose up -d
```

- Bases: `users_db` (creada por defecto) y `loans_db` (creada por script SQL en `db-init/`).
- Puerto: `5432:5432`

### 4.3. Verificar contenedor

```bash
docker ps | grep postgres
```

### 4.4. Opcional: usar `psql`

```bash
docker exec -it postgres_db psql -U user_admin -d users_db
```

## 5. Dependencias Python (microservicios)

### 5.1. user-service

```bash
cd apps/user-service
python -m venv .venv
source .venv/bin/activate   # WSL/macOS
# .venv\Scripts\activate  # Windows PowerShell
pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic passlib[bcrypt] python-jose pyjwt pydantic[email] python-dotenv
```

### 5.2. loan-service

```bash
cd ../../apps/loan-service
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic passlib[bcrypt] python-jose pyjwt python-dotenv
```

### 5.3. scan-service

```bash
cd ../../apps/scan-service
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn google-cloud-vision python-dotenv python-multipart pydantic pymupdf
```

## 6. Dependencias frontend

```bash
cd ../../apps/frontend
npm install
```

## 7. Variables de entorno
Para la seguridad del proyecto y su correcto funcionamiento de cada servicio, en necesario crear archivos .env que alamcenan las variables de entorno del proyecto que son claves para su funcionamiento.

### 7.1. /Proyecto
Dentro de la carpeta Proyecto se debe crear el siguiente archivo .env

```bash
DB_USER=user_admin
DB_PASSWORD=PCt7wo4!
DB_NAME_USERS=users_db
```

### 7.2. /loan-service
Dentro de loan-service se debe crear el siguiente archivo .env

```bash
# Base de Datos
DATABASE_URL="postgresql://user_admin:PCt7wo4!@localhost:5433/loans_db"

# Seguridad y JWT (Deben coincidir con user-service)
SECRET_KEY="PCt7wo4!"
ALGORITHM="HS256"

# Credenciales SMTP de Notificaciones
GMAIL_SENDER="proyectoprestamo06@gmail.com"
GMAIL_APP_PASSWORD="warh qojp jdar pjgi"
```

### 7.2. /user-service
Dentro de user-service se debe crear el siguiente archivo .env

```bash
# Base de Datos
DATABASE_URL="postgresql://user_admin:PCt7wo4!@localhost:5433/users_db"

# Seguridad y JWT
SECRET_KEY="PCt7wo4!"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="1440"
```

### 7.3. /scan-service
Dentro de scan-service se debe crear el siguiente archivo .env

```bash
GOOGLE_APPLICATION_CREDENTIALS="{ubicación de archivo con credencial API}"
```

## 8. Levantar servicios

### 8.1. user-service

```bash
cd apps/user-service
source .venv/bin/activate
cd src/
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Docs interactivos: `http://localhost:8000/docs`
- Health-check: no hay endpoint explícito, usar `GET http://localhost:8000/docs`

### 8.2. loan-service

```bash
cd apps/loan-service
source .venv/bin/activate
cd src/
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

- Docs: `http://localhost:8001/docs`


### 8.3. scan-service

Usted debe crear un archivo .env en la carpeta en el cual debe poner.

```bash
GOOGLE_APPLICATION_CREDENTIALS="tu/ruta/a/la/credencial/JSON/de/google"
```

```bash
cd apps/scan-service
source venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8002
```

- Docs: `http://localhost:8002/docs`

### 8.4. frontend

```bash
cd apps/frontend
npm run dev
```

- App web: `http://localhost:5173`

## 9. Endpoints y pruebas de funcionamiento

### 9.1. user-service

- `POST /register` (registro)
- `POST /login` (token JWT)
- `PUT /perfil` (actualizar perfil, requiere `Authorization: Bearer <token>`)

Ejemplo `curl register`:

```bash
curl -X POST http://localhost:8000/register \
  -H 'Content-Type: application/json' \
  -d '{"rut":"12345678-9","nombre":"Juan","apellido":"Pérez","email":"juan@x.com","password":"Test1234","telefono":"+56912345678"}'
```

### 9.2. loan-service

- `POST /simular`

Ejemplo:

```bash
curl -X POST http://localhost:8001/simular \
  -H 'Content-Type: application/json' \
  -d '{"monto":1000000,"cuotas":12}'
```


### 9.3. scan-service

- `POST /analyze`

Ejemplo (requiere que tengas una foto en la carpeta scan-service para hacer la prueba; los tipos de documento son carnet, liquidacion, cotizaciones, deuda):

```bash
curl -X POST http://localhost:8002/analyze \
-F "file=@test_carnet3.jpeg" \
-F "document_type=carnet"
```

## 10. Esquema de microservicios y diseño

- Bounded context `user-service`: identidad/seguridad/usuarios.
- Bounded context `loan-service`: cálculos financieros sin persistencia actual.
- Bounded context `scan-service`: hacer la extracción de información de documentos.
- `frontend`: UI desacoplada consumiendo APIs.
- `docker-compose.yml`: dependencia infra (`db`) con persistencia en volumen.

### 10.1. Separación de capas

- `infrastructure`: implementación concreta (base de datos, hashing, JWT, CORS).
- `logic`/`domain`: reglas de negocio (`calculator`).
- `schemas`: DTOs de entrada/salida (validación por Pydantic).
- `main.py`: orquesta rutas y dependencias.

## 11. Troubleshooting común

- Si falla conexión a DB: verificar `docker compose ps` y credenciales.
- Si `db` no arranca: `docker compose down --volumes` y `docker compose up -d` para recrear.
- Endpoint responde 404: revisar puertos y ruta en `uvicorn`.
- 500 en `/perfil`: token JWT inválido/expirado.

## 12. Bulk commands para desarrollo rápido

```bash
# Desde la raíz
docker compose up -d

# user-service
cd apps/user-service && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt || pip install fastapi uvicorn sqlalchemy psycopg2-binary passlib[bcrypt] python-jose pydantic && uvicorn src.main:app --reload --port 8000

# loan-service
cd apps/loan-service && python -m venv .venv && source .venv/bin/activate && pip install fastapi uvicorn pydantic && uvicorn src.main:app --reload --port 8001

# scan-service
cd apps/scan-service && python3 -m venv venv && source venv/bin/activate && pip install fastapi uvicorn google-cloud-vision python-dotenv python-multipart pydantic && uvicorn src.main:app --reload --port 8002

# frontend
cd apps/frontend && npm install && npm run dev
```

## 13. Adicional
En la carpeta scan-service existe la carpeta PoC. 
Ahí se realizan las pruebas de concepto para ver cómo funciona la API de google cloud vision. Esto sirve para hacer modificaciones parciales y pruebas sin necesidad de hacer cambios en la plataforma, lo que permite hacer ajustes de desarrollo más rápido.