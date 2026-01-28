#!/bin/bash
# MoltBot Security Dashboard - Start Script

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/dashboard"

# Activate venv if exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found. Run ./setup.sh first."
    exit 1
fi

echo "🦀 Starting MoltBot on http://localhost:5050"
exec python app.py "$@"
