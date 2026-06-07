import React, { createContext, useState, useContext } from 'react';

// Creamos el contexto
const AuthContext = createContext<any>(null);

// Proveedor del contexto que envolverá la app
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  // Esta es la función que tu login.tsx llama al hacer: const { login: setUserContext } = useAuth();
  const login = (userData: any) => {
    setUser(userData);
  };

  // Función para cerrar sesión (la usarás más adelante)
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => useContext(AuthContext);