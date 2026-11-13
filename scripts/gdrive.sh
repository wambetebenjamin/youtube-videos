#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"

ensure_gdown() {
  if ! python3 -c "import gdown" >/dev/null 2>&1; then
    echo "Installing gdown for Google Drive downloads..."
    python3 -m pip install --user --break-system-packages -q gdown 2>/dev/null \
      || python3 -m pip install --user -q gdown
  fi
}

ensure_rclone() {
  if command -v rclone >/dev/null 2>&1; then
    return 0
  fi

  if command -v apt-get >/dev/null 2>&1; then
    local SUDO=""
    if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
      SUDO="sudo"
    fi
    echo "Installing rclone for Google Drive authentication & uploads..."
    $SUDO apt-get update -y && $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends rclone
  else
    echo "Error: rclone is not installed. Install rclone from https://rclone.org/install/ first." >&2
    exit 1
  fi
}

extract_drive_id() {
  local input="$1"
  python3 - "$input" << 'PY'
import re, sys
s = sys.argv[1].strip()
patterns = [
    r"/file/d/([A-Za-z0-9_-]+)",
    r"/folders/([A-Za-z0-9_-]+)",
    r"[?&]id=([A-Za-z0-9_-]+)",
]
for pat in patterns:
    m = re.search(pat, s)
    if m:
        print(m.group(1))
        sys.exit(0)
if re.fullmatch(r"[A-Za-z0-9_-]{20,}", s):
    print(s)
    sys.exit(0)
print("")
PY
}

cmd_pull() {
  if [ "$#" -lt 1 ]; then
    echo "Usage: npm run gdrive:pull -- \"<google-drive-url-or-id>\" [output-path]" >&2
    exit 1
  fi

  local source="$1"
  local dest="${2:-public/raw-footage/}"

  mkdir -p public/raw-footage
  ensure_gdown

  echo "Downloading from Google Drive into: $dest"
  if [[ "$source" == *"/folders/"* ]]; then
    if python3 -m gdown --folder --continue --retries 3 "$source" -O "$dest"; then
      echo "Download complete -> $dest"
      return 0
    fi
  else
    if python3 -m gdown --continue --retries 3 "$source" -O "$dest"; then
      echo "Download complete -> $dest"
      ls -lh "$dest" 2>/dev/null || true
      return 0
    fi
  fi

  # Fallback to authenticated rclone if the file is restricted/private
  local file_id
  file_id="$(extract_drive_id "$source")"
  if [ -n "$file_id" ] && command -v rclone >/dev/null 2>&1 && rclone listremotes 2>/dev/null | grep -q "^gdrive:$"; then
    echo "Public link download failed; retrying via authenticated rclone (gdrive:)..."
    rclone backend copyid gdrive: "$file_id" "$dest" -P
    echo "Download complete -> $dest"
    return 0
  fi

  echo "Error: Could not download '$source'." >&2
  echo "Make sure the file is shared as 'Anyone with the link', or run 'npm run gdrive:auth' to authenticate your Google account." >&2
  exit 1
}

