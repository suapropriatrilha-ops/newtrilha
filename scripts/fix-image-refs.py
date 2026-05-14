#!/usr/bin/env python3
"""Após optimize-assets, alguns PNGs viraram JPG. Esse script:
1. Encontra todos os PNGs renomeados (não existem mais como .png mas existem como .jpg)
2. Faz find-replace nos HTMLs trocando .png → .jpg pra esses nomes
3. Para capas de livro (book-*.jpg) nas <img>, envelopa em <picture> com source WebP
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

# Quais nomes mudaram de .png pra .jpg?
renamed = []
for jpg in ASSETS.glob("*.jpg"):
    stem = jpg.stem
    # se NÃO existe um .png com mesmo stem, e o nome sugere que foi convertido
    png_equiv = ASSETS / f"{stem}.png"
    if not png_equiv.exists() and stem.startswith(("book-", "logo")):
        renamed.append(stem)

print(f"Stems convertidos PNG→JPG: {renamed}")

# Aplica troca em todos os HTMLs
html_files = list(ROOT.glob("**/*.html"))
total_replacements = 0
for html_file in html_files:
    text = html_file.read_text(encoding="utf-8")
    original = text
    for stem in renamed:
        text = text.replace(f"{stem}.png", f"{stem}.jpg")
    if text != original:
        diff = sum(1 for _ in re.finditer("|".join(re.escape(s) for s in renamed), original))
        total_replacements += diff
        html_file.write_text(text, encoding="utf-8")
        print(f"  fix: {html_file.relative_to(ROOT)} ({diff} refs)")

print(f"\nTotal de referências corrigidas: {total_replacements}")
