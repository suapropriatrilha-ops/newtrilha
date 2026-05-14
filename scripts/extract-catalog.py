#!/usr/bin/env python3
"""Lê os 13 HTMLs de /livros/<slug>/index.html e extrai os dados em catalogo.json."""

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
LIVROS_DIR = ROOT / "livros"

def text(el):
    return el.get_text(strip=True) if el else ""

def extract_book(slug, html_path):
    soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")
    book = {"slug": slug}

    # Meta
    title_tag = soup.find("title")
    book["page_title"] = text(title_tag)
    meta_desc = soup.find("meta", attrs={"name": "description"})
    book["meta_description"] = meta_desc["content"] if meta_desc else ""

    # Hero
    h1 = soup.find("h1")
    book["title"] = text(h1)

    # Eyebrow ("E-book · Sua Própria Trilha")
    eyebrow = soup.find("p", class_="eyebrow")
    book["eyebrow"] = text(eyebrow)

    # Tagline (p italic amber depois do h1)
    if h1:
        tagline = h1.find_next("p", class_=re.compile("italic.*amber|amber.*italic"))
        book["tagline"] = text(tagline)

    # Imagem da capa
    cover_img = soup.find("img", alt=re.compile(r"^Capa:", re.I))
    if cover_img:
        book["cover_image"] = cover_img.get("src", "")
        book["cover_alt"] = cover_img.get("alt", "")

    # Subtítulo abaixo da capa
    if cover_img:
        sub = cover_img.find_parent("div").find_next_sibling("p")
        book["cover_subtitle"] = text(sub)

    # Parágrafos de descrição (antes do bloco de preço)
    price_block = soup.find(string=re.compile(r"Investimento"))
    desc_paras = []
    if price_block:
        # sobe até o ancestral que contém o bloco
        desc_container = h1.find_next("div", class_=re.compile("space-y"))
        if desc_container:
            desc_paras = [text(p) for p in desc_container.find_all("p")]
    book["description_paragraphs"] = [p for p in desc_paras if p]

    # Preço
    price_el = soup.find(class_=re.compile(r"text-amber.*leading-none|leading-none.*text-amber"))
    if not price_el:
        price_el = soup.find("span", string=re.compile(r"R\$"))
    book["price"] = text(price_el).replace("\xa0", " ")

    # Parcelas
    parcels = soup.find(string=re.compile(r"ou \d+x de"))
    book["installments"] = parcels.strip() if parcels else ""

    # CTA mailto / link de pagamento atual
    cta = soup.find("a", href=re.compile(r"^mailto:"))
    if cta:
        book["mp_link"] = ""  # placeholder p/ link real do MP
        book["_legacy_mailto"] = cta["href"]

    # Link da amostra (pdf)
    pdf_link = soup.find("a", href=re.compile(r"/ebooks/.+\.pdf$"))
    if pdf_link:
        book["pdf_sample"] = pdf_link["href"]

    # Metadados do bloco dl: Formato/Páginas/Acesso
    dl = soup.find("dl")
    if dl:
        meta_fields = {}
        for dt, dd in zip(dl.find_all("dt"), dl.find_all("dd")):
            meta_fields[text(dt).lower()] = text(dd)
        book["format"] = meta_fields.get("formato", "PDF")
        book["pages"] = meta_fields.get("páginas", "—")
        book["access"] = meta_fields.get("acesso", "Vitalício")

    # Autor
    autor_p = soup.find(string=re.compile(r"^Autor"))
    if autor_p:
        book["author"] = autor_p.strip().replace("Autor · ", "")

    # Para quem é
    headers = soup.find_all("p", class_="eyebrow")
    for h in headers:
        h_text = text(h)
        if "Para quem" in h_text:
            ul = h.find_next("ul")
            if ul:
                items = []
                for li in ul.find_all("li"):
                    spans = li.find_all("span")
                    if len(spans) >= 2:
                        items.append(text(spans[-1]))
                book["target_audience"] = items
        elif "O que você leva" in h_text or "Você leva" in h_text:
            ul = h.find_next("ul")
            if ul:
                items = []
                for li in ul.find_all("li"):
                    spans = li.find_all("span")
                    if len(spans) >= 2:
                        items.append(text(spans[-1]))
                book["whats_included"] = items

    # Garantia (texto livre)
    garantia_eyebrow = soup.find("p", class_="eyebrow", string=re.compile("Garantia"))
    if garantia_eyebrow:
        garantia_h = garantia_eyebrow.find_next("p", class_=re.compile("font-display"))
        garantia_desc = garantia_eyebrow.find_next("p", class_=re.compile("text-sm|text-base"))
        if garantia_h:
            book["guarantee_title"] = text(garantia_h)
        if garantia_desc:
            book["guarantee_description"] = text(garantia_desc)

    # Próximo na trilha
    next_link = soup.find("a", href=re.compile(r"^/livros/[^/]+/$"))
    if next_link:
        next_href = next_link["href"]
        next_slug = next_href.strip("/").split("/")[-1]
        if next_slug != slug:
            book["next_slug"] = next_slug
            book["next_title"] = text(next_link).rstrip(" →").strip()

    return book

# Coleta os 13 slugs
slugs = sorted([d.name for d in LIVROS_DIR.iterdir() if d.is_dir()])
books = []
for slug in slugs:
    html_path = LIVROS_DIR / slug / "index.html"
    if not html_path.exists():
        continue
    book = extract_book(slug, html_path)
    books.append(book)
    print(f"  ✓ {slug:<45} {book.get('title', '?')}")

# Ordem do catálogo: pela numeração no /livros/index.html
# Vou ler o index pra pegar a ordem visual real
livros_index = (LIVROS_DIR / "index.html").read_text(encoding="utf-8")
order_pattern = re.compile(r'href="/livros/([^/]+)/"')
visual_order = []
seen = set()
for m in order_pattern.finditer(livros_index):
    s = m.group(1)
    if s not in seen:
        seen.add(s)
        visual_order.append(s)

# Ordena books conforme visual_order, mantendo no fim os que não aparecem no index
order_map = {s: i for i, s in enumerate(visual_order)}
books.sort(key=lambda b: order_map.get(b["slug"], 9999))
for i, b in enumerate(books, 1):
    b["order"] = i

catalogo = {
    "site": {
        "title": "Sua Própria Trilha",
        "tagline": "Um lugar para respirar, refletir e reconstruir.",
        "domain": "suapropriatrilha.com",
        "author": "Wexley Servilieri",
        "default_price": "R$ 37",
        "default_installments": "ou 4x de R$ 9,99",
    },
    "books": books,
}

out = ROOT / "catalogo.json"
out.write_text(json.dumps(catalogo, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\nGerado: {out.relative_to(ROOT)}  ({out.stat().st_size / 1024:.1f}KB, {len(books)} livros)")
