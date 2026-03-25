import { createContext, ReactNode, useContext, useState } from 'react';

type AuthContextType = {
  email: string;
  setEmail: (email: string) => void;
};

const AuthContext = createContext<AuthContextType>({ email: '', setEmail: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState('');
  return (
    <AuthContext.Provider value={{ email, setEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}