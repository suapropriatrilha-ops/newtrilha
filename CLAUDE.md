# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este repo

Site estático da marca **Sua Própria Trilha** (catálogo de e-books). HTML puro + Tailwind via CDN + CSS customizado, com **build em Python/Jinja2** para gerar as páginas dos livros a partir de `catalogo.json`.

## Estado atual: soft launch

O site está em "modo construção" intencional. Não trate isto como bug:

- `/` (`index.html`) é uma página **"Em breve"** publicada.
- O site real está em `/preview.html` (mesma pasta, sem link público).
- Todas as páginas internas (`/manifesto/`, `/livros/`, `/livros/<slug>/`, `/404.html`) carregam `<meta name="robots" content="noindex, nofollow">` via `templates/_partials/head.html`.
- `robots.txt` bloqueia tudo exceto a raiz.

Quando for lançar de verdade, a sequência está documentada no `README.md` (renomear preview → index, remover `noindex` do head partial, liberar `robots.txt`, gerar `sitemap.xml`). Não execute esse switch sem o usuário pedir explicitamente.

## Pipeline de build (a parte que importa)

**Fonte da verdade:** `catalogo.json` + `templates/`. Os HTMLs em `livros/<slug>/index.html` e `livros/index.html` são **gerados** — não edite à mão, eles são sobrescritos a cada build.

```bash
# Pré-requisito (Python 3.9+)
pip install jinja2 beautifulsoup4 pillow

# Build principal: gera /livros/index.html + /livros/<slug>/index.html para cada livro
python3 scripts/build.py

# Atualiza sitemap.xml (só usar após o lançamento)
python3 scripts/build-sitemap.py
```

**Fluxo para editar um livro:**
1. Editar campo no `catalogo.json` (título, preço, `mp_link`, etc.).
2. Capa em `/assets/book-XX.jpg` (companion `.webp` opcional via `scripts/optimize-assets.py`).
3. PDF em `/ebooks/<slug>.pdf`.
4. `python3 scripts/build.py`.

**Fluxo para mudar layout de TODAS as páginas de livro:** editar `templates/livro.html` e rodar build. Para o catálogo: `templates/catalogo.html`. Para o `<head>` compartilhado: `templates/_partials/head.html`.

`index.html`, `preview.html`, `manifesto/index.html` e `404.html` **não passam pelo build** — são HTMLs estáticos editados diretamente.

## Scripts utilitários (`scripts/`)

- `build.py` — gera o catálogo e as 13 páginas de livro a partir do JSON + templates.
- `build-sitemap.py` — gera `sitemap.xml` a partir do JSON (usar só pós-lançamento).
- `extract-inline.py` — extrai data-URIs base64 do `index.html` para `/assets/inline/` (já foi rodado; reuso só se voltar a inlinar imagens).
- `optimize-assets.py` — recomprime PNG/JPG e gera companion `.webp`. Rodar depois de adicionar novas capas/imagens.
- `extract-catalog.py` / `fix-image-refs.py` — utilitários one-shot da migração inicial; raramente reusados.

## Deploy

`vercel.json` está configurado (trailing slash, cache `/assets/`, `noindex` em `/ebooks/`, headers de segurança em `/*`). O repo também mantém `_headers` para Netlify/Cloudflare Pages — **edite os dois** se mexer em headers, eles cobrem provedores diferentes (GitHub Pages ignora ambos).

## Integração Mercado Pago

Botões "Comprar agora" leem `mp_link` de cada livro no `catalogo.json`. Quando vazio, o template `templates/livro.html` cai automaticamente para um `mailto:` de fallback. Para ativar o checkout real: criar Link de Pagamento no MP e colar a URL no campo `mp_link` correspondente — sem mexer no template.

## ⚠️ Gap de segurança conhecido: PDFs públicos

`/ebooks/*.pdf` são **publicamente acessíveis** por URL direta. `robots.txt` e `X-Robots-Tag` impedem indexação, mas não acesso. Antes de cobrar de verdade, é preciso mover os PDFs para storage privado com link assinado (Drive privado, R2/S3 + webhook MP). Está rastreado no checklist do `README.md`. Não considere o site "pronto pra vender" enquanto isso estiver assim.

## Convenções

- **Tipografia:** Fraunces (display/serif), Manrope (sans), Caveat (script) — definidas em `templates/_partials/head.html` via Google Fonts (5 pesos selecionados).
- **Cores:** definidas em `oklch()` direto na `tailwind.config` inline do head partial — não em `tailwind.config.js`. Mudar lá afeta todas as páginas geradas.
- **CSS:** utilitários do Tailwind via CDN + customizações em `assets/styles.css`.
- **Imagens:** sempre que adicionar uma nova, gerar `.webp` companion (referenciar via `<picture>` no template, padrão já existente).
- **Textos:** o tom da marca é em português, pessoal e direto. Preservar voz ao editar `catalogo.json` ou copy nos templates.
