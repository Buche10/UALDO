#!/usr/bin/env bash
# Vigila tasks/inbox y ejecuta un agente CLI por cada archivo .md nuevo.
# Uso: ./watch_tasks.sh            (agente por defecto: agy)
#      TASK_AGENT=claude ./watch_tasks.sh
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT="${TASK_AGENT:-agy}"
POLL_SECONDS="${POLL_SECONDS:-3}"
INBOX_DIR="$ROOT/tasks/inbox"
COMPLETED_DIR="$ROOT/tasks/completed"
FAILED_DIR="$ROOT/tasks/failed"
LOGS_DIR="$ROOT/tasks/logs"

mkdir -p "$INBOX_DIR" "$COMPLETED_DIR" "$FAILED_DIR" "$LOGS_DIR"

if ! command -v "$AGENT" >/dev/null 2>&1; then
  echo "No se encontró '$AGENT' en el PATH. Instálalo o define TASK_AGENT." >&2
  exit 1
fi

# Tamaño estable entre dos lecturas = el editor terminó de escribir
file_ready() {
  local size1 size2
  size1=$(wc -c < "$1")
  sleep 1
  size2=$(wc -c < "$1")
  [[ "$size1" == "$size2" ]]
}

run_task() {
  local file="$1"
  local filename timestamp log_file prompt exit_code target
  filename=$(basename "$file")
  timestamp=$(date +"%Y%m%d_%H%M%S")
  log_file="$LOGS_DIR/${timestamp}_${filename%.md}.log"

  echo ""
  echo "=========================================="
  echo "[TAREA] Nueva tarea detectada: $filename"
  echo "=========================================="

  local brand_rule=""
  if [[ -f "$ROOT/docs/ualdo-brand.md" ]]; then
    brand_rule=" Sigue estrictamente docs/ualdo-brand.md y usa solo los assets de docs/brand-assets."
  fi
  prompt="Actúa como desarrollador principal. Lee el archivo 'tasks/inbox/$filename' con los requerimientos, implementa todo el código necesario en el proyecto, ejecuta las pruebas y asegura que la solución funcione correctamente. Nunca uses emojis en ninguna parte.${brand_rule} No modifiques ni muevas archivos dentro de tasks/."

  (cd "$ROOT" && "$AGENT" -p "$prompt" --dangerously-skip-permissions) 2>&1 | tee "$log_file"
  exit_code=${PIPESTATUS[0]}

  if [[ $exit_code -eq 0 ]]; then
    target="$COMPLETED_DIR/${timestamp}_${filename}"
    mv "$file" "$target"
    echo "[OK] Tarea completada y archivada en: $target"
  else
    target="$FAILED_DIR/${timestamp}_${filename}"
    mv "$file" "$target"
    echo "[ERROR] El agente terminó con código $exit_code. Tarea movida a: $target (log: $log_file)"
  fi
}

echo "Vigilante de tareas activo (agente: $AGENT)."
echo "Deposita archivos .md en: $INBOX_DIR"
echo "   Ctrl+C para detener."

# Sondeo simple: funciona igual en Linux, macOS y Git Bash sin inotify/fswatch
while true; do
  for file in "$INBOX_DIR"/*.md; do
    [[ -f "$file" ]] || continue
    if file_ready "$file"; then
      run_task "$file"
      echo "Esperando nuevas tareas..."
    fi
  done
  sleep "$POLL_SECONDS"
done
