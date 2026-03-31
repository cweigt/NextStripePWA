'use client';

import { auth } from '@/lib/firebase';
import { User, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isDev: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isDev: false});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser){
        //checks for the dev "stamp"
        const tokenResult = await getIdTokenResult(firebaseUser);
        setUser(firebaseUser);
        //strictly true or false claim
        setIsDev(!!tokenResult.claims.developer);
      } else {
        setUser(null);
        setIsDev(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isDev }}>
      {children}
    </AuthContext.Provider>
  );
};
