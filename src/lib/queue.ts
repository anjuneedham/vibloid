import { getPool } from "./db";

export type Job = {
  id: string; type: string; payload: any; state: string; attempts: number; max_attempts: number;
};

export async function enqueue(type: string, payload: unknown = {}, opts: { idempotencyKey?: string; runAfter?: Date; maxAttempts?: number } = {}) {
  const r = await getPool().query(
    `insert into jobs (type, payload, idempotency_key, run_after, max_attempts)
     values ($1,$2,$3,coalesce($4, now()),$5)
     on conflict (idempotency_key) do update set idempotency_key = excluded.idempotency_key
     returning id`,
    [type, JSON.stringify(payload), opts.idempotencyKey ?? null, opts.runAfter ?? null, opts.maxAttempts ?? 3],
  );
  return r.rows[0].id as string;
}

/** Atomically claim one due job. Safe under concurrent workers. */
export async function claimJob(workerId: string, types?: string[]): Promise<Job | null> {
  const r = await getPool().query(
    `update jobs set state='running', locked_by=$1, locked_at=now(), attempts=attempts+1
     where id = (
       select id from jobs
       where state='queued' and run_after <= now() and ($2::text[] is null or type = any($2))
       order by run_after, created_at
       for update skip locked limit 1)
     returning id, type, payload, state, attempts, max_attempts`,
    [workerId, types ?? null],
  );
  return (r.rows[0] as Job) ?? null;
}

export async function completeJob(id: string, result: unknown = {}) {
  await getPool().query(`update jobs set state='done', result=$2, finished_at=now(), locked_by=null where id=$1`, [id, JSON.stringify(result)]);
}

/** Retry with exponential backoff; dead-letter after max_attempts. */
export async function failJob(job: Job, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  const dead = job.attempts >= job.max_attempts;
  const backoffS = Math.min(3600, 2 ** job.attempts * 5);
  await getPool().query(
    `update jobs set state = $2, error=$3, locked_by=null,
       run_after = now() + make_interval(secs => $4),
       finished_at = case when $2='dead' then now() else null end
     where id=$1`,
    [job.id, dead ? "dead" : "queued", msg, backoffS],
  );
}

/** Re-queue jobs whose worker died mid-run. */
export async function reapStale(olderThanMinutes = 15) {
  const r = await getPool().query(
    `update jobs set state='queued', locked_by=null where state='running' and locked_at < now() - make_interval(mins => $1)`,
    [olderThanMinutes],
  );
  return r.rowCount ?? 0;
}

export async function logCost(c: { jobId?: string; projectId?: string; provider: string; unit: string; quantity: number; costUsd: number }) {
  await getPool().query(
    `insert into job_costs (job_id, project_id, provider, unit, quantity, cost_usd) values ($1,$2,$3,$4,$5,$6)`,
    [c.jobId ?? null, c.projectId ?? null, c.provider, c.unit, c.quantity, c.costUsd],
  );
}

export type Handler = (job: Job) => Promise<unknown>;

/** Process jobs until the queue has nothing due. Returns count processed. */
export async function drain(workerId: string, handlers: Record<string, Handler>) {
  let n = 0;
  for (;;) {
    const job = await claimJob(workerId, Object.keys(handlers));
    if (!job) return n;
    try {
      const result = await handlers[job.type](job);
      await completeJob(job.id, result);
      n++;
    } catch (e) {
      await failJob(job, e);
    }
  }
}
