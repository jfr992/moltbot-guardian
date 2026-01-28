#!/bin/bash
# MoltBot Security Dashboard - Uninstaller

INSTALL_DIR="${MOLTBOT_DIR:-$HOME/.moltbot}"
BIN_DIR="/usr/local/bin"

echo "🦀 MoltBot Uninstaller"
echo "======================"
echo ""

# Check what exists
HAS_INSTALL=false
HAS_SYMLINK=false

[ -d "$INSTALL_DIR" ] && HAS_INSTALL=true
[ -L "$BIN_DIR/moltbot" ] && HAS_SYMLINK=true

if [ "$HAS_INSTALL" = false ] && [ "$HAS_SYMLINK" = false ]; then
    echo "MoltBot is not installed."
    exit 0
fi

echo "Found:"
[ "$HAS_INSTALL" = true ] && echo "  • Installation: $INSTALL_DIR"
[ "$HAS_SYMLINK" = true ] && echo "  • Command: $BIN_DIR/moltbot"
echo ""

read -p "Remove MoltBot? [y/N] " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Remove symlink
    if [ "$HAS_SYMLINK" = true ]; then
        if [ -w "$BIN_DIR" ]; then
            rm -f "$BIN_DIR/moltbot"
        else
            sudo rm -f "$BIN_DIR/moltbot"
        fi
        echo "✓ Removed command"
    fi

    # Remove install directory
    if [ "$HAS_INSTALL" = true ]; then
        rm -rf "$INSTALL_DIR"
        echo "✓ Removed $INSTALL_DIR"
    fi

    echo ""
    echo "✅ MoltBot uninstalled."
    echo ""
    echo "Note: Clawdbot security data (~/.clawdbot/security/) was preserved."
    echo "To remove that too: rm -rf ~/.clawdbot/security"
else
    echo "Cancelled."
fi
