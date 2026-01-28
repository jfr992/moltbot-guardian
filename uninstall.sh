#!/bin/bash
# MoltBot Security Dashboard - Uninstaller

set -e

INSTALL_DIR="${MOLTBOT_DIR:-$HOME/.moltbot}"
BIN_DIR="${BIN_DIR:-/usr/local/bin}"

echo "🦀 MoltBot Uninstaller"
echo "======================"

read -p "Remove MoltBot and all data? [y/N] " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Remove symlink
    if [ -L "$BIN_DIR/moltbot" ]; then
        sudo rm -f "$BIN_DIR/moltbot" 2>/dev/null || rm -f "$BIN_DIR/moltbot"
        echo "✓ Removed symlink"
    fi

    # Remove install directory
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
        echo "✓ Removed $INSTALL_DIR"
    fi

    echo ""
    echo "✅ MoltBot uninstalled successfully!"
else
    echo "Cancelled."
fi
