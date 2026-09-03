# Para correr el proyecto

Se le proporcionarán las instrucciones para preparar las variables de entorno por otro medio.
Una vez configuradas estas variables, siga.

1. Corra docker con


```bash
docker compose up -d
```

2. Levante los servicios

2.1 user-service

```bash
# si es primera vez
cd apps/user-service
python3 -m venv venv
source venv/bin/activate   # WSL/macOS
# .venv\Scripts\activate  # Windows PowerShell
pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic passlib[bcrypt] python-jose pyjwt pydantic[email] python-dotenv
# de la segunda en adelante solo esto
cd src/
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2.2 loan-service

```bash
# si es la primera vez
cd apps/user-service
python3 -m venv venv
source venv/bin/activate   # WSL/macOS
# .venv\Scripts\activate  # Windows PowerShell
pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic passlib[bcrypt] python-jose pyjwt python-dotenv transbank-sdk
# de la segunda en adelante solo esto
cd src/
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```
2.3 scan-service

```bash
#si es la primera vez
cd apps/scan-service
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn google-cloud-vision python-dotenv python-multipart pydantic pymupdf python-jose pyjwt
# de la segunda en adelante solo esto
uvicorn src.main:app --reload --host 0.0.0.0 --port 8002
```

3. Levante el frontend


```bash
#
#si es la primera vez
cd apps/frontend
npm install
# de la segunda en adelante solo eso
npm run dev
```
4. Puede usar el servicio en :
```bash
http://localhost:5173
```

Una vez que tenga todo configurado le sale más simple hacer

```bash
./start.sh
```
