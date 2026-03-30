'use client';

import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Mode = 'signin' | 'signup' | 'reset';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
        //if email isn't verified and user clicks sign in
        if(!auth.currentUser?.emailVerified) {
          setError("Email not verified, please verify to sign in!");
          await auth.signOut(); //sign out so they can't get to other pages
          return; 
        }
        router.push('/');
      } else if (mode === 'signup') { //for creating the account if sign in fails
        const pw = password;
        if (pw.length < 10) { setError('Password must be at least 10 characters.'); return; }
        if (!/[A-Z]/.test(pw)) { setError('Password must contain an uppercase letter.'); return; }
        if (!/[a-z]/.test(pw)) { setError('Password must contain a lowercase letter.'); return; }
        if (!/[0-9]/.test(pw)) { setError('Password must contain a number.'); return; }
        if (!/[^A-Za-z0-9]/.test(pw)) { setError('Password must contain a special character.'); return; }

        const cred = await createUserWithEmailAndPassword(auth, email, pw);
        if (displayName) await updateProfile(cred.user, { displayName });
        await sendEmailVerification(cred.user);
        setMessage('Verification email sent. Please verify, and then sign in.');
        setMode('signin'); //kicks it back to sign in page
      } else {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">NextStripe</h1>
          <p className="text-sm text-gray-500 mt-1">BJJ Training Tracker</p>
        </div>

        {/* Tabs */}
        <div className="flex border border-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'signin' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'signup' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {mode === 'signup' && (
                <p className="text-xs text-gray-400 mt-1">
                  10+ chars, uppercase, lowercase, number, special character
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
          </button>
        </form>

        {mode !== 'reset' && (
          <button
            onClick={() => setMode('reset')}
            className="mt-4 w-full text-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            Forgot password?
          </button>
        )}
        {mode === 'reset' && (
          <button
            onClick={() => setMode('signin')}
            className="mt-4 w-full text-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            ← Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
