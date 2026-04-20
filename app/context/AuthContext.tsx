import { createContext, useContext, useState } from 'react';

type AuthContextType = {
  email: string;
  setEmail: (email: string) => void;
  voice: string;
  setVoice: (voice: string) => void;
};

const AuthContext = createContext<AuthContextType>({
  email: '',
  setEmail: () => {},
  voice: 'Joanna',
  setVoice: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState('');
  const [voice, setVoice] = useState('Joanna');

  return (
    <AuthContext.Provider value={{ email, setEmail, voice, setVoice }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}