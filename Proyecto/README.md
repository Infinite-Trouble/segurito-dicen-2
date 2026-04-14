# Sistema de Préstamos Online - Microservicios

Proyecto fintech de gestión de préstamos (consumo) con arquitectura en microservicios.

## 1. Arquitectura del proyecto

- `apps/user-service`: Servicio de gestión de usuarios (registro, login, perfil) con FastAPI, SQLAlchemy, PostgreSQL, JWT, Bcrypt.
- `apps/loan-service`: Servicio de simulación de préstamos (cálculo de cuota/tasa/total/CAE) con FastAPI.
- `apps/frontend`: SPA React (Vite) que consume ambos servicios.
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

## 3. Clonar repo

```bash
cd ~/Proyectos
git clone https://<tu-git-host>/prestamos.git
cd prestamos
```

## 4. Configurar la base de datos

### 4.1. Arrancar DB (crea automáticamente users_db y loans_db)

```bash
docker compose up -d
```

- Usuario: `user_admin`
- Password: `PCt7wo4!`
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
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic passlib[bcrypt] python-jose pyjwt pydantic[email]
```

### 5.2. loan-service

```bash
cd ../../apps/loan-service
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic passlib[bcrypt] python-jose pyjwt
```

## 6. Dependencias frontend

```bash
cd ../../apps/frontend
npm install
```

## 7. Inicializar tablas SQL

El proyecto no incluye migraciones automáticas, por eso debes crear las tablas manualmente la primera vez.

### 7.1. user-service

```bash
cd apps/user-service
source .venv/bin/activate
python3 - <<'PY'
from src.infrastructure.db import models, database
models.Base.metadata.create_all(bind=database.engine)
print('Tablas de users_db creadas')
PY
```

### 7.2. loan-service (loans_db se crea automáticamente por script SQL)

```bash
cd apps/loan-service
source .venv/bin/activate
python3 - <<'PY'
from src.infrastructure import models, database
models.Base.metadata.create_all(bind=database.engine)
print('Tablas de loans_db creadas')
PY
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

### 8.3. frontend

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

## 10. Esquema de microservicios y diseño

- Bounded context `user-service`: identidad/seguridad/usuarios.
- Bounded context `loan-service`: cálculos financieros sin persistencia actual.
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

# frontend
cd apps/frontend && npm install && npm run dev
```