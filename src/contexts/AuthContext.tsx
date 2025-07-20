import React, { createContext, useContext, useEffect, useState } from 'react';
import p2pClientServiceV2 from '../services/p2pClientServiceV2';

interface User {
  uid: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-sign in with generated device ID
    const autoSignIn = async () => {
      // Check for saved user/auth or generate new
      let savedUserId = localStorage.getItem('currentUserId');
      const savedAuthKey = localStorage.getItem('authKey') || import.meta.env.VITE_AUTH_KEY;
      
      if (!savedUserId) {
        savedUserId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('currentUserId', savedUserId);
      }
      
      if (savedAuthKey) {
        localStorage.setItem('authKey', savedAuthKey);
      }
      
      const user = { uid: savedUserId };
      setUser(user);
      
      // Initialize P2P service
      try {
        console.log('🌐 Auto-connecting to P2P network...');
        await p2pClientServiceV2.initialize(savedUserId, savedAuthKey || undefined);
        console.log('✅ Connected to P2P network');
      } catch (error: any) {
        console.error('❌ Failed to connect to P2P network:', error);
      }
      
      setLoading(false);
    };
    
    autoSignIn();
  }, []);


  const value = {
    user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 