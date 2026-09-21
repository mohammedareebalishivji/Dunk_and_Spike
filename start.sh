#!/usr/bin/env bash

# ==============================================================================
#  Dunk & Spike - Collegiate Basketball & Volleyball Tournament Platform
#  Sanctioned VNL & NCAA/FIBA Live Scoring & Administration Portal
# ==============================================================================

set -eo pipefail

# Ensure script runs from the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Text Styling
BOLD='\033[1m'
CYAN='\033[0;36m'
ORANGE='\033[38;5;208m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${ORANGE}${BOLD}"
echo "======================================================================"
echo "    D U N K   &   S P I K E   ·   T O U R N A M E N T   P O R T A L       "
echo "        FIVB/VNL Volleyball & FIBA/NCAA Basketball Live Scoring        "
echo "======================================================================"
echo -e "${NC}"

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] Node.js is not installed or not in PATH.${NC}"
  echo "Please install Node.js (v18+) to run Dunk & Spike."
  exit 1
fi

# Check npm
if ! command -v npm >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] npm is not installed or not in PATH.${NC}"
  exit 1
fi

NODE_VER=$(node -v)
echo -e "${CYAN}→ Environment:${NC} Node.js ${NODE_VER} · npm $(npm -v)"

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}→ node_modules not found. Installing project dependencies...${NC}"
  npm install
  echo -e "${GREEN}✓ Dependencies installed successfully.${NC}"
fi

PORT="${PORT:-3000}"
HOST="${HOST:-127.0.0.1}"

# Handle CLI Flags
MODE="${1:-dev}"

case "$MODE" in
  --build|-b)
    echo -e "${CYAN}→ Running production build...${NC}"
    npm run build
    echo -e "${GREEN}✓ Build artifacts generated in ./dist${NC}"
    exit 0
    ;;

  --test|-t)
    echo -e "${CYAN}→ Executing Vitest rule verification suite...${NC}"
    npm test
    exit 0
    ;;

  --server|-s)
    echo -e "${CYAN}→ Starting standalone Realtime Tournament Database Server (SQLite 3 WAL + WebSockets)...${NC}"
    exec npm run server
    ;;

  --prod|--preview|-p)
    echo -e "${CYAN}→ Building production bundle...${NC}"
    npm run build
    echo ""
    echo -e "${GREEN}${BOLD}✓ Starting Realtime Database Server (SQLite 3 WAL + WebSockets)...${NC}"
    npm run server &
    SERVER_PID=$!
    trap 'kill $SERVER_PID 2>/dev/null || true' EXIT INT TERM
    sleep 0.5

    echo -e "${GREEN}${BOLD}✓ Production build complete.${NC}"
    echo -e "${CYAN}→ Launching production preview server on ${BOLD}http://${HOST}:${PORT}/${NC}"
    echo -e "${CYAN}  Realtime DB:     ${BOLD}ws://${HOST}:3001/ws${NC}"
    echo -e "${YELLOW}  Admin Portal Login:  Username: admin  |  Passcode: admin2026${NC}"
    echo ""
    exec npm run preview -- --host "$HOST" --port "$PORT"
    ;;

  dev|*)
    echo ""
    echo -e "${GREEN}${BOLD}✓ Starting Realtime Tournament Database Server (SQLite 3 WAL + WebSockets)...${NC}"
    npm run server &
    SERVER_PID=$!
    trap 'kill $SERVER_PID 2>/dev/null || true' EXIT INT TERM
    sleep 0.5

    echo -e "${GREEN}${BOLD}✓ Launching Dunk & Spike Live Development Server...${NC}"
    echo -e "${CYAN}  Local URL:       ${BOLD}http://${HOST}:${PORT}/${NC}"
    echo -e "${CYAN}  Realtime DB:     ${BOLD}ws://${HOST}:3001/ws${NC} (SQLite WAL: data/tournament.db)"
    echo -e "${ORANGE}  Admin Console:   Username: ${BOLD}admin${NC}${ORANGE}  |  Passcode: ${BOLD}admin2026${NC}"
    echo -e "${CYAN}  Rules Active:    VNL 3-Set / 5-Set (15pt Decider, Deuce by 2) & NCAA Basketball${NC}"
    echo ""
    echo -e "${BOLD}Press Ctrl+C to stop both servers.${NC}"
    echo "----------------------------------------------------------------------"
    exec npm run dev -- --host "$HOST" --port "$PORT"
    ;;
esac