cmd_auth() {
  ensure_rclone

  if rclone listremotes 2>/dev/null | grep -q "^gdrive:$"; then
    echo "Removing existing 'gdrive:' remote to refresh authentication..."
    rclone config delete gdrive || true
  fi

  local LOG_FILE
  LOG_FILE="$(mktemp)"

  rclone config create gdrive drive scope=drive >"$LOG_FILE" 2>&1 &
  local RCLONE_PID=$!

  local LOCAL_AUTH_URL=""
  for _ in $(seq 1 30); do
    LOCAL_AUTH_URL="$(grep -oE 'http://127\.0\.0\.1:[0-9]+/auth\?state=[^[:space:]]+' "$LOG_FILE" | head -n 1 || true)"
    if [ -n "$LOCAL_AUTH_URL" ]; then
      break
    fi
    sleep 0.3
  done

  if [ -z "$LOCAL_AUTH_URL" ]; then
    cat "$LOG_FILE"
    rm -f "$LOG_FILE"
    wait "$RCLONE_PID"
    return 0
  fi

  local GOOGLE_URL
  GOOGLE_URL="$(curl -sI "$LOCAL_AUTH_URL" | tr -d '\r' | sed -n 's/^[Ll]ocation: //p' | head -n 1)"

  echo "=================================================================="
  echo "Step 1: Open this Google sign-in link in your browser and click Allow:"
  echo ""
  echo "  $GOOGLE_URL"
  echo ""
  echo "Step 2: After approving, your browser will redirect to a page that"
  echo "        says 'This site can't be reached' (127.0.0.1:53682)."
  echo "        Copy the FULL URL from your browser's address bar and paste it below:"
  echo "=================================================================="
  printf "Paste http://127.0.0.1:53682/?... URL here: "
  local CALLBACK_URL=""
  read -r CALLBACK_URL

  curl -fsS "$CALLBACK_URL" >/dev/null
  wait "$RCLONE_PID" || true
  rm -f "$LOG_FILE"

  echo ""
  echo "Google Drive connected! Verifying access..."
  rclone about gdrive: || true
}

cmd_push() {
  if [ "$#" -lt 1 ]; then
    echo "Usage: npm run gdrive:push -- <local-file> [drive-folder-url-or-id-or-folder-name]" >&2
    exit 1
  fi

  local local_file="$1"
  local target="${2:-AI-Video-Studio}"

  if [ ! -f "$local_file" ]; then
    echo "Error: Local file not found: $local_file" >&2
    exit 1
  fi

  ensure_rclone

  if ! rclone listremotes 2>/dev/null | grep -q "^gdrive:$"; then
    echo "Google Drive is not authenticated yet. Running 'gdrive:auth' first..."
    cmd_auth
  fi

  local filename
  filename="$(basename "$local_file")"
  local folder_id
  folder_id="$(extract_drive_id "$target")"

  if [[ "$target" == *"/folders/"* ]] || [ -n "$folder_id" ]; then
    echo "Uploading '$local_file' to Google Drive folder ID: $folder_id ..."
    rclone copy "$local_file" gdrive: --drive-root-folder-id "$folder_id" -P
    echo ""
    echo "Generating shareable Google Drive link..."
    local share_url
    share_url="$(rclone link "gdrive:$filename" --drive-root-folder-id "$folder_id")"
    echo "=========================================================="
    echo "Uploaded successfully!"
    echo "Shareable Link: $share_url"
    echo "=========================================================="
  else
    local clean_folder="${target#/}"
    clean_folder="${clean_folder%/}"
    echo "Uploading '$local_file' to Google Drive folder: gdrive:$clean_folder/ ..."
    rclone copy "$local_file" "gdrive:$clean_folder" -P
    echo ""
    echo "Generating shareable Google Drive link..."
    local share_url
    share_url="$(rclone link "gdrive:$clean_folder/$filename")"
    echo "=========================================================="
    echo "Uploaded successfully!"
    echo "Shareable Link: $share_url"
    echo "=========================================================="
  fi
}

usage() {
  cat << 'EOF'
Google Drive Helper for AI Video Studio (GitHub Codespaces)

Commands:
  bash scripts/gdrive.sh pull "<drive-url-or-id>" [output-path]
      Download a shared Google Drive file or folder (any size, >100MB supported)
      into public/raw-footage/ (or custom output-path).

  bash scripts/gdrive.sh auth
      Connect your Google Drive account via rclone (required once for uploads
      or downloading private non-public Drive files).

  bash scripts/gdrive.sh push <local-file> [folder-url | folder-id | folder-name]
      Upload a rendered video (e.g. out/marketing-unique.mp4) to Google Drive
      and print its shareable link.
EOF
}

ACTION="${1:-help}"
shift || true

case "$ACTION" in
  pull) cmd_pull "$@" ;;
  auth) cmd_auth "$@" ;;
  push) cmd_push "$@" ;;
  help|-h|--help) usage ;;
  *)
    echo "Unknown command: $ACTION" >&2
    usage
    exit 1
    ;;
esac
