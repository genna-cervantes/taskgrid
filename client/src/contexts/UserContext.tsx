import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { trpc } from "../utils/trpc";
import { nanoid } from "nanoid";
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from "unique-names-generator";
import { authClient } from "@/lib/auth";

type UserContextType = {
  username: string | null;
  setUsername: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  currentWorkspace: string | null;
  setCurrentWorkspace: React.Dispatch<React.SetStateAction<string | null>>;
  isGuest: boolean;
  setIsGuest: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setHasInitialized: React.Dispatch<React.SetStateAction<boolean>>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [username, setUsername] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // check if logged in and not guest
  const {
    data: session,
    isPending: sessionIsPending,
    error: sessionError,
  } = authClient.useSession();

  const [storedUsername, setStoredUsername] = useState<string | null>(null);
  const [checkedUsername, setCheckedUsername] = useState<boolean>(false);

  useEffect(() => {
    if (sessionIsPending) return;

    if (session) {
      console.log('updated session')
      setStoredUsername(session.user.name);
      setHasInitialized(false);
    } else {
      setStoredUsername(localStorage.getItem("username"));
    }

    setCheckedUsername(true);
  }, [sessionIsPending, session, sessionError]);

  // for guests
  const insertUserWithWorkspace =
    trpc.users.insertUserWithWorkspace.useMutation({
      onSuccess: (data) => {
        if (data) {
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
      if (data) {
        setCurrentWorkspace(data.workspaceId);
        setIsLoading(false);
      }
    },
    onError: (e) => {
      console.error("Insert workspace error", e);
    },
  });

  const { data: userData, isLoading: dbLoading } =
    trpc.users.checkUsernameAndWorkspaces.useQuery(
      { username: storedUsername ?? "" },
      {
        enabled: !!storedUsername,
      }
    );

  useEffect(() => {
    if (
      hasInitialized ||
      insertUserWithWorkspace.isLoading ||
      insertWorkspace.isLoading || 
      !checkedUsername
    )
      return;

    const newWorkspaceName = () =>
      `${uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: "-",
        style: "lowerCase",
      })}-workspace`;

    const newUsername = () =>
      `${uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: "-",
        style: "lowerCase",
      })}`;

    const init = async () => {
      if (!storedUsername) {
        const newWorkspaceId = nanoid(10);
        const generatedUsername = newUsername();
        insertUserWithWorkspace.mutate({
          workspaceId: newWorkspaceId,
          username: generatedUsername,
          workspaceName: newWorkspaceName(),
        });
        localStorage.setItem("username", generatedUsername);
        setUsername(generatedUsername);
        setIsGuest(true);
        setCurrentWorkspace(newWorkspaceId);
        setHasInitialized(true);
        setIsLoading(false);

        console.log('1 finish')
        return;
      }
      
      if (storedUsername && !dbLoading && userData) {
        if (!userData.userExists) {
          console.log(2);
          const generatedUsername = newUsername();
          const newWorkspaceId = nanoid(10);
          
          insertUserWithWorkspace.mutate({
            username: generatedUsername,
            workspaceId: newWorkspaceId,
            workspaceName: newWorkspaceName(),
          });

          localStorage.setItem("username", generatedUsername);
          setIsGuest(true);
          setUsername(generatedUsername);
          setCurrentWorkspace(newWorkspaceId);
          setHasInitialized(true);
          setIsLoading(false);
          return;
        }
        
        // User exists
        if (userData.workspaces.length > 0) {
          console.log(3);
          setUsername(userData.username);
          setCurrentWorkspace(userData.workspaces[0]);
          setIsGuest(userData.isGuest);
          setIsLoading(false);
        } else {
          console.log(4);
          const newWorkspaceId = nanoid(10);
          insertWorkspace.mutate({
            username: storedUsername,
            workspaceId: newWorkspaceId,
            workspaceName: newWorkspaceName(),
          });
          setIsGuest(userData.isGuest);
          setUsername(userData.username);
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
    <UserContext.Provider
      value={{ username, setUsername, currentWorkspace, setCurrentWorkspace, isLoading, setHasInitialized, setIsLoading, isGuest, setIsGuest }}
    >
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
