// Função de checkout — Caminho B (chave única do Mercado Pago).
//
// Como funciona:
//   1. O botão "Comprar com Pix ou cartão" leva para /api/checkout?slug=<livro>
//   2. Esta função procura o preço e o título do livro em _books.json (gerado pelo build).
//   3. Cria uma "preferência" de pagamento no Mercado Pago usando o Access Token.
//   4. Redireciona o cliente para a tela de pagamento (Pix ou cartão parcelado).
//
// Configuração necessária (uma única vez, no painel da Vercel):
//   Settings > Environment Variables > adicionar:
//     Nome:  MP_ACCESS_TOKEN
//     Valor: o Access Token DE PRODUÇÃO da sua conta Mercado Pago
//
// Nenhuma alteração de código é necessária ao adicionar novos livros:
// basta rodar o build, que o _books.json é atualizado sozinho.

const BOOKS = require("./_books.json");

module.exports = async (req, res) => {
  const slug = (req.query && req.query.slug) || "";
  const book = BOOKS[slug];

  // Livro não encontrado -> volta para o catálogo.
  if (!book || !book.price) {
    res.statusCode = 302;
    res.setHeader("Location", "/livros/");
    return res.end();
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(
      "<h1>Pagamento ainda nao configurado</h1>" +
        "<p>Falta cadastrar a variavel MP_ACCESS_TOKEN nas configuracoes da Vercel.</p>"
    );
  }

  // Monta a URL base do site (funciona em producao e em preview da Vercel).
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const base = `${proto}://${host}`;

  const preference = {
    items: [
      {
        title: book.title,
        description: `E-book: ${book.title}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number(book.price),
      },
    ],
    external_reference: slug,
    statement_descriptor: "SUAPROPRIATRILHA",
    back_urls: {
      success: `${base}/obrigado/`,
      pending: `${base}/obrigado/`,
      failure: `${base}/livros/${slug}/`,
    },
    auto_return: "approved",
    // Avisa nosso webhook quando o pagamento muda de status (ex.: Pix aprovado).
    // Barra no final é necessária por causa do trailingSlash do site (evita o 308).
    notification_url: `${base}/api/webhook/`,
  };

  try {
    const mpRes = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preference),
      }
    );

    const data = await mpRes.json();

    if (!mpRes.ok || !data.init_point) {
      console.error("Erro Mercado Pago:", mpRes.status, data);
      res.statusCode = 502;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(
        "<h1>Nao foi possivel iniciar o pagamento</h1>" +
          "<p>Tente novamente em instantes. Se persistir, confira se o Access Token e de producao.</p>"
      );
    }

    // Redireciona o cliente direto para a tela de pagamento.
    res.statusCode = 302;
    res.setHeader("Location", data.init_point);
    return res.end();
  } catch (err) {
    console.error("Falha ao chamar o Mercado Pago:", err);
    res.statusCode = 502;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("<h1>Erro de conexao com o Mercado Pago</h1>");
  }
};
