import { db } from '@/lib/firebase';
import { get, ref, update } from 'firebase/database';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focusAreas: string[];
  estimatedDuration: string;
  createdAt: string;
}

export interface AcceptedChallenge extends Challenge {
  acceptedAt: string;
  status: 'accepted' | 'in_progress' | 'completed';
  completedAt?: string;
}

export interface CompletedChallenge extends Challenge {
  acceptedAt: string;
  status: 'completed';
  completedAt: string;
}

interface SessionData {
  id: string;
  title: string;
  date: string;
  duration: string;
  notes: string;
  tags: string[];
  qualityLevel: string;
}

export const fetchUserSessions = async (userId: string): Promise<SessionData[]> => {
  const sessionsRef = ref(db, `users/${userId}/sessions`);
  const snapshot = await get(sessionsRef);
  if (!snapshot.exists()) return [];

  const raw = snapshot.val() as Record<string, any>;
  const sessions: SessionData[] = Object.entries(raw).map(([id, s]) => ({
    id,
    title: s.title || '',
    date: s.date || '',
    duration: s.duration || '0',
    notes: s.notes || '',
    tags: Array.isArray(s.tags) ? s.tags : Object.values(s.tags || {}),
    qualityLevel: s.qualityLevel || '0',
  }));

  sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return sessions;
};

const prepareSessionContext = (sessions: SessionData[], limit = 10): string => {
  const recent = sessions.slice(0, limit);
  const totalSessions = sessions.length;
  const avgQuality =
    sessions.reduce((sum, s) => sum + (parseFloat(s.qualityLevel) || 0), 0) / totalSessions;
  const totalHours = sessions.reduce((sum, s) => sum + (parseFloat(s.duration) || 0), 0);

  const tagFreq: Record<string, number> = {};
  sessions.forEach((s) => s.tags.forEach((t) => (tagFreq[t] = (tagFreq[t] || 0) + 1)));
  const topTags = Object.entries(tagFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  let ctx = `User Training Profile:
- Total sessions: ${totalSessions}
- Total training hours: ${totalHours.toFixed(1)}
- Average session quality: ${avgQuality.toFixed(1)}/10
- Most trained areas: ${topTags.map(([tag, count]) => `${tag} (${count})`).join(', ')}

Recent Sessions (last ${recent.length}):
`;
  recent.forEach((s, i) => {
    ctx += `\n${i + 1}. ${s.title} (${s.date})
   - Duration: ${s.duration}h
   - Quality: ${s.qualityLevel}/10
   - Tags: ${s.tags.join(', ')}
   - Notes: ${s.notes.substring(0, 150)}${s.notes.length > 150 ? '...' : ''}
`;
  });
  return ctx;
};

const getStarterChallenges = (): Challenge[] => [
  {
    id: `challenge-${Date.now()}-0`,
    title: 'Build Your Foundation',
    description:
      'Complete 3 training sessions this week focusing on fundamentals. Document your progress with detailed notes.',
    difficulty: 'beginner',
    focusAreas: ['Fundamentals', 'Consistency'],
    estimatedDuration: '1 week',
    createdAt: new Date().toISOString(),
  },
  {
    id: `challenge-${Date.now()}-1`,
    title: 'Quality Over Quantity',
    description:
      'Focus on one technique you want to improve. Practice it mindfully and rate your session quality 7 or higher.',
    difficulty: 'beginner',
    focusAreas: ['Technique', 'Mindfulness'],
    estimatedDuration: '1 session',
    createdAt: new Date().toISOString(),
  },
  {
    id: `challenge-${Date.now()}-2`,
    title: 'Explore & Experiment',
    description:
      "Try incorporating a new category you haven't focused on before. Tag it and reflect in your notes.",
    difficulty: 'intermediate',
    focusAreas: ['Exploration', 'Growth'],
    estimatedDuration: '2 sessions',
    createdAt: new Date().toISOString(),
  },
];

// These functions call Next.js API routes (keeps OpenAI key server-side)
export const generateChallenges = async (userId: string, count = 3): Promise<Challenge[]> => {
  try {
    const sessions = await fetchUserSessions(userId);
    if (sessions.length === 0) return getStarterChallenges();

    const context = prepareSessionContext(sessions);
    const res = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, count }),
    });

    if (!res.ok) return getStarterChallenges();

    const data = await res.json();
    return (data.challenges as any[]).map((c, i) => ({
      id: `challenge-${Date.now()}-${i}`,
      title: c.title,
      description: c.description,
      difficulty: c.difficulty,
      focusAreas: c.focusAreas || [],
      estimatedDuration: c.estimatedDuration,
      createdAt: new Date().toISOString(),
    }));
  } catch {
    return getStarterChallenges();
  }
};

export const getTrainingInsights = async (userId: string): Promise<string> => {
  try {
    const sessions = await fetchUserSessions(userId);
    if (sessions.length === 0) return 'Start logging your training sessions to get personalized insights!';

    const context = prepareSessionContext(sessions, 5);
    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });

    if (!res.ok) return 'Keep up the great work with your training!';
    const data = await res.json();
    return data.insight || 'Keep training hard!';
  } catch {
    return 'Your dedication to training is inspiring. Keep it up!';
  }
};

export const fetchAcceptedChallenges = async (userId: string): Promise<AcceptedChallenge[]> => {
  const snap = await get(ref(db, `users/${userId}/challenges`));
  if (!snap.exists()) return [];
  const raw = snap.val() as Record<string, any>;
  return Object.entries(raw)
    .filter(([, c]) => c.status !== 'completed')
    .map(([id, c]) => ({
      id,
      title: c.title || '',
      description: c.description || '',
      difficulty: c.difficulty || 'beginner',
      focusAreas: Array.isArray(c.focusAreas) ? c.focusAreas : Object.values(c.focusAreas || {}),
      estimatedDuration: c.estimatedDuration || '',
      createdAt: c.createdAt || '',
      acceptedAt: c.acceptedAt || '',
      status: c.status || 'accepted',
      completedAt: c.completedAt,
    }))
    .sort((a, b) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime());
};

export const fetchCompletedChallenges = async (userId: string): Promise<CompletedChallenge[]> => {
  const snap = await get(ref(db, `users/${userId}/challenges`));
  if (!snap.exists()) return [];
  const raw = snap.val() as Record<string, any>;
  return Object.entries(raw)
    .filter(([, c]) => c.status === 'completed')
    .map(([id, c]) => ({
      id,
      title: c.title || '',
      description: c.description || '',
      difficulty: c.difficulty || 'beginner',
      focusAreas: Array.isArray(c.focusAreas) ? c.focusAreas : Object.values(c.focusAreas || {}),
      estimatedDuration: c.estimatedDuration || '',
      createdAt: c.createdAt || '',
      acceptedAt: c.acceptedAt || '',
      status: 'completed' as const,
      completedAt: c.completedAt || new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
};

export const updateChallengeStatus = async (
  userId: string,
  challengeId: string,
  status: 'in_progress' | 'completed'
): Promise<void> => {
  const updates: any = { status };
  if (status === 'completed') updates.completedAt = new Date().toISOString();
  await update(ref(db, `users/${userId}/challenges/${challengeId}`), updates);
};
