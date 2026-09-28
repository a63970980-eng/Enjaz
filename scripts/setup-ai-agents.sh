#!/usr/bin/env bash
set -euo pipefail

# Enjaz Codespaces AI-agent bootstrap.
# Installs terminal coding agents only; it does not modify Enjaz runtime dependencies,
# Supabase configuration, Auth configuration, or application source code.

echo "==> Checking Node/npm"
node --version
npm --version

echo "==> Installing OpenCode"
npm install -g opencode-ai@latest

echo "==> Installing Gemini CLI"
npm install -g @google/gemini-cli@latest

echo "==> Installing OpenAI Codex CLI"
npm install -g @openai/codex@latest

echo
echo "==> Installed agents"
command -v opencode && opencode --version || true
command -v gemini && gemini --version || true
command -v codex && codex --version || true

echo
echo "Agents installed. Authentication is intentionally left interactive."
echo "Next:"
echo "  opencode"
echo "  gemini"
echo "  codex"
