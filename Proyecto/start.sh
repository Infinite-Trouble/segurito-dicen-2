#!/bin/bash

# Función para apagar limpiamente todos los servicios al presionar Ctrl+C
cleanup() {
    echo -e "\n\n[!] Deteniendo todos los servicios en segundo plano..."
    # Mata a todos los procesos hijos de este script (los uvicorn y npm)
    pkill -P $$
    echo "[✓] Procesos detenidos."
    exit
}

# Capturar Ctrl+C (SIGINT) para ejecutar la función de limpieza
trap cleanup INT

echo "[*] Levantando contenedores de Docker..."
docker compose up -d

echo "[*] Iniciando user-service (Puerto 8000)..."
(cd apps/user-service && source venv/bin/activate && cd src/ && uvicorn main:app --reload --host 0.0.0.0 --port 8000) &

echo "[*] Iniciando loan-service (Puerto 8001)..."
(cd apps/loan-service && source venv/bin/activate && cd src/ && uvicorn main:app --reload --host 0.0.0.0 --port 8001) &

echo "[*] Iniciando scan-service (Puerto 8002)..."
(cd apps/scan-service && source venv/bin/activate && uvicorn src.main:app --reload --host 0.0.0.0 --port 8002) &

echo "[*] Iniciando frontend..."
# Ejecutamos el frontend en primer plano para mantener la terminal ocupada y ver sus logs
cd apps/frontend && npm run dev

# En caso de que el frontend llegue a caerse, esperamos a los servicios en segundo plano
wait
