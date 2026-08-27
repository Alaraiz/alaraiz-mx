import { db } from "@/lib/db";
import type { TokenPayload } from "@/lib/auth";

type EditorProfile = {
  facilitatorId: string | null;
  name: string;
  email: string;
};

function normalize(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function getEditorProfile(user: TokenPayload): Promise<EditorProfile> {
  const result = await db.execute({
    sql: "SELECT email, name, facilitator_id FROM users WHERE id = ?",
    args: [user.sub],
  });
  const row = result.rows[0];
  const name = String(row?.name || "");
  const email = String(row?.email || user.email || "");
  const assignedId = row?.facilitator_id ? String(row.facilitator_id) : "";

  if (assignedId) {
    return { facilitatorId: assignedId, name, email };
  }

  if (name) {
    const facilitators = await db.execute("SELECT id, name FROM facilitators");
    const match = facilitators.rows.find((facilitator) => normalize(facilitator.name) === normalize(name));
    if (match?.id) {
      return { facilitatorId: String(match.id), name, email };
    }
  }

  return { facilitatorId: null, name, email };
}

export async function userCanManageExperience(user: TokenPayload, experienceId: string): Promise<boolean> {
  if (user.role === "admin") return true;
  const profile = await getEditorProfile(user);
  if (!profile.facilitatorId) return false;

  const result = await db.execute({
    sql: "SELECT id FROM experiences WHERE id = ? AND facilitator_id = ?",
    args: [experienceId, profile.facilitatorId],
  });
  return result.rows.length > 0;
}
