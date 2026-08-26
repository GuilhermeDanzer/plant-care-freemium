#!/usr/bin/env bash
# Rehearsal-only recording of the running iOS simulator.
# Apple requires the FINAL submission video to be recorded on a PHYSICAL
# device — this script just helps you dry-run the flow locally.
set -euo pipefail

DEVICE="${1:-booted}"
OUT="${2:-simulator-recording.mp4}"

echo "Recording simulator ($DEVICE) to $OUT ..."
echo "Press Ctrl+C to stop."

xcrun simctl io "$DEVICE" recordVideo "$OUT"
