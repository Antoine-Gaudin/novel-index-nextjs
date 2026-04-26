// Upload d'une couverture pour une œuvre, depuis la page de l'œuvre.
// Accès réservé à l'admin (vérifié via JWT cookie + /users/me).
// POST multipart/form-data : { file: File, documentId: string }

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const TOKEN = process.env.STRAPI_ADMIN_TOKEN;

async function getCallerUser(req) {
  // 1) header Authorization
  const auth = req.headers.get("authorization");
  let jwt = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  // 2) sinon cookie jwt
  if (!jwt) {
    const cookie = req.headers.get("cookie") || "";
    const m = cookie.match(/(?:^|;\s*)jwt=([^;]+)/);
    if (m) jwt = decodeURIComponent(m[1]);
  }
  if (!jwt) return null;
  const res = await fetch(`${STRAPI}/api/users/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function POST(req) {
  try {
    if (!TOKEN) {
      return Response.json(
        { error: "STRAPI_ADMIN_TOKEN manquant" },
        { status: 500 },
      );
    }
    const me = await getCallerUser(req);
    if (!me?.admin) {
      return Response.json({ error: "Non autorisé" }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const documentId = form.get("documentId");
    if (!file || typeof file === "string") {
      return Response.json({ error: "Fichier manquant" }, { status: 400 });
    }
    if (!documentId) {
      return Response.json({ error: "documentId manquant" }, { status: 400 });
    }

    // Upload vers Strapi
    const upForm = new FormData();
    upForm.append("files", file, file.name || "cover");
    const upRes = await fetch(`${STRAPI}/api/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: upForm,
    });
    if (!upRes.ok) {
      const txt = await upRes.text();
      return Response.json(
        { error: `Upload échoué (${upRes.status}): ${txt.slice(0, 300)}` },
        { status: 500 },
      );
    }
    const uploaded = await upRes.json();
    const media = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    if (!media?.id) {
      return Response.json(
        { error: "Réponse upload invalide" },
        { status: 500 },
      );
    }

    // Lier la couverture à l'œuvre
    const putRes = await fetch(`${STRAPI}/api/oeuvres/${documentId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: { couverture: media.id } }),
    });
    if (!putRes.ok) {
      const txt = await putRes.text();
      return Response.json(
        { error: `Liaison échouée (${putRes.status}): ${txt.slice(0, 300)}` },
        { status: 500 },
      );
    }

    return Response.json({
      ok: true,
      mediaId: media.id,
      url: media.url,
      name: media.name,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
