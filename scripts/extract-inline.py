#!/usr/bin/env python3
"""Extrai data URIs base64 do index.html para arquivos físicos otimizados em /assets/inline/.
Cada inline ganha um nome semântico baseado no contexto da tag onde aparece."""

import base64
import io
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
HTML_PATH = ROOT / "index.html"
OUT_DIR = ROOT / "assets" / "inline"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Nomes semânticos na ordem em que aparecem no HTML (mapeados pelo contexto)
NAMES = [
    "favicon",        # 1. <link rel="icon">
    "nav-logo",       # 2. .nav__logo
    "hero-main",      # 3. .hero__media
    "hero-seal",      # 4. .hero__seal__circle
    "story-fig",      # 5. .story__media
    "brand-mark",     # 6. .brand-mark
    "talks-fig",      # 7. .talks__media
    "foot-brand",     # 8. .foot__brand
]

html = HTML_PATH.read_text(encoding="utf-8")

# Captura grupos: 1=mime ext, 2=conteúdo b64
pattern = re.compile(r'data:image/(\w+);base64,([A-Za-z0-9+/=]{200,})')
matches = list(pattern.finditer(html))

assert len(matches) == len(NAMES), f"esperado {len(NAMES)} matches, obtido {len(matches)}"

report = []
# Substitui de trás pra frente pra não invalidar índices
new_html = html
for m, name in zip(reversed(matches), reversed(NAMES)):
    ext = m.group(1).lower()
    b64 = m.group(2)
    raw = base64.b64decode(b64)
    orig_kb = len(raw) / 1024

    # Decide formato de saída: PNG com transparência fica PNG; JPEG vira JPEG otimizado.
    img = Image.open(io.BytesIO(raw))
    out_ext = "png" if img.mode in ("RGBA", "LA", "P") and ext == "png" else "jpg"
    out_path = OUT_DIR / f"{name}.{out_ext}"

    if out_ext == "jpg":
        if img.mode != "RGB":
            img = img.convert("RGB")
        img.save(out_path, "JPEG", quality=82, optimize=True, progressive=True)
    else:
        img.save(out_path, "PNG", optimize=True)

    new_kb = out_path.stat().st_size / 1024
    rel_path = f"/assets/inline/{name}.{out_ext}"
    new_html = new_html[:m.start()] + rel_path + new_html[m.end():]
    report.append((name, f"{img.width}x{img.height}", f"{orig_kb:,.0f}KB", f"{new_kb:,.0f}KB"))

HTML_PATH.write_text(new_html, encoding="utf-8")

# Relatório
print(f"\n{'arquivo':<14} {'dimensões':<12} {'original':<10} {'otimizado':<10} {'economia':<10}")
print("-" * 60)
total_orig = total_new = 0
for name, dim, orig, new in reversed(report):  # ordem do HTML
    o = float(orig.replace(",", "").rstrip("KB"))
    n = float(new.replace(",", "").rstrip("KB"))
    total_orig += o
    total_new += n
    print(f"{name:<14} {dim:<12} {orig:<10} {new:<10} {(1-n/o)*100:>6.0f}%")
print("-" * 60)
print(f"{'TOTAL':<14} {'':<12} {total_orig:>6,.0f}KB  {total_new:>6,.0f}KB   {(1-total_new/total_orig)*100:>5.0f}%")
print(f"\nindex.html: {HTML_PATH.stat().st_size / 1024:,.0f}KB")
