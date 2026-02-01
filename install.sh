#!/bin/bash
# OpenClaw Sentinel - Installation Script
# https://github.com/jfr992/openclaw-sentinel

set -e

echo "🦞 OpenClaw Sentinel Installer"
echo "=============================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "   Install from: https://nodejs.org/ (v22+ recommended)"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Node.js v20+ recommended (found v$NODE_VERSION)"
fi

# Check OpenClaw
if ! command -v openclaw &> /dev/null; then
    echo "⚠️  OpenClaw CLI not found. Memory tab will be limited."
    echo "   Install from: https://docs.openclaw.ai"
fi

# Clone or update
INSTALL_DIR="${SENTINEL_DIR:-$HOME/openclaw-sentinel}"

if [ -d "$INSTALL_DIR" ]; then
    echo "📦 Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo "📦 Cloning OpenClaw Sentinel..."
    git clone https://github.com/jfr992/openclaw-sentinel.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --silent

# Create start script
cat > "$INSTALL_DIR/start.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
node server.js
EOF
chmod +x "$INSTALL_DIR/start.sh"

echo ""
echo "✅ Installation complete!"
echo ""
echo "To start the dashboard:"
echo "  cd $INSTALL_DIR && npm start"
echo ""
echo "Or run:"
echo "  $INSTALL_DIR/start.sh"
echo ""
echo "Dashboard URL: http://localhost:5055"
echo ""
echo "Optional: Start OTEL stack for metrics/traces:"
echo "  cd $INSTALL_DIR/otel && docker compose up -d"
echo ""
echo "🦞 Happy monitoring!"
