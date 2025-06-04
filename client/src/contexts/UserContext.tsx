// UserContext.tsx - Simpler approach
import React, { createContext, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define the context type
type UserContextType = {
  guestId: string;
};

// Get or create guest ID (outside component to avoid re-creation)
const getGuestId = (): string => {
  const storedId = localStorage.getItem("guestId");
  
  if (storedId) {
    console.log('Using stored guestId:', storedId);
    return storedId;
  }
  
  const newId = uuidv4();
  localStorage.setItem("guestId", newId);
  console.log('Created new guestId:', newId);
  return newId;
};

// Create the guest ID once
const GUEST_ID = getGuestId();

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create a provider component
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <UserContext.Provider value={{ guestId: GUEST_ID }}>
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