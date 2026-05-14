#!/usr/bin/env python3
"""Build estático: lê catalogo.json e gera /livros/index.html + /livros/<slug>/index.html.

Uso:
    python3 scripts/build.py            # gera tudo
    python3 scripts/build.py --watch    # (futuro) rebuild ao salvar
"""

import json
import sys
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent.parent
TPL_DIR = ROOT / "templates"
LIVROS_DIR = ROOT / "livros"
CATALOG = ROOT / "catalogo.json"

env = Environment(
    loader=FileSystemLoader(TPL_DIR),
    autoescape=select_autoescape(["html"]),
    trim_blocks=True,
    lstrip_blocks=True,
)

def main():
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    site = data["site"]
    books = sorted(data["books"], key=lambda b: b.get("order", 999))

    # === /livros/index.html ===
    tpl_catalogo = env.get_template("catalogo.html")
    html_catalogo = tpl_catalogo.render(
        site=site,
        books=books,
        page_title="Biblioteca · Sua Própria Trilha",
        meta_description="Catálogo completo de e-books de Sua Própria Trilha. "
                         "Não foram pensados em uma escrivaninha — foram pensados em "
                         "cumeeiras, fogueiras e madrugadas frias.",
        og_image="/ebooks-cover.jpg",
    )
    out = LIVROS_DIR / "index.html"
    out.write_text(html_catalogo, encoding="utf-8")
    print(f"  ✓ {out.relative_to(ROOT)}")

    # === /livros/<slug>/index.html ===
    tpl_livro = env.get_template("livro.html")
    for book in books:
        # Calcula next se não tiver: o próximo na ordem
        if not book.get("next_slug"):
            idx = next((i for i, b in enumerate(books) if b["slug"] == book["slug"]), -1)
            if 0 <= idx < len(books) - 1:
                nxt = books[idx + 1]
                book["next_slug"] = nxt["slug"]
                book["next_title"] = nxt["title"]

        html_livro = tpl_livro.render(
            site=site,
            book=book,
            page_title=book.get("page_title") or f"{book['title']} · E-book · Sua Própria Trilha",
            meta_description=book.get("meta_description") or book.get("tagline", ""),
            og_image=book.get("cover_image", "/ebooks-cover.jpg"),
        )
        out_dir = LIVROS_DIR / book["slug"]
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "index.html").write_text(html_livro, encoding="utf-8")
        print(f"  ✓ {out_dir.relative_to(ROOT)}/index.html  ·  {book['title']}")

    print(f"\nBuild concluído: 1 catálogo + {len(books)} páginas de livro")

if __name__ == "__main__":
    main()
