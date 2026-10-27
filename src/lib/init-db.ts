import { db } from "@/lib/db";
import { ensureDefaultAdmin } from "@/lib/auth";
import { isDatabaseEmpty, seedDatabase } from "@/lib/seed-db";

/**
 * Auto-initialise the database on first request after a fresh deploy.
 *
 * - If the DB is empty (no countries), runs the full seed + creates the
 *   default admin, so the app is immediately usable by real users with
 *   all demo channels/matches/tournaments visible.
 * - Idempotent and guarded by a process-wide flag so the (expensive) seed
 *   only runs once per server process.
 * - Failures are swallowed (logged) so they never break the user-facing
 *   request — the `/api/setup` endpoint can be used to retry manually.
 */

let initPromise: Promise<void> | null = null;
let initialised = false;

export async function ensureDatabaseReady(): Promise<void> {
  if (initialised) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await ensureDefaultAdmin();
        const empty = await isDatabaseEmpty();
        if (empty) {
          console.log("[init] Database empty — auto-seeding…");
          await seedDatabase();
          console.log("[init] Auto-seed complete.");
        }
        initialised = true;
      } catch (e) {
        // Don't cache the failure — let the next request retry.
        initPromise = null;
        console.error("[init] Auto-seed failed:", e);
      }
    })();
  }
  await initPromise;
}
