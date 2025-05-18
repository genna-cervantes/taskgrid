// UserContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define the context type
type UserContextType = {
  guestId: string;
};

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create a provider component
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [guestId] = useState<string>(() => {
    const storedId = localStorage.getItem("guestId");
    if (storedId) return storedId;
    
    const newId = uuidv4();
    localStorage.setItem("guestId", newId);
    return newId;
  });

  return (
    <UserContext.Provider value={{ guestId }}>
      {children}
    </UserContext.Provider>
  );
};

// Create a custom hook for using the context
export const useGuestId = (): string => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useGuestId must be used within a UserProvider');
  }
  return context.guestId;
};