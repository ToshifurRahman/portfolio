#!/usr/bin/env bash
# Regenerate public/certificates/previews/<slug>.webp from public/certificates/files/.
# PDFs: first page rendered with pdftoppm (poppler). Raster: used as is.
# Conversion: ffmpeg with libwebp (this machine has ffmpeg 8 with libwebp; no cwebp/magick).
# Every preview is at most 800 px wide and at most 80 KB.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
files="$root/public/certificates/files"
out="$root/public/certificates/previews"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

max_width=800
max_bytes=$((80 * 1024))

mkdir -p "$out"

for src in "$files"/*; do
  name="$(basename "$src")"
  slug="${name%.*}"
  case "${name##*.}" in
    pdf | PDF)
      pdftoppm -f 1 -l 1 -r 150 -png -singlefile "$src" "$tmp/$slug"
      page="$tmp/$slug.png"
      ;;
    png | PNG | jpg | JPG | jpeg | JPEG)
      page="$src"
      ;;
    *)
      echo "skip $name (unsupported)" >&2
      continue
      ;;
  esac

  preview="$out/$slug.webp"
  quality=82
  while :; do
    ffmpeg -hide_banner -loglevel error -y -i "$page" \
      -vf "scale='min($max_width,iw)':-2:flags=lanczos" \
      -c:v libwebp -quality "$quality" -compression_level 6 "$preview"
    size=$(stat -c %s "$preview")
    if [ "$size" -le "$max_bytes" ]; then
      break
    fi
    if [ "$quality" -le 40 ]; then
      echo "FAIL $slug: ${size} bytes at quality 40" >&2
      exit 1
    fi
    quality=$((quality - 8))
  done

  width=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$preview")
  height=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$preview")
  printf '%-28s %4sx%-4s %6s bytes  q%s\n' "$slug" "$width" "$height" "$size" "$quality"
done
