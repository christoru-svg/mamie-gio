/* Frigo sans ouvrir : petit serveur entre l'appli et l'API Claude.
   Il garde la clé API secrète (variable ANTHROPIC_API_KEY du Worker)
   et n'accepte que les demandes venant de l'adresse de l'appli (variable ALLOWED_ORIGINS).

   L'appli envoie : POST { prompt: "...", image?: "<jpeg en base64>" }
   Le serveur répond : { text: "..." }  ou  { error: "code", message: "..." } */

const MODEL = "claude-opus-5-5";
const MAX_PROMPT = 20000;            // caractères
const MAX_IMAGE = 5 * 1024 * 1024;   // octets de base64 (~3,7 Mo d'image)

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": okOrigin ? origin : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { status: okOrigin ? 204 : 403, headers: cors });
    if (request.method !== "POST") return reply(405, { error: "method", message: "POST uniquement" });
    if (!okOrigin) return reply(403, { error: "origin", message: "Adresse de l'appli non autorisée" });
    if (!env.ANTHROPIC_API_KEY) return reply(500, { error: "config", message: "Clé API manquante sur le serveur" });

    let body;
    try { body = await request.json(); } catch { return reply(400, { error: "json", message: "Requête illisible" }); }
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const image = typeof body.image === "string" ? body.image : "";
    if (!prompt || prompt.length > MAX_PROMPT) return reply(400, { error: "prompt", message: "Demande vide ou trop longue" });
    if (image.length > MAX_IMAGE) return reply(413, { error: "image", message: "Photo trop lourde" });

    const content = [];
    if (image) content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } });
    content.push({ type: "text", text: prompt });

    let res;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "server-side-fallback-2026-07-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 16000,
          output_config: { effort: "medium" },
          fallbacks: "default",
          messages: [{ role: "user", content }],
        }),
      });
    } catch {
      return reply(502, { error: "upstream", message: "Claude ne répond pas, réessaie" });
    }

    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      const code = res.status === 429 ? "rate_limited" : res.status === 401 ? "config" : "upstream";
      return reply(res.status === 429 ? 429 : 502, { error: code, message: data?.error?.message || "Erreur de l'API Claude" });
    }
    if (data.stop_reason === "refusal") return reply(422, { error: "refused", message: "Claude a refusé cette demande" });

    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    if (!text.trim()) return reply(502, { error: "empty_completion", message: "Réponse vide" });
    return reply(200, { text, truncated: data.stop_reason === "max_tokens" });
  },
};
