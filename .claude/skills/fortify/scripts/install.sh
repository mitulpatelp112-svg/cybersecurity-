#!/usr/bin/env bash
# Fortify installer — copy the Fortify skill into any project so its Claude Code
# session can invoke `fortify`. Usage:
#   ./install.sh /path/to/target/project
# Run from the directory containing the `fortify` skill folder, or set
# FORTIFY_SRC to its path.
set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 /path/to/target/project" >&2
  exit 1
fi
if [[ ! -d "$TARGET" ]]; then
  echo "Target directory does not exist: $TARGET" >&2
  exit 1
fi

# Locate the fortify skill source (this script lives in fortify/scripts/).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORTIFY_SRC="${FORTIFY_SRC:-$(cd "$SCRIPT_DIR/.." && pwd)}"

if [[ ! -f "$FORTIFY_SRC/SKILL.md" ]]; then
  echo "Could not find SKILL.md in $FORTIFY_SRC. Set FORTIFY_SRC to the fortify skill dir." >&2
  exit 1
fi

DEST="$TARGET/.claude/skills/fortify"
mkdir -p "$DEST"
cp -R "$FORTIFY_SRC/." "$DEST/"

echo "Fortify installed to: $DEST"
echo "Open the target project with Claude Code and run the 'fortify' skill to begin."
