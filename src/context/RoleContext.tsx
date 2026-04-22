import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'pasajero' | 'conductor' | 'admin';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userName: string;
  setUserName: (name: string) => void;
}

const RoleContext = createContext<RoleContextType>({
  role: 'pasajero',
  setRole: () => {},
  userName: 'Carlos Rivadeneira',
  setUserName: () => {},
});

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('pasajero');
  const [userName, setUserName] = useState('Carlos Rivadeneira');

  return (
    <RoleContext.Provider value={{ role, setRole, userName, setUserName }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
