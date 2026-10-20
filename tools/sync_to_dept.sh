#!/bin/bash
# ينسخ المصحف إلى موقع القسم (ibnrushd-islamic/mushaf/) عشان يفتح داخل تطبيق القسم مثل ملف التلاوة.
# الاستخدام: bash tools/sync_to_dept.sh ../ibnrushd-islamic   ثم ارفع المستودعين.
set -e
cd "$(dirname "$0")/.."
DEPT=${1:-../ibnrushd-islamic}
OUT="$DEPT/mushaf"
mkdir -p "$OUT"
rm -rf "$OUT" && mkdir -p "$OUT"
cp -r index.html app.js style.css sw.js manifest.webmanifest data fonts icons audio "$OUT/"
echo "تم النسخ إلى $OUT"
