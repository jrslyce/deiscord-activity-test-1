#!/usr/bin/env bash
set -euo pipefail

# Railpack couldn’t auto-detect a monorepo (backend/ + frontend/).
# Adding a root start.sh forces the Shell buildpack and starts both services.

echo "==> Installing backend deps"
cd backend
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "==> Starting FastAPI backend on :8001"
uvicorn server:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!
cd ..

echo "==> Installing frontend deps"
cd frontend
yarn install --frozen-lockfile || yarn install

echo "==> Building frontend"
# IMPORTANT: REACT_APP_BACKEND_URL must be set in the deploy environment BEFORE this build.
yarn build

echo "==> Serving frontend build on :3000"
# Use npx so we don’t have to permanently add a dependency.
# This keeps the repo clean while still providing a production web server.
npx --yes serve -s build -l 3000 --no-clipboard

# If the frontend server exits, stop the backend too.
kill "$BACKEND_PID" || true
wait "$BACKEND_PID" || true
