import BreadCrumbs from "@/components/BreadCrumbs";
import LoadingModal from "@/components/LoadingModal";
import { useUserContext } from "@/contexts/UserContext";
import { trpc } from "@/utils/trpc";
import { Loader2, Pencil } from "lucide-react";
import Mousetrap from "mousetrap";
import { nanoid } from "nanoid";
import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator";

// pls rewrite this omg
const ProfilePage = () => {
  const { username } = useParams();
  const { userId } = useUserContext();

  const utils = trpc.useUtils();

  const { setToggleSidebar } = useOutletContext<{
    setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  }>();

  const [editMode, setEditMode] = useState(false);
  const [editedUsername, setEditedUsername] = useState(username);
  const inputUsernameRef = useRef<HTMLInputElement>(null);

  // queries
  const { data: userExists, isLoading: userExistsIsLoading } =
    trpc.users.checkUsername.useQuery(
      { username: username ?? "" },
      { enabled: !!username && username !== "" }
    );

  const { data: workspaces, isLoading } =
    trpc.workspaces.getUserWorkspaces.useQuery(
      { guestId: userId ?? "" },
      { enabled: !!userId && userId != "" }
    );

  // mutations
  const editUsername = trpc.users.editUsername.useMutation({
    onSuccess: () => {
      utils.users.checkGuestIdAndWorkspaces.invalidate();
      window.location.reload();
    },
  });

  const insertWorkspace = trpc.workspaces.insertWorkspace.useMutation({
    onSuccess: () => {
      utils.workspaces.getUserWorkspaces.invalidate();
    },
  });

  // helpers
  const handleEditUsername = () => {
    setEditedUsername(username);
    setEditMode(true);
  };

  const handleSave = () => {
    if (!userId || !editedUsername) return;

    editUsername.mutate({
      guestId: userId,
      username: editedUsername,
    });
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditedUsername(username);
    setEditMode(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  useEffect(() => {
    if (editMode && inputUsernameRef.current) {
      inputUsernameRef.current.focus();
    }
  }, [editMode]);

  const handleAddWorkspace = () => {
    if (!userId) return;

    const newWorkspaceName = () =>
      `${uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: "-",
        style: "lowerCase",
      })}-workspace`;
    const newWorkspaceId = nanoid(10);

    insertWorkspace.mutate({
      userId: userId ?? "",
      workspaceId: newWorkspaceId,
      workspaceName: newWorkspaceName(),
    });
  };

  // keyboard shortcuts
  useEffect(() => {
    Mousetrap.bind("ctrl+b", function (e) {
      e.preventDefault();
      setToggleSidebar((prev) => !prev);
    });

    return () => {
      Mousetrap.unbind("ctrl+b");
    };
  }, []);

  if (userExistsIsLoading) {
    return <LoadingModal />;
  }

  if (!username) {
    // so they get assigned a username if user doesnt exist
    return <Navigate to="/workspaces" />;
  }

  if (!userExists) {
    return <Navigate to="/profile" />;
  }

  return (
    <>
      <BreadCrumbs crumbs={[{ name: username, url: `/profile/${username}` }]} />
      <div className="flex flex-col gap-y-4">
        <div className="flex w-full justify-between items-center">
          <div className="flex gap-x-2 items-center">
            <span className="flex gap-x-2 w-fit">
              <h1>Username: </h1>
              {editMode ? (
                <input
                  ref={inputUsernameRef}
                  type="text"
                  className="w-fit bg-transparent outline-none text-white"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                />
              ) : (
                <h1>{username}</h1>
              )}
            </span>
            {!editMode && (
              <button onClick={handleEditUsername}>
                <Pencil className="h-5 text-fadedWhite hover:text-white" />
              </button>
            )}
          </div>
          <button className="bg-purple-300 px-2 py-1 rounded-md text-backgroundDark text-sm font-semibold ">
            Log In
          </button>
        </div>
        <div className="mt-2">
          <h2 className="text-sm font-semibold">Workspaces:</h2>
          <div className="mt-2 w-full justify-center flex flex-col items-center gap-y-2 text-sm">
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (workspaces?.length ?? 0) > 0 ? (
              workspaces?.map((w) => (
                <React.Fragment key={w.workspaceId}>
                  <WorkspaceRow userId={userId ?? ""} id={w.workspaceId} name={w.name} isOwner={w.isOwner} />
                </React.Fragment>
              ))
            ) : (
              <h1>No workspaces yet...</h1>
            )}
          </div>
          <div className="w-full flex justify-center mt-6">
            <button
              onClick={handleAddWorkspace}
              className="px-4 py-2 rounded-md bg-green-300 text-backgroundDark font-semibold text-xs"
            >
              Add Workspace
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const WorkspaceRow = ({ userId, id, name, isOwner }: { userId: string, id: string; name: string, isOwner: boolean }) => {
  const utils = trpc.useUtils();

  const [editMode, setEditMode] = useState(false);
  const [editedWorkspaceName, setEditedWorkspaceName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  // mutations
  const updateWorkspaceName = trpc.workspaces.updateWorkspaceName.useMutation({
    onSuccess: () => {
      // toast
      utils.workspaces.getUserWorkspaces.invalidate();
    },
  });
  const deleteWorkspace = trpc.workspaces.deleteWorkspace.useMutation({
    onSuccess: () => {
      // toast
      utils.workspaces.getUserWorkspaces.invalidate();
    },
  });
  const leaveWorkspace = trpc.workspaces.leaveWorkspace.useMutation({
    onSuccess: () => {
      // toast
      utils.workspaces.getUserWorkspaces.invalidate();
    },
  });

  // helpers
  const handleEdit = () => {
    setEditedWorkspaceName(name);
    setEditMode(true);
  };

  const handleSave = () => {
    if (!id) return;

    updateWorkspaceName.mutate({
      workspaceId: id,
      workspaceName: editedWorkspaceName,
    });
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditedWorkspaceName(name);
    setEditMode(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleLeaveOrDelete = () => {
    if (isOwner){
        deleteWorkspace.mutate({workspaceId: id})
    }else{
        if (!userId) return;

        leaveWorkspace.mutate({workspaceId: id, userId})
    }
  }

  useEffect(() => {
    if (editMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editMode]);

  return (
    <>
        <div className="flex justify-between w-full border border-faintWhite rounded-md px-4 py-2 items-center">
        <div className="flex gap-x-1 items-center text-xs">
            {editMode ? (
            <input
                ref={inputRef}
                type="text"
                className="w-fit bg-transparent  outline-none text-white"
                value={editedWorkspaceName}
                onChange={(e) => setEditedWorkspaceName(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
            />
            ) : (
            <h1>{name}</h1>
            )}
            {!editMode && (
            <button onClick={handleEdit} disabled={deleteWorkspace.isLoading || leaveWorkspace.isLoading} className="disabled:cursor-not-allowed">
                <Pencil className="h-4 text-fadedWhite hover:text-white" />
            </button>
            )}
        </div>
        <div className="text-xs font-semibold text-backgroundDark flex gap-x-3">
            <button onClick={handleLeaveOrDelete} className="px-2 py-1 bg-red-400 rounded-md">
                {isOwner ? "Delete" : "Leave"}
            </button>
            <Link
                to={`/workspaces/${id}`}
                className="px-2 py-1 bg-purple-300 rounded-md"
            >
                Go to
            </Link>
        </div>
        </div>
    </>
  );
};

export default ProfilePage;
