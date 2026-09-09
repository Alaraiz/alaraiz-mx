const ARENA_API_BASE = "https://api.are.na/v3";
const DETENTE_CHANNEL = process.env.ARENA_DETENTE_CHANNEL || "revista-detente";

type ArenaContentResponse = {
  data?: ArenaBlock[];
  contents?: ArenaBlock[];
  blocks?: ArenaBlock[];
};

type ArenaBlock = {
  id?: number;
  type?: string;
  title?: string | null;
  content?: string | { plain?: string; markdown?: string } | null;
  description?: { plain?: string; markdown?: string } | string | null;
  source?: { url?: string | null } | string | null;
  image?: {
    display?: { url?: string | null };
    large?: { url?: string | null };
    original?: { url?: string | null };
    square?: { url?: string | null };
  } | null;
  attachment?: {
    file_name?: string | null;
    file_size?: number | null;
    file_url?: string | null;
    url?: string | null;
    content_type?: string | null;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DetenteIssue = {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  coverUrl: string;
  sourceUrl: string;
  updatedAt: string;
};

export async function getDetenteIssues(): Promise<{
  issues: DetenteIssue[];
  needsToken: boolean;
  error?: string;
}> {
  const token = process.env.ARENA_PAT;
  if (!token) return { issues: [], needsToken: true };

  try {
    const response = await fetch(
      `${ARENA_API_BASE}/channels/${encodeURIComponent(DETENTE_CHANNEL)}/contents?per=100&sort=position`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        next: { revalidate: 300 },
      }
    );

    if (response.status === 401) {
      return { issues: [], needsToken: true, error: "Are.na rechazó el token configurado." };
    }
    if (!response.ok) {
      return { issues: [], needsToken: false, error: "No pudimos cargar Détente desde Are.na." };
    }

    const data = (await response.json()) as ArenaContentResponse;
    const blocks = data.data || data.contents || data.blocks || [];
    const issues = blocks
      .map(toDetenteIssue)
      .filter((issue): issue is DetenteIssue => Boolean(issue?.pdfUrl));

    return { issues, needsToken: false };
  } catch (error) {
    console.error("[Are.na Détente]", error);
    return { issues: [], needsToken: false, error: "No pudimos conectar con Are.na." };
  }
}

function toDetenteIssue(block: ArenaBlock): DetenteIssue | null {
  const pdfUrl = firstUrl(
    block.attachment?.file_url,
    block.attachment?.url,
    typeof block.source === "string" ? block.source : block.source?.url
  );
  if (!pdfUrl || !isPdfLike(pdfUrl, block.attachment?.content_type)) return null;

  return {
    id: String(block.id || pdfUrl),
    title: cleanText(block.title) || cleanText(block.attachment?.file_name) || "Détente",
    description: cleanText(block.description) || cleanText(block.content) || "Publicación editorial de Raíz.",
    pdfUrl,
    coverUrl: firstUrl(block.image?.display?.url, block.image?.large?.url, block.image?.original?.url, block.image?.square?.url) || "",
    sourceUrl: typeof block.source === "string" ? block.source : block.source?.url || pdfUrl,
    updatedAt: block.updated_at || block.created_at || new Date().toISOString(),
  };
}

function firstUrl(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && /^https?:\/\//.test(value)) || "";
}

function isPdfLike(url: string, contentType?: string | null) {
  return /pdf/i.test(contentType || "") || /\.pdf($|\?)/i.test(url);
}

function cleanText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const item = value as { plain?: string; markdown?: string };
    return String(item.plain || item.markdown || "").trim();
  }
  return "";
}
