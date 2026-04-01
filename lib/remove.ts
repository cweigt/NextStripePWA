import { db } from '@/lib/firebase';
import { get, ref, remove, set } from 'firebase/database';

/** Must match the keys used in `lib/populate.ts` for example rows. */
const SEED = {
  sessions: ['example-session-1', 'example-session-2'],
  injuries: ['example-injury-1', 'example-injury-2'],
  videos: ['example-video-1', 'example-video-2'],
  schedule: [
    { day: '2026-03-25', id: 'example-event-1' },
    { day: '2026-04-01', id: 'example-event-1-w2' },
    { day: '2026-04-08', id: 'example-event-1-w3' },
    { day: '2026-04-15', id: 'example-event-1-w4' },
    { day: '2026-03-28', id: 'example-event-2' },
  ],
} as const;

function parseSessionDate(d: string): number {
  if (!d) return 0;
  if (d.includes('/')) {
    const [m, day, y] = d.split('/').map(Number);
    return new Date(y, m - 1, day).getTime();
  }
  return new Date(d).getTime();
}

async function recomputeTrainingAggregates(userId: string) {
  const snap = await get(ref(db, `users/${userId}/sessions`));
  if (!snap.exists()) {
    await remove(ref(db, `users/${userId}/sessionCount`));
    await remove(ref(db, `users/${userId}/records`));
    await remove(ref(db, `users/${userId}/mostRecentDate`));
    return;
  }
  const raw = snap.val() as Record<string, any>;
  const sessions = Object.entries(raw).map(([id, s]) => ({ id, ...s }));
  const sorted = [...sessions].sort((a, b) => parseSessionDate(b.date) - parseSessionDate(a.date));
  const maxHrs = sorted.reduce((m, s) => Math.max(m, parseFloat(s.duration) || 0), 0);
  const mostRecent = sorted[0]?.date ?? 'NA';
  await set(ref(db, `users/${userId}/sessionCount`), sorted.length);
  await set(ref(db, `users/${userId}/records`), { maxHours: maxHrs });
  await set(ref(db, `users/${userId}/mostRecentDate`), { lastTrained: mostRecent });
}

export default async function removeDataLogic(userId: string) {
  for (const id of SEED.sessions) {
    await remove(ref(db, `users/${userId}/sessions/${id}`));
  }
  for (const id of SEED.injuries) {
    await remove(ref(db, `users/${userId}/injuries/${id}`));
  }
  for (const id of SEED.videos) {
    await remove(ref(db, `users/${userId}/library/videos/${id}`));
  }
  for (const { day, id } of SEED.schedule) {
    await remove(ref(db, `users/${userId}/schedule/${day}/${id}`));
  }

  await set(ref(db, `users/${userId}/comp/wins`), 0);
  await set(ref(db, `users/${userId}/comp/losses`), 0);
  await set(ref(db, `users/${userId}/comp/submissionWins`), 0);
  await set(ref(db, `users/${userId}/comp/pointsWins`), 0);
  await set(ref(db, `users/${userId}/comp/submissionLosses`), 0);
  await set(ref(db, `users/${userId}/comp/pointsLosses`), 0);

  await recomputeTrainingAggregates(userId);
}
