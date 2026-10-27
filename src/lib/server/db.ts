import "server-only";
import { neon } from "@neondatabase/serverless";
import type { Pool } from "pg";

/**
 * One small SQL helper for the whole app.
 *
 * Production: Neon's HTTP driver (DATABASE_URL set by the Vercel Neon
 * integration). Local tests: a plain Postgres connection via `pg` when the
 * URL points at localhost or DB_DRIVER=pg.
 *
 * Usage: `await sql<Row>\`select * from t where id = ${id}\``. Every value is
 * sent as a bound parameter, never spliced into the SQL text.
 */
const URL_ = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
export const dbConfigured = () => !!URL_;

type Row = Record<string, unknown>;
type Runner = (text: string, params: unknown[]) => Promise<Row[]>;

const usePg =
  process.env.DB_DRIVER === "pg" || /@(localhost|127\.0\.0\.1)[:/]/.test(URL_);

let runner: Runner | null = null;
function getRunner(): Runner {
  if (runner) return runner;
  if (!URL_) throw new Error("DATABASE_URL is not set");
  if (usePg) {
    // One pool per process, shared by every route bundle (Next loads this module more than once).
    const g = globalThis as unknown as { __bbaPool?: Promise<Pool> };
    runner = async (text, params) => {
      g.__bbaPool ??= import("pg").then(
        ({ Pool: PgPool }) =>
          new PgPool({
            connectionString: URL_,
            max: Number(process.env.DB_POOL_MAX ?? 1),
          }),
      );
      const r = await (await g.__bbaPool).query(text, params as unknown[]);
      return r.rows as Row[];
    };
  } else {
    const n = neon(URL_);
    runner = async (text, params) =>
      (await n(text, params as never[])) as Row[];
  }
  return runner;
}

/** Tagged template → parameterised query. */
export function sql<T = Row>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  let text = strings[0];
  for (let i = 1; i < strings.length; i++) text += `$${i}${strings[i]}`;
  return getRunner()(text, values) as Promise<T[]>;
}

/** Plain parameterised query (for the few places that build SQL dynamically from fixed pieces). */
export function query<T = Row>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  return getRunner()(text, params) as Promise<T[]>;
}
