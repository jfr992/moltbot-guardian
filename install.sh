#!/bin/bash
# MoltBot Security Dashboard - One-line installer
# Usage: curl -fsSL https://raw.githubusercontent.com/jfr992/moltbot-security-dashboard/main/install.sh | bash

set -e

REPO="jfr992/moltbot-security-dashboard"
INSTALL_DIR="${MOLTBOT_DIR:-$HOME/.moltbot}"
BIN_DIR="${BIN_DIR:-/usr/local/bin}"

echo "🦀 MoltBot Security Dashboard Installer"
echo "========================================"

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
    Darwin) PLATFORM="macos" ;;
    Linux)  PLATFORM="linux" ;;
    *)      echo "❌ Unsupported OS: $OS"; exit 1 ;;
esac

echo "📍 Platform: $PLATFORM ($ARCH)"

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Install it first:"
    case "$OS" in
        Darwin) echo "   brew install python3" ;;
        Linux)  echo "   sudo apt install python3 python3-venv" ;;
    esac
    exit 1
fi

# Create install directory
echo "📁 Installing to: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# Download latest release or clone
if command -v curl &> /dev/null; then
    echo "📦 Downloading MoltBot..."
    
    # Try to get binary release first
    RELEASE_URL="https://github.com/$REPO/releases/latest/download/moltbot-$PLATFORM"
    if curl -fsSL --head "$RELEASE_URL" &> /dev/null; then
        curl -fsSL "$RELEASE_URL" -o "$INSTALL_DIR/moltbot"
        chmod +x "$INSTALL_DIR/moltbot"
        BINARY_MODE=true
    else
        # Fall back to source install
        echo "📦 No binary release found, installing from source..."
        BINARY_MODE=false
    fi
fi

if [ "$BINARY_MODE" != "true" ]; then
    # Clone repository
    if command -v git &> /dev/null; then
        git clone --depth 1 "https://github.com/$REPO.git" "$INSTALL_DIR/src" 2>/dev/null || {
            rm -rf "$INSTALL_DIR/src"
            git clone --depth 1 "https://github.com/$REPO.git" "$INSTALL_DIR/src"
        }
    else
        echo "📦 Downloading archive..."
        curl -fsSL "https://github.com/$REPO/archive/main.tar.gz" | tar -xz -C "$INSTALL_DIR"
        mv "$INSTALL_DIR/moltbot-security-dashboard-main" "$INSTALL_DIR/src"
    fi

    # Setup Python environment
    echo "🐍 Setting up Python environment..."
    cd "$INSTALL_DIR/src/dashboard"
    python3 -m venv venv
    source venv/bin/activate
    pip install -q -r requirements.txt

    # Create launcher script
    cat > "$INSTALL_DIR/moltbot" << 'EOF'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/src/dashboard"
source venv/bin/activate
exec python app.py "$@"
EOF
    chmod +x "$INSTALL_DIR/moltbot"
fi

# Create symlink in PATH
echo "🔗 Creating symlink..."
if [ -w "$BIN_DIR" ]; then
    ln -sf "$INSTALL_DIR/moltbot" "$BIN_DIR/moltbot"
else
    sudo ln -sf "$INSTALL_DIR/moltbot" "$BIN_DIR/moltbot"
fi

echo ""
echo "========================================"
echo "✅ MoltBot installed successfully!"
echo ""
echo "To start the dashboard:"
echo "  moltbot"
echo ""
echo "Then open: http://localhost:5050"
echo "========================================"
