import React, { createContext, useContext, useState, useEffect } from 'react';
import { initOneSignal, loginOneSignal, logoutOneSignal } from '../lib/onesignal';

export type UserRole = 'pasajero' | 'conductor' | 'admin';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userName: string;
  setUserName: (name: string) => void;
  /** Vincula el dispositivo con el usuario de Supabase en OneSignal */
  setSupabaseUserId: (uid: string | null) => void;
}

const RoleContext = createContext<RoleContextType>({
  role: 'pasajero',
  setRole: () => {},
  userName: 'Carlos Rivadeneira',
  setUserName: () => {},
  setSupabaseUserId: () => {},
});

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('pasajero');
  const [userName, setUserName] = useState('Carlos Rivadeneira');

  // Inicializar OneSignal una sola vez al montar la app
  useEffect(() => {
    initOneSignal();
  }, []);

  /**
   * Cuando el usuario inicia sesión con Google OAuth y tenemos su UUID,
   * vinculamos el dispositivo en OneSignal.
   * Si se pasa null, desvinculamos (logout).
   */
  const setSupabaseUserId = (uid: string | null) => {
    if (uid) {
      loginOneSignal(uid);
    } else {
      logoutOneSignal();
    }
  };

  return (
    <RoleContext.Provider value={{ role, setRole, userName, setUserName, setSupabaseUserId }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
