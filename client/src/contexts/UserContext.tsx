import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { trpc } from "../utils/trpc";
import { nanoid } from 'nanoid';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';

type UserContextType = {
  username: string | null; 
  isLoading: boolean;
  currentWorkspace: string | null;
  setCurrentWorkspace: React.Dispatch<React.SetStateAction<string | null>>
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false); 

  const insertUserWithWorkspace = trpc.users.insertUserWithWorkspace.useMutation({
    onSuccess: (data) => {
      if (data){
        setCurrentWorkspace(data.workspaceId);
        localStorage.setItem("username", data.username);
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

  const storedUsername =
    typeof window !== "undefined" ? localStorage.getItem("username") : null;

  const { data: userData, isLoading: dbLoading } =
    trpc.users.checkUsernameAndWorkspaces.useQuery(
      { username: storedUsername ?? '' },
      {
        enabled: !!storedUsername
      }
    );

  useEffect(() => {
    if (hasInitialized || insertUserWithWorkspace.isLoading || insertWorkspace.isLoading) return;

    console.log('running')

    const newWorkspaceName = () =>
      `${uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: '-',
        style: 'lowerCase',
      })}-workspace`;

    const newUsername = () =>
      `${uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: '-',
        style: 'lowerCase',
      })}`;

    const init = async () => {
      if (!storedUsername) {
        console.log(1)
        const newWorkspaceId = nanoid(10);
        const generatedUsername = newUsername();
        insertUserWithWorkspace.mutate({
          workspaceId: newWorkspaceId,
          username: generatedUsername,
          workspaceName: newWorkspaceName(),
        });
        localStorage.setItem("username", generatedUsername);
        setUsername(username)
        setCurrentWorkspace(newWorkspaceId)
        setHasInitialized(true);
        return;
      }
      
      if (!dbLoading && userData) {
        if (!userData.userExists) {
          console.log(2)
          const generatedUsername = newUsername();
          const newWorkspaceId = nanoid(10);
          
          insertUserWithWorkspace.mutate({
            username: generatedUsername,
            workspaceId: newWorkspaceId,
            workspaceName: newWorkspaceName(),
          });
          
          localStorage.setItem("username", generatedUsername);
          setUsername(username)
          setCurrentWorkspace(newWorkspaceId)
          setHasInitialized(true);
          return;
        }
        
        // User exists
        if (userData.workspaces.length > 0) {
          console.log(3)
          setUsername(userData.username)
          setCurrentWorkspace(userData.workspaces[0]);
          setIsLoading(false);
        } else {
          console.log(4)
          const newWorkspaceId = nanoid(10);
          insertWorkspace.mutate({
            username: storedUsername,
            workspaceId: newWorkspaceId,
            workspaceName: newWorkspaceName(),
          });
          setUsername(userData.username)
          setCurrentWorkspace(newWorkspaceId);
        }
        setHasInitialized(true);
      }
    };

    init();
  }, [
    storedUsername,
    userData,
    dbLoading,
    hasInitialized,
    insertUserWithWorkspace,
    insertWorkspace,
  ]);

  return (
    <UserContext.Provider value={{ username, currentWorkspace, setCurrentWorkspace, isLoading }}>
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
