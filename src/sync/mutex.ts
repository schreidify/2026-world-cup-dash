const LOCK_ID = 1;
const DEFAULT_STALE_MS = 5 * 60 * 1000;

export async function tryAcquireSyncLock(db: D1Database, staleMs = DEFAULT_STALE_MS): Promise<boolean> {
  const now = new Date();
  const lockedAt = now.toISOString();
  const staleBefore = new Date(now.getTime() - staleMs).toISOString();
  const result = await db
    .prepare(`UPDATE sync_lock SET locked_at = ?1 WHERE id = ?2 AND (locked_at IS NULL OR locked_at < ?3)`)
    .bind(lockedAt, LOCK_ID, staleBefore)
    .run();
  return result.meta.changes === 1;
}

export async function releaseSyncLock(db: D1Database): Promise<void> {
  await db.prepare(`UPDATE sync_lock SET locked_at = NULL WHERE id = ?1`).bind(LOCK_ID).run();
}
