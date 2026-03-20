#!/bin/bash
# Load emulator env vars and start dev server
set -a
source "$(dirname "$0")/../.env.emulators"
set +a
exec npx next dev --port 3001
