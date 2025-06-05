import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { trpc } from '../utils/trpc';

// Define the context type
type UserContextType = {
  guestId: string | null;
  isLoading: boolean;
};

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create a provider component
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get stored ID on mount
  const storedId = typeof window !== 'undefined' ? localStorage.getItem("guestId") : null;
  
  // Only query if we have a stored ID
  const { data: dbCheckResult, isLoading: dbCheckResultIsLoading } = trpc.checkGuestId.useQuery(
    { guestId: storedId! },
    { 
      enabled: !!storedId, // Only run query if storedId exists
      refetchOnWindowFocus: false, // Prevent refetch on tab focus
      refetchOnMount: false, // Prevent refetch on component remount
      staleTime: Infinity, // Keep data fresh forever
    }
  );

  const insertUser = trpc.insertUser.useMutation({
    onSuccess: () => {
      console.log('inserted user')
    },
    onError: (e) => {
      console.log('error', e)
    } 
  })

  useEffect(() => {
    const initializeGuestId = async () => {
      if (storedId) {
        console.log('Using stored guestId:', storedId);
        
        // Wait for DB check if we have a stored ID
        if (dbCheckResult !== undefined && !dbCheckResultIsLoading) {
          if (dbCheckResult) {
            setGuestId(storedId);
          } else {
            // Create new ID if stored one doesn't exist in DB
            const newId = uuidv4();
            localStorage.setItem("guestId", newId);
            setGuestId(newId);
            // mutation
            insertUser.mutate({guestId: storedId, username: ""}) // default empty username
          }
          setIsLoading(false);
        }
      } else {
        // No stored ID, create new one
        const newId = uuidv4();
        localStorage.setItem("guestId", newId);
        setGuestId(newId);
        setIsLoading(false);
        
        insertUser.mutate({guestId: newId, username: ""}) // default empty username
      }
    };

    initializeGuestId();
  }, [storedId, dbCheckResult]);

  return (
    <UserContext.Provider value={{ guestId, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

// Create a custom hook for using the context
export const useGuestId = (): { guestId: string | null; isLoading: boolean } => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useGuestId must be used within a UserProvider');
  }
  return context;
};