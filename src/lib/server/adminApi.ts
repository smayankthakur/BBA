import "server-only";
import { getAdmin, roleAtLeast, type AdminUser, type Role } from "./auth";

/** Same-origin check for admin API calls (server actions get this from Next itself). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function apiAdmin(req: Request, min: Role = "editor", needOrigin = true): Promise<AdminUser | Response> {
  if (needOrigin && !sameOrigin(req)) return Response.json({ error: "Bad origin" }, { status: 403 });
  const user = await getAdmin();
  if (!user) return Response.json({ error: "Please sign in again." }, { status: 401 });
  if (!roleAtLeast(user.role, min)) return Response.json({ error: "Not allowed." }, { status: 403 });
  return user;
}
