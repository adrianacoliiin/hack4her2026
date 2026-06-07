import React, { createContext, useState, useContext } from 'react';

export type UserProfile = {
  name:         string;
  email:        string;
  persona_type: 'eficiencia' | 'asistido' | 'familiar';
  customer_id:  number;
  role:         string;
};

type AuthContextType = {
  user:   UserProfile | null;
  login:  (userData: UserProfile) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user:   null,
  login:  () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  const login  = (userData: UserProfile) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
