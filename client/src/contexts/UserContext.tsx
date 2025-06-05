import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { trpc } from "../utils/trpc";

type UserContextType = {
  guestId: string | null;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storedId =
    typeof window !== "undefined" ? localStorage.getItem("guestId") : null;

  const { data: dbCheckResult, isLoading: dbLoading } =
    trpc.checkGuestId.useQuery(
      { guestId: storedId! },
      {
        enabled: !!storedId,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        staleTime: Infinity,
      }
    );

  const insertUser = trpc.insertUser.useMutation({
    onSuccess: () => {
      console.log("Inserted user");
    },
    onError: (e) => {
      console.error("Insert user error", e);
    },
  });

  useEffect(() => {
    // Case 1: No stored guestId, create a new one
    if (!storedId) {
      const newId = uuidv4();
      localStorage.setItem("guestId", newId);
      setGuestId(newId);
      insertUser.mutate({ guestId: newId, username: "" });
      setIsLoading(false);
      return;
    }

    // Case 2: storedId exists and DB query is ready
    if (!dbLoading && dbCheckResult !== undefined) {
      if (dbCheckResult) {
        setGuestId(storedId);
      } else {
        const newId = uuidv4();
        localStorage.setItem("guestId", newId);
        setGuestId(newId);
        insertUser.mutate({ guestId: newId, username: "" });
      }
      setIsLoading(false);
    }

    // Don't call setIsLoading(false) outside these conditions
  }, [storedId, dbCheckResult, dbLoading, insertUser]);

  return (
    <UserContext.Provider value={{ guestId, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useGuestId = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useGuestId must be used within a UserProvider");
  }
  return context;
};
