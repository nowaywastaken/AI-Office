#!/bin/bash

# AI Office Suite Starter
# This script starts both the backend and frontend in new terminal windows.

echo "🚀 Starting AI Office Suite..."

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 1. Start Backend in a new terminal (macOS specific)
echo "📂 Starting Backend (FastAPI)..."
osascript -e "tell application \"Terminal\" to do script \"cd '$DIR/server' && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000\""

# 2. Start Frontend in a new terminal (macOS specific)
echo "📂 Starting Frontend (Vite/React)..."
osascript -e "tell application \"Terminal\" to do script \"cd '$DIR/client' && npm run dev\""

echo ""
echo "✨ Services are launching in new terminal windows!"
echo "🌐 Once ready, access the app at: http://localhost:5173"
echo "-------------------------------------------------------"
