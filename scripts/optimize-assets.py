#!/usr/bin/env python3
"""Otimiza imagens em /assets/:
- Capas (book-*.png) em PNG sem transparência → reconverte para JPEG quality 85 (capas não precisam de alfa)
- JPEGs → reotimiza com quality 82 progressive
- Logos com transparência → mantém PNG, mas re-otimiza
- Gera companion .webp para todo mundo (browsers modernos preferem)
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "assets"
SKIP = {"styles.css"}

# Logos / marcas com transparência: manter PNG
KEEP_PNG = {"logo.png", "logo-mark.png", "ref-logo.png"}

def has_alpha(img):
    return img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)

total_before = total_after = 0
rows = []

for path in sorted(ROOT.iterdir()):
    if path.is_dir() or path.name in SKIP:
        continue
    ext = path.suffix.lower()
    if ext not in {".png", ".jpg", ".jpeg"}:
        continue

    orig_size = path.stat().st_size
    total_before += orig_size

    img = Image.open(path)
    name = path.name

    # Decide formato final
    if name in KEEP_PNG and has_alpha(img):
        # Re-otimiza PNG
        img.save(path, "PNG", optimize=True)
        final_path = path
    else:
        # Vira JPEG (mesmo se era PNG, se não precisa de alfa)
        if img.mode != "RGB":
            img = img.convert("RGB")
        if ext == ".png":
            # troca extensão pra .jpg
            final_path = path.with_suffix(".jpg")
            path.unlink()
        else:
            final_path = path
        img.save(final_path, "JPEG", quality=85, optimize=True, progressive=True)

    new_size = final_path.stat().st_size

    # Gera .webp companion
    webp_path = final_path.with_suffix(".webp")
    img.save(webp_path, "WEBP", quality=82, method=6)
    webp_size = webp_path.stat().st_size
    total_after += new_size + webp_size

    rows.append((name, final_path.name, orig_size, new_size, webp_size))

# Relatório
print(f"\n{'original':<22} {'final':<22} {'antes':>8} {'depois':>8} {'webp':>7} {'-':>6}")
print("-" * 82)
for orig, final, before, after, webp in rows:
    saving = (1 - after / before) * 100
    print(f"{orig:<22} {final:<22} {before/1024:>6.0f}KB {after/1024:>6.0f}KB {webp/1024:>5.0f}KB {saving:>5.0f}%")
print("-" * 82)
print(f"{'TOTAL':<22} {'':<22} {total_before/1024/1024:>5.1f}MB {(total_after-sum(r[4] for r in rows))/1024/1024:>5.1f}MB+webp")
print(f"\nantes (originais):       {total_before/1024/1024:>5.1f}MB")
print(f"depois (jpg+png+webp):   {total_after/1024/1024:>5.1f}MB")
print(f"só os arquivos primários: {sum(r[3] for r in rows)/1024/1024:>5.1f}MB")
