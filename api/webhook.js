// Webhook do Mercado Pago — registra compras aprovadas no Supabase.
//
// Como funciona:
//   1. Quando um pagamento muda de status, o Mercado Pago chama esta URL (/api/webhook).
//   2. NÃO confiamos no que o Mercado Pago manda: buscamos o pagamento direto na API
//      deles (com o Access Token) pra ter a fonte da verdade.
//   3. Se o pagamento estiver "approved", gravamos a compra na tabela `compras`
//      do Supabase (e-mail do comprador + livro + id do pagamento).
//
// Variáveis de ambiente necessárias na Vercel:
//   MP_ACCESS_TOKEN            (já configurada)
//   SUPABASE_URL               ex.: https://zrfpkavzhjxqdbfndlkr.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  chave secreta "service_role" do Supabase

module.exports = async (req, res) => {
  // Sempre responde 200 rápido pro Mercado Pago não ficar reenviando.
  const ok = () => {
    res.statusCode = 200;
    res.end("ok");
  };

  try {
    // O Mercado Pago manda o id do pagamento via query (?data.id=) ou no corpo.
    let paymentId =
      (req.query && (req.query["data.id"] || req.query.id)) || null;

    if (!paymentId && req.body) {
      const body =
        typeof req.body === "string" ? safeParse(req.body) : req.body;
      paymentId = body?.data?.id || body?.id || null;
      // Só nos interessa evento de pagamento.
      const type = (req.query && req.query.type) || body?.type || body?.topic;
      if (type && String(type).indexOf("payment") === -1) return ok();
    }

    if (!paymentId) return ok();

    const token = process.env.MP_ACCESS_TOKEN;
    const supaUrl = process.env.SUPABASE_URL;
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!token || !supaUrl || !supaKey) {
      console.error("Webhook: faltam variáveis de ambiente.");
      return ok();
    }

    // Busca o pagamento real na API do Mercado Pago.
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!mpRes.ok) {
      console.error("Webhook: não consegui buscar o pagamento", mpRes.status);
      return ok();
    }
    const pay = await mpRes.json();

    if (pay.status !== "approved") {
      // Ainda não aprovado (ex.: Pix pendente) — não grava nada por enquanto.
      return ok();
    }

    const email = (pay.payer && pay.payer.email) || "";
    const livroSlug = pay.external_reference || "";
    if (!email || !livroSlug) return ok();

    // Grava a compra no Supabase (upsert por payment_id pra não duplicar).
    const row = {
      email: email,
      livro_slug: livroSlug,
      payment_id: String(pay.id),
      status: "approved",
      valor: pay.transaction_amount || null,
      metodo: pay.payment_type_id || null,
    };

    const supaRes = await fetch(
      `${supaUrl}/rest/v1/compras?on_conflict=payment_id`,
      {
        method: "POST",
        headers: {
          apikey: supaKey,
          Authorization: `Bearer ${supaKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(row),
      }
    );

    if (!supaRes.ok) {
      const t = await supaRes.text();
      console.error("Webhook: erro ao gravar no Supabase", supaRes.status, t);
    }

    return ok();
  } catch (err) {
    console.error("Webhook: falha geral", err);
    return ok();
  }
};

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
