import { verifyToken, getTokenFromCookies } from "./auth.js";

export default async function handler(req, res) {
  // --- Security headers ---
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store");

  // --- Somente GET ---
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  // --- Autenticacao ---
  const token = getTokenFromCookies(req.headers.cookie);
  if (!verifyToken(token)) {
    return res.status(401).json({ error: "Nao autenticado" });
  }

  // --- Notion config ---
  const notionToken = process.env.NOTION_TOKEN;
  if (!notionToken) {
    return res.status(500).json({ error: "Servico indisponivel" });
  }

  const DB_PROJETOS = process.env.NOTION_DB_PROJETOS || "d7bf8c9e8b744dd794d7563870015aa1";
  const DB_CLIENTES = process.env.NOTION_DB_CLIENTES || "18a46efea81f477fb50810a5665c68b7";

  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  try {
    const [projRes, cliRes] = await Promise.all([
      fetch(`https://api.notion.com/v1/databases/${DB_PROJETOS}/query`, {
        method: "POST", headers, body: JSON.stringify({ page_size: 100 }),
      }),
      fetch(`https://api.notion.com/v1/databases/${DB_CLIENTES}/query`, {
        method: "POST", headers, body: JSON.stringify({ page_size: 100 }),
      }),
    ]);

    const [projData, cliData] = await Promise.all([projRes.json(), cliRes.json()]);

    const clients = (cliData.results || []).map((p) => ({
      id: p.id,
      url: `https://notion.so/${p.id.replace(/-/g, "")}`,
      name: p.properties["Nome do Cliente"]?.title?.[0]?.plain_text || "",
      status: p.properties["Status"]?.select?.name || null,
      segmento: p.properties["Segmento"]?.select?.name || null,
      pais: p.properties["País"]?.select?.name || null,
      potencial: p.properties["Potencial"]?.select?.name || null,
    }));

    const clientMap = {};
    clients.forEach((c) => { clientMap[c.id] = c.name; });

    const projects = (projData.results || []).map((p) => {
      const rel = p.properties["Cliente"]?.relation || [];
      const clientName = rel.length > 0 ? clientMap[rel[0].id] || null : null;
      return {
        url: `https://notion.so/${p.id.replace(/-/g, "")}`,
        name: p.properties["Projeto"]?.title?.[0]?.plain_text || "",
        status: p.properties["Status"]?.select?.name || null,
        prioridade: p.properties["Prioridade"]?.select?.name || null,
        responsavel: p.properties["Responsável"]?.select?.name || null,
        tipo: p.properties["Tipo"]?.select?.name || null,
        prazo: p.properties["Prazo"]?.date?.start || null,
        percentual: p.properties["% Concluído"]?.number || 0,
        cliente: clientName,
      };
    });

    res.json({ projects, clients, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("Notion API error:", e);
    res.status(500).json({ error: "Erro ao consultar dados" });
  }
}
