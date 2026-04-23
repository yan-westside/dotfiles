#!/usr/bin/env bash
# install.sh — Restore Claude Code setup from dotfiles
# Usage: ./install.sh
# Run from the root of this repo after cloning on a new device.

set -e

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
MCPS_DIR="$HOME/.awesome-mcps"

echo "==> Setting up Claude Code config from dotfiles..."

# ── 1. Claude config ──────────────────────────────────────────────────────────
mkdir -p "$CLAUDE_DIR/commands"
mkdir -p "$CLAUDE_DIR/projects/-home-$(whoami)-Projects-cursor-analytics/memory/asa_study"

cp "$DOTFILES_DIR/claude/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
cp "$DOTFILES_DIR/claude/commands/"* "$CLAUDE_DIR/commands/"

echo "  ✓ CLAUDE.md and commands installed"

# ── 2. Memory files ───────────────────────────────────────────────────────────
MEMORY_DEST="$CLAUDE_DIR/projects/-home-$(whoami)-Projects-cursor-analytics/memory"
cp "$DOTFILES_DIR/claude/memory/"*.md "$MEMORY_DEST/"
cp "$DOTFILES_DIR/claude/memory/asa_study/"*.md "$MEMORY_DEST/asa_study/"

echo "  ✓ Memory files installed"

# ── 3. Settings (template → you must fill in secrets) ────────────────────────
if [ ! -f "$CLAUDE_DIR/settings.json" ]; then
  cp "$DOTFILES_DIR/claude/settings.template.json" "$CLAUDE_DIR/settings.json"
  echo "  ⚠️  settings.json created from template — fill in your API keys!"
else
  echo "  ↷  settings.json already exists — skipping (merge manually if needed)"
fi

# ── 4. Personal skills ────────────────────────────────────────────────────────
# These go into the cursor-analytics project's .claude/skills/
# Update CURSOR_ANALYTICS_DIR if your project lives elsewhere
CURSOR_ANALYTICS_DIR="$HOME/Projects/cursor-analytics"
if [ -d "$CURSOR_ANALYTICS_DIR" ]; then
  cp -r "$DOTFILES_DIR/skills/coaching" "$CURSOR_ANALYTICS_DIR/.claude/skills/"
  cp -r "$DOTFILES_DIR/skills/dr-impact-calc" "$CURSOR_ANALYTICS_DIR/.claude/skills/"
  echo "  ✓ Personal skills installed into cursor-analytics"
else
  echo "  ↷  cursor-analytics not found at $CURSOR_ANALYTICS_DIR — skills skipped"
fi

# ── 5. MCP servers ────────────────────────────────────────────────────────────
mkdir -p "$MCPS_DIR"

# Assembled
if [ ! -d "$MCPS_DIR/assembled" ]; then
  cp -r "$DOTFILES_DIR/mcps/assembled" "$MCPS_DIR/assembled"
  echo "  ✓ Assembled MCP copied — run 'npm install && npm run build' in ~/.awesome-mcps/assembled"
else
  echo "  ↷  Assembled MCP already exists — skipping"
fi

# Google Workspace
if [ ! -d "$MCPS_DIR/google-workspace" ]; then
  cp -r "$DOTFILES_DIR/mcps/google-workspace" "$MCPS_DIR/google-workspace"
  echo "  ✓ Google Workspace MCP copied — run 'npm install && npm run build' in ~/.awesome-mcps/google-workspace"
else
  echo "  ↷  Google Workspace MCP already exists — skipping"
fi

# Awesome Vibe Coding
if [ ! -d "$MCPS_DIR/awesome-vibe-coding" ]; then
  cp -r "$DOTFILES_DIR/mcps/awesome-vibe-coding" "$MCPS_DIR/awesome-vibe-coding"
  echo "  ✓ Awesome Vibe Coding MCP copied"
else
  echo "  ↷  Awesome Vibe Coding already exists — skipping"
fi

echo ""
echo "==> Done! Next steps:"
echo "  1. Fill in API keys in ~/.claude/settings.json"
echo "  2. cd ~/.awesome-mcps/assembled && npm install && npm run build"
echo "  3. cd ~/.awesome-mcps/google-workspace && npm install && npm run build"
echo "  4. Re-auth Claude Code: claude auth"
echo "  5. Open your project: cd ~/Projects/cursor-analytics && claude"
