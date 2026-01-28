#!/bin/bash
# MoltBot Guardian - Quick Install
# curl -fsSL https://raw.githubusercontent.com/jfr992/moltbot-security-dashboard/main/install.sh | bash

set -e

INSTALL_DIR="${MOLTBOT_DIR:-$HOME/.moltbot-guardian}"
REPO="https://github.com/jfr992/moltbot-security-dashboard"

echo "🦀 Installing MoltBot Guardian..."

# Check Python
command -v python3 &>/dev/null || { echo "❌ Python 3 required"; exit 1; }

# Clone/update
if [ -d "$INSTALL_DIR" ]; then
    cd "$INSTALL_DIR" && git pull -q 2>/dev/null || true
else
    git clone --depth 1 -q "$REPO" "$INSTALL_DIR"
fi

# Setup
cd "$INSTALL_DIR"
./dev.sh setup

echo ""
echo "✅ Installed: $INSTALL_DIR"
echo "   Start: $INSTALL_DIR/dev.sh start"
echo "   Dashboard: http://localhost:5050"
