# Sua Própria Trilha — Site Estático

Site em **fase de construção** (soft launch). O `index.html` público mostra
uma página "Em breve"; o site completo fica em `preview.html` e nas demais
pastas, todas com `noindex` no `<head>` e bloqueadas pelo `robots.txt`.

## Estratégia de soft launch

- `/` (público) → página "Em breve, a trilha está sendo desenhada."
- `/preview.html` (privado, sem link) → o site real, completo
- `/manifesto/`, `/livros/`, `/livros/<slug>/` → páginas internas
  acessíveis se você souber a URL, mas com `noindex`

Quando o site estiver pronto pra lançar:
1. Apaga a `index.html` atual e renomeia `preview.html` → `index.html`
2. Remove a linha `<meta name="robots" content="noindex, nofollow">` de
   `templates/_partials/head.html` (e roda `python3 scripts/build.py`)
3. Remove a mesma linha de `manifesto/index.html` e `404.html`
4. Reescreve o `robots.txt` pra liberar tudo (e descomenta o `Sitemap:`)
5. Gera `sitemap.xml` rodando `python3 scripts/build-sitemap.py`

## Subindo no GitHub Pages

1. Crie um repo no GitHub (público ou privado — Pages funciona em ambos com
   conta Pro).
2. Sobe o conteúdo desta pasta na branch `main`:
   ```bash
   cd static-site-v4
   git init
   git add .
   git commit -m "Soft launch — em construção"
   git branch -M main
   git remote add origin git@github.com:SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```
3. No GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**
4. Aguarde ~1 minuto. URL será `https://SEU_USUARIO.github.io/SEU_REPO/`.
5. **Custom domain** (opcional): em Pages, adicione `suapropriatrilha.com`.
   Depois aponta o DNS (registro A pros IPs do GitHub Pages ou CNAME).

> Cuidado: GitHub Pages **não suporta** o arquivo `_headers` (isso é só
> Netlify/Cloudflare Pages). Se quiser cache control e headers de segurança,
> publique no Netlify ou Cloudflare Pages — também é grátis e o fluxo é o
> mesmo: conecta o repo do GitHub e ele faz deploy automático.

## Estrutura

```
.
├── index.html                          # 🟢 Página "Em breve" (público)
├── preview.html                        # 🟡 Site real (acesso via URL direta)
├── 404.html
├── manifesto/index.html
├── livros/
│   ├── index.html                      # Catálogo (gerado do template)
│   └── <slug>/index.html               # 13 páginas geradas
├── assets/
│   ├── styles.css                      # Design tokens + utilitários
│   ├── book-*.jpg / .webp              # Capas
│   └── *.jpg / *.webp                  # Demais imagens
├── ebooks/                             # PDFs dos e-books
├── catalogo.json                       # ⭐ Fonte da verdade dos livros
├── templates/                          # Jinja2 (livro / catálogo / _partials)
├── scripts/                            # build.py, build-sitemap.py, etc.
├── robots.txt                          # Bloqueia tudo menos a raiz
├── .gitignore
└── _headers                            # (Netlify/Cloudflare apenas)
```

## Pipeline de build

`templates/` + `catalogo.json` é a **fonte da verdade**. Mudou texto de um
livro, preço, ou layout? Edita o JSON ou o template e roda:

```bash
python3 scripts/build.py            # gera /livros/*
python3 scripts/build-sitemap.py    # atualiza sitemap.xml
```

Requer Python 3.9+:

```bash
pip install jinja2 beautifulsoup4 pillow
```

## Adicionar / editar um livro

1. Edita `catalogo.json` — campos do livro (title, tagline, price, `mp_link`…).
2. Põe a capa em `/assets/book-XX.jpg` (gera `.webp` companion com Pillow).
3. Põe o PDF em `/ebooks/<slug>.pdf`.
4. Roda `python3 scripts/build.py`.

**Não edite** os HTMLs em `/livros/<slug>/index.html` diretamente — eles são
regerados a cada build.

## Integração Mercado Pago

Os botões "Comprar agora" usam o campo `mp_link` de cada livro no
`catalogo.json`. Enquanto está vazio, o template gera um `mailto:` de
fallback automaticamente.

**Para ativar o checkout:**

1. Painel MP → **Seu negócio → Cobranças → Link de pagamento**.
2. Crie um link para cada livro:
   - Preço: R$ 37 (ou o do livro)
   - Métodos: marcar **Pix + Cartão + Boleto**
   - URL de retorno: `https://suapropriatrilha.com/obrigado/` (criar página)
3. Cole a URL no campo `mp_link` do livro no JSON.
4. Roda `python3 scripts/build.py`.

O botão automaticamente vira "Comprar com Pix ou cartão →" e aponta pro MP.

### ⚠️ Entrega do PDF e anti-pirataria

Hoje os PDFs em `/ebooks/` são **publicamente acessíveis**. Qualquer pessoa
que descobrir a URL baixa de graça. Antes de cobrar de verdade:

- **Mínimo viável:** mover os PDFs para um Google Drive privado e enviar o
  link por email após o webhook do MP confirmar pagamento.
- **Robusto:** subir os PDFs em Cloudflare R2 ou S3 privado e gerar links
  assinados temporários (24h) via Cloudflare Worker / Netlify Function que
  escuta o webhook do MP.

O `robots.txt` bloqueia indexação do `/ebooks/`, mas isso não impede acesso
direto se a URL vaza.

## Otimizações já aplicadas

- **`index.html`: 2530KB → 82KB** (extração das 8 imagens em base64)
- **Pasta `/assets/`: 28.6MB → 9.3MB** (recompressão + PNG→JPG nas capas)
- **Companion WebP** para todas as imagens (via `<picture>`)
- **Fontes Google reduzidas** de 11 pesos para 5
- **`loading="lazy"`** em imagens abaixo do fold
- **`fetchpriority="high"`** na capa do produto (melhora LCP)
- **Headers de cache** configurados em `_headers`

## Como publicar

### Netlify Drop
https://app.netlify.com/drop → arrasta a pasta → conecta domínio.

### Cloudflare Pages
Dash → Workers & Pages → Create → Pages → Direct Upload.

### Vercel
```bash
npm i -g vercel && vercel --prod
```

### GitHub Pages
Push do repo → Settings → Pages → Source `main` / root.

## Checklist de produção (próximos passos)

- [ ] Criar 13 Links de Pagamento no Mercado Pago e preencher `mp_link`
- [ ] Criar página `/obrigado/` (pós-compra)
- [ ] Decidir estratégia de entrega + anti-pirataria dos PDFs
- [ ] Trocar Tailwind CDN por Tailwind CLI standalone (build local; -3MB de JS)
- [ ] Self-hostar fontes Google (privacidade + perf)
- [ ] JSON-LD `Product` em cada página de livro (rich results no Google)
- [ ] Analytics privacy-friendly (Plausible / Umami)
- [ ] `og:image` individualizada por livro (gerar OGs com capa + título)
- [ ] Email transacional via Resend / Mailgun na confirmação de pagamento

## Stack

- HTML estático + Tailwind v3 (via CDN)
- CSS customizado (`/assets/styles.css`) com variáveis CSS (oklch)
- Fontes: **Fraunces** (display), **Manrope** (sans), **Caveat** (script)
- Build: **Python + Jinja2**
