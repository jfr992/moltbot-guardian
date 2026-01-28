#!/bin/bash
# MoltBot Security Dashboard - Development Setup
#
# Use this if you're developing or running from source.
# For installation, use ./install.sh instead.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🦀 MoltBot Development Setup"
echo "============================"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 required. Install with: brew install python3"
    exit 1
fi

# Setup backend
echo ""
echo "📦 Setting up Python backend..."
cd "$SCRIPT_DIR/dashboard"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✓ Python dependencies installed"

# Setup frontend (if Node.js available)
if command -v node &> /dev/null; then
    echo ""
    echo "📦 Setting up React frontend..."
    cd "$SCRIPT_DIR/dashboard-ui"
    npm install --silent 2>/dev/null || npm install
    npm run build --silent 2>/dev/null || npm run build
    echo "✓ Frontend built"
else
    echo ""
    echo "ℹ️  Node.js not found - using pre-built frontend"
fi

echo ""
echo "============================"
echo "✅ Setup complete!"
echo ""
echo "To start:"
echo "  ./start.sh"
echo ""
echo "Or manually:"
echo "  cd dashboard && source venv/bin/activate && python app.py"
echo ""
echo "Dashboard: http://localhost:5050"
echo "============================"
