'use client';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
  AcceptedChallenge,
  Challenge,
  fetchAcceptedChallenges,
  fetchCompletedChallenges,
  generateChallenges,
  getTrainingInsights,
  updateChallengeStatus,
} from '@/services/challengeService';
import { push, ref, set } from 'firebase/database';
import { CheckCircle, ChevronDown, ChevronUp, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const DIFFICULTY_COLOR = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [accepted, setAccepted] = useState<AcceptedChallenge[]>([]);
  const [insight, setInsight] = useState('');
  const [generating, setGenerating] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'accepted' | 'completed'>('new');
  const [completed, setCompleted] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    fetchAcceptedChallenges(user.uid).then(setAccepted);
    fetchCompletedChallenges(user.uid).then(setCompleted);
    handleInsight();
    handleGenerate();
  }, [user?.uid]);

  const handleGenerate = async () => {
    if (!user?.uid) return;
    setGenerating(true);
    const result = await generateChallenges(user.uid, 3);
    setChallenges(result);
    setGenerating(false);
  };

  const handleInsight = async () => {
    if (!user?.uid) return;
    setInsightLoading(true);
    const result = await getTrainingInsights(user.uid);
    setInsight(result);
    setInsightLoading(false);
  };

  const acceptChallenge = async (challenge: Challenge) => {
    if (!user?.uid) return;
    const r = push(ref(db, `users/${user.uid}/challenges`));
    const payload = { ...challenge, acceptedAt: new Date().toISOString(), status: 'accepted' };
    await set(r, payload);
    const updated = await fetchAcceptedChallenges(user.uid);
    setAccepted(updated);
  };

  const completeChallenge = async (challengeId: string) => {
    if (!user?.uid) return;
    await updateChallengeStatus(user.uid, challengeId, 'completed');
    const [updatedAccepted, updatedCompleted] = await Promise.all([
      fetchAcceptedChallenges(user.uid),
      fetchCompletedChallenges(user.uid),
    ]);
    setAccepted(updatedAccepted);
    setCompleted(updatedCompleted);
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Please sign in to view challenges.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Training Challenges</h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered challenges based on your training history</p>
      </div>

      {/* Insight card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 mb-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} />
          <span className="text-sm font-semibold uppercase tracking-wide">Training Insight</span>
        </div>
        {insightLoading ? (
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            <Loader2 size={14} className="animate-spin" /> Analyzing your training…
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-blue-50">{insight}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border border-gray-100 rounded-xl p-1 bg-white mb-5 shadow-sm">
        {(['new', 'accepted', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              activeTab === tab ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {tab === 'accepted' && accepted.length > 0 && (
              <span className="ml-1 text-xs bg-white/30 rounded-full px-1.5">{accepted.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'new' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">Generated Challenges</h2>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline disabled:opacity-50"
            >
              <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Generating…' : 'Regenerate'}
            </button>
          </div>

          {generating ? (
            <div className="flex flex-col items-center py-16 text-gray-400 gap-3">
              <Loader2 size={32} className="animate-spin text-blue-400" />
              <p className="text-sm">Analyzing your training history…</p>
            </div>
          ) : (
            <div className="space-y-4">
              {challenges.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{c.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${DIFFICULTY_COLOR[c.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                      {c.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{c.description}</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1">
                      {c.focusAreas?.map((a) => (
                        <span key={a} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{a}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{c.estimatedDuration}</span>
                      <button
                        onClick={() => acceptChallenge(c)}
                        className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'accepted' && (
        <div className="space-y-4">
          {accepted.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No active challenges. Accept some to get started!</div>
          ) : (
            accepted.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLOR[c.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                    {c.difficulty}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{c.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{c.estimatedDuration}</span>
                  <button
                    onClick={() => completeChallenge(c.id)}
                    className="flex items-center gap-1.5 bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-green-600"
                  >
                    <CheckCircle size={13} /> Mark Complete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completed.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No completed challenges yet. Keep going!</div>
          ) : (
            completed.map((c) => (
              <div key={c.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 opacity-75">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} className="text-green-500" />
                  <h3 className="font-semibold text-gray-700">{c.title}</h3>
                </div>
                <p className="text-sm text-gray-500">{c.description}</p>
                {c.completedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Completed {new Date(c.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
