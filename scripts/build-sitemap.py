#!/usr/bin/env python3
"""Gera sitemap.xml a partir do catalogo.json + páginas fixas."""

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "catalogo.json"
SITEMAP = ROOT / "sitemap.xml"

data = json.loads(CATALOG.read_text(encoding="utf-8"))
domain = "https://" + data["site"]["domain"]
today = date.today().isoformat()

urls = [
    (f"{domain}/", "1.0"),
    (f"{domain}/manifesto/", "0.8"),
    (f"{domain}/livros/", "0.9"),
]
for book in data["books"]:
    urls.append((f"{domain}/livros/{book['slug']}/", "0.7"))

xml = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for loc, prio in urls:
    xml.append("  <url>")
    xml.append(f"    <loc>{loc}</loc>")
    xml.append(f"    <lastmod>{today}</lastmod>")
    xml.append(f"    <priority>{prio}</priority>")
    xml.append("  </url>")
xml.append("</urlset>")

SITEMAP.write_text("\n".join(xml) + "\n", encoding="utf-8")
print(f"Sitemap com {len(urls)} URLs → {SITEMAP.relative_to(ROOT)}")
