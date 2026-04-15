import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET;
const PASSWORD = process.env.DASHBOARD_PASSWORD;
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export function signToken() {
  const ts = Date.now().toString();
  const sig = crypto.createHmac("sha256", SECRET).update(ts).digest("hex");
  return `${ts}.${sig}`;
}

export function verifyToken(token) {
  if (!token || !SECRET) return false;
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return false;

  const age = (Date.now() - Number(ts)) / 1000;
  if (age > TOKEN_MAX_AGE || age < 0) return false;

  const expected = crypto.createHmac("sha256", SECRET).update(ts).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function getTokenFromCookies(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)rilix_auth=([^;]+)/);
  return match ? match[1] : null;
}

export default async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  if (req.method === "GET") {
    const token = getTokenFromCookies(req.headers.cookie);
    const valid = verifyToken(token);
    return res.json({ authenticated: valid });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  if (!PASSWORD || !SECRET) {
    return res.status(500).json({ error: "Autenticacao nao configurada no servidor" });
  }

  const { password } = req.body || {};
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Senha obrigatoria" });
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(PASSWORD)
  );

  if (!valid) {
    return res.status(401).json({ error: "Senha incorreta" });
  }

  const token = signToken();
  res.setHeader(
    "Set-Cookie",
    `rilix_auth=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${TOKEN_MAX_AGE}`
  );
  return res.json({ authenticated: true });
}
