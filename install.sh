#!/bin/bash
# MoltBot Security Dashboard - Installer
# 
# Usage (after cloning):
#   ./install.sh
#
# This installs MoltBot to ~/.moltbot and creates a 'moltbot' command.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_DIR="${MOLTBOT_DIR:-$HOME/.moltbot}"

echo "🦀 MoltBot Security Dashboard Installer"
echo "========================================"
echo ""

# Check prerequisites
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required."
    case "$(uname -s)" in
        Darwin) echo "   Install with: brew install python3" ;;
        Linux)  echo "   Install with: sudo apt install python3 python3-venv" ;;
    esac
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Create install directory
echo ""
echo "📁 Installing to: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# Copy source files
echo "📦 Copying files..."
cp -r "$SCRIPT_DIR/dashboard" "$INSTALL_DIR/"
cp -r "$SCRIPT_DIR/dashboard-ui/dist" "$INSTALL_DIR/dashboard/static" 2>/dev/null || true

# Setup Python environment
echo "🐍 Setting up Python environment..."
cd "$INSTALL_DIR/dashboard"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo "✓ Dependencies installed"

# Create launcher script
cat > "$INSTALL_DIR/moltbot" << 'LAUNCHER'
#!/bin/bash
MOLTBOT_DIR="${MOLTBOT_DIR:-$HOME/.moltbot}"
cd "$MOLTBOT_DIR/dashboard"
source venv/bin/activate
exec python app.py "$@"
LAUNCHER
chmod +x "$INSTALL_DIR/moltbot"

# Create symlink (try without sudo first, then suggest alternatives)
BIN_DIR="/usr/local/bin"
SYMLINK_CREATED=false

if [ -w "$BIN_DIR" ]; then
    ln -sf "$INSTALL_DIR/moltbot" "$BIN_DIR/moltbot"
    SYMLINK_CREATED=true
fi

echo ""
echo "========================================"
echo "✅ MoltBot installed successfully!"
echo ""
if [ "$SYMLINK_CREATED" = true ]; then
    echo "Start the dashboard:"
    echo "  moltbot"
else
    echo "Start the dashboard:"
    echo "  ~/.moltbot/moltbot"
    echo ""
    echo "To add 'moltbot' command to PATH, run:"
    echo "  sudo ln -sf ~/.moltbot/moltbot /usr/local/bin/moltbot"
fi
echo ""
echo "Dashboard: http://localhost:5050"
echo "========================================"
