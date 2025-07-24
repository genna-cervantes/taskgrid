import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { trpc } from "../utils/trpc";
import { nanoid } from 'nanoid';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';

type UserContextType = {
  userId: string | null;
  isLoading: boolean;
  currentWorkspace: string | null;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false); // 🔑 prevent multiple inits

  const insertUserWithWorkspace = trpc.users.insertUserWithWorkspace.useMutation({
    onSuccess: (data) => {
      if (data){
        setUserId(data.userId);
        setCurrentWorkspace(data.workspaceId);
        localStorage.setItem("guestId", data.userId);
        setIsLoading(false);
      }
    },
    onError: (e) => {
      console.error("Insert user error", e);
    },
  });

  const insertWorkspace = trpc.workspaces.insertWorkspace.useMutation({
    onSuccess: (data) => {
      if (data){
        setCurrentWorkspace(data.workspaceId);
        setIsLoading(false);
      }
    },
    onError: (e) => {
      console.error("Insert workspace error", e);
    },
  });

  const storedGuestId =
    typeof window !== "undefined" ? localStorage.getItem("guestId") : null;

  const { data: userData, isLoading: dbLoading } =
    trpc.users.checkGuestIdAndWorkspaces.useQuery(
      { guestId: storedGuestId ?? '' },
      {
        enabled: !!storedGuestId
      }
    );

  useEffect(() => {
    if (hasInitialized || insertUserWithWorkspace.isLoading || insertWorkspace.isLoading) return;

    const newWorkspaceName = () =>
      `${uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: '-',
        style: 'lowerCase',
      })}-workspace`;

    const init = async () => {
      if (!storedGuestId) {
        console.log('1')
        const newId = uuidv4();
        const newWorkspaceId = nanoid(10);
        insertUserWithWorkspace.mutate({
          guestId: newId,
          username: '',
          workspaceId: newWorkspaceId,
          workspaceName: newWorkspaceName(),
        });
        localStorage.setItem("guestId", newId);
        setUserId(newId)
        setCurrentWorkspace(newWorkspaceId)
        setHasInitialized(true);
        return;
      }
      
      if (!dbLoading && userData) {
        if (!userData.userExists) {
          console.log(storedGuestId)
          console.log('2')
          const newId = uuidv4();
          const newWorkspaceId = nanoid(10);

          insertUserWithWorkspace.mutate({
            guestId: newId,
            username: '',
            workspaceId: newWorkspaceId,
            workspaceName: newWorkspaceName(),
          });

          localStorage.setItem("guestId", newId);
          setUserId(newId)
          setCurrentWorkspace(newWorkspaceId)
          setHasInitialized(true);
          return;
        }
        
        // User exists
        if (userData.workspaces.length > 0) {
          console.log('3')
          setUserId(storedGuestId)
          setCurrentWorkspace(userData.workspaces[0]);
          setIsLoading(false);
        } else {
          console.log('4')
          const newWorkspaceId = nanoid(10);
          insertWorkspace.mutate({
            userId: storedGuestId,
            workspaceId: newWorkspaceId,
            workspaceName: newWorkspaceName(),
          });
          setUserId(storedGuestId)
          setCurrentWorkspace(newWorkspaceId);
        }
        setHasInitialized(true);
      }
    };

    init();
  }, [
    storedGuestId,
    userData,
    dbLoading,
    hasInitialized,
    insertUserWithWorkspace,
    insertWorkspace,
  ]);

  console.log(userId)

  return (
    <UserContext.Provider value={{ userId, currentWorkspace, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};


export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
