import BreadCrumbs from "@/components/BreadCrumbs";
import { Link, useParams } from "react-router-dom";
import { trpc } from "@/utils/trpc";
import { Funnel, Github, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import QuillEditor from "@/components/QuillEditor";
import { useUserContext } from "@/contexts/UserContext";
import { useState, useEffect, useRef, useCallback } from "react";
// Removed Zustand stores - using React Query cache instead

const ManageProject = () => {
  const { workspaceId, projectId } = useParams();
  const userContext = useUserContext();
  const utils = trpc.useUtils();

  // Project details - React Query will use cached data from Projects.tsx
  const { data: projectDetails } = trpc.projects.getProjectDetails.useQuery(
    { projectId: projectId ?? "" },
    {
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000, // Same cache settings as Projects.tsx
      cacheTime: 15 * 60 * 1000,
    }
  );

  const { data: workspaceName } = trpc.workspaces.checkWorkspaceId.useQuery(
    { workspaceId: workspaceId ?? "" },
    { enabled: !!workspaceId }
  );

  // Local state for editable fields
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectPrivacy, setProjectPrivacy] = useState<"public" | "private">("private");
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit mode state for project name
  const [editMode, setEditMode] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Use projectDetails directly from React Query
  // const projectPlan = projectDetails?.plan;

  // Initialize local state when project details are loaded
  useEffect(() => {
    if (projectDetails) {
      setProjectName(projectDetails.name || "");
      setEditedProjectName(projectDetails.name || "");
      setProjectDescription(projectDetails.description || "");
      setProjectPrivacy(projectDetails.privacy as "public" | "private" || "private");
    }
  }, [projectDetails]);

  // Mutations
  const editProjectName = trpc.projects.editProjectName.useMutation({
    onSuccess: () => {
      utils.projects.getProjectDetails.invalidate({ projectId: projectId ?? "" });
      utils.projects.getUserWorkspaceProjects.invalidate();
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Failed to update project name:", error.message);
      setIsSaving(false);
    },
  });

  const editProjectDescription = trpc.projects.editProjectDescription.useMutation({
    onSuccess: () => {
      utils.projects.getProjectDetails.invalidate({ projectId: projectId ?? "" });
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Failed to update project description:", error.message);
      setIsSaving(false);
    },
  });

  const editProjectPrivacy = trpc.projects.editProjectPrivacy.useMutation({
    onSuccess: () => {
      utils.projects.getProjectDetails.invalidate({ projectId: projectId ?? "" });
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Failed to update project privacy:", error.message);
      setIsSaving(false);
    },
  });

  // Debounced save functions
  const saveProjectName = (name: string) => {
    if (name !== projectDetails?.name && userContext.username) {
      setIsSaving(true);
      editProjectName.mutate({
        id: projectId ?? "",
        name,
        guestId: userContext.username,
      });
    }
  };

  const saveProjectDescription = useCallback((description: string) => {
    if (description !== projectDetails?.description && userContext.username) {
      setIsSaving(true);
      editProjectDescription.mutate({
        id: projectId ?? "",
        description,
        guestId: userContext.username,
      });
    }
  }, [projectDetails?.description, userContext.username, projectId, editProjectDescription]);

  const saveProjectPrivacy = (privacy: "public" | "private") => {
    if (privacy !== projectDetails?.privacy && userContext.username) {
      setIsSaving(true);
      editProjectPrivacy.mutate({
        id: projectId ?? "",
        privacy,
        guestId: userContext.username,
      });
    }
  };

  // Project name edit handlers (breadcrumb style)
  const handleEditProjectName = () => {
    setEditedProjectName(projectName);
    setEditMode(true);
  };

  const handleSaveProjectName = () => {
    if (editedProjectName !== projectName) {
      setProjectName(editedProjectName);
      saveProjectName(editedProjectName);
    }
    setEditMode(false);
  };

  const handleCancelProjectName = () => {
    setEditedProjectName(projectName);
    setEditMode(false);
  };

  const handleKeyDownProjectName = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveProjectName();
    } else if (e.key === "Escape") {
      handleCancelProjectName();
    }
  };

  // Focus input when edit mode is enabled
  useEffect(() => {
    if (editMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editMode]);

  // Debounced description save
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (projectDescription && projectDescription !== projectDetails?.description) {
        saveProjectDescription(projectDescription);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [projectDescription, saveProjectDescription, projectDetails?.description]);

  // Users in project - React Query will use cached data
  const { data: usersInProject = [] } = trpc.users.getUsernamesInProject.useQuery({
    id: projectId ?? "",
  }, {
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });

  // Handle missing parameters after all hooks
  if (!projectId || !workspaceId) {
    return <div>Project not found</div>;
  }

  return (
    <>
      <BreadCrumbs
        crumbs={[
          { name: workspaceName as string, url: `/workspaces/${workspaceId}` },
          {
            name: projectName as string,
            url: `/workspaces/${workspaceId}/projects/${projectId}`,
          },
          {
            name: "manage",
            url: `/workspaces/${workspaceId}/projects/${projectId}/manage`,
          },
        ]}
      />

      <div>
        <div className="flex justify-between">
          <div className="flex gap-x-3 items-center w-full">
            {editMode ? (
              <input
                ref={inputRef}
                type="text"
                className="w-fit text-lg text-white/90 placeholder:text-midWhite text-white bg-transparent outline-none font-semibold"
                value={editedProjectName}
                onChange={(e) => setEditedProjectName(e.target.value)}
                onBlur={handleSaveProjectName}
                onKeyDown={handleKeyDownProjectName}
                placeholder="Project name..."
              />
            ) : (
              <h1
                className="font-semibold text-lg text-white/90 cursor-pointer hover:text-white transition-colors"
                onClick={handleEditProjectName}
              >
                {projectName || "Untitled Project"}
              </h1>
            )}
            {!editMode && <div className="text-xxs px-2 flex items-center justify-center rounded-xl bg-yellow-300/30 border">
              {projectDetails?.plan &&
                projectDetails?.plan.charAt(0).toUpperCase() + projectDetails?.plan.slice(1)}{" "}
              Plan
            </div>}
          </div>
        </div>
        <div className="text-sm mt-3 min-h-24">
          <QuillEditor 
            isPage={true}
            description={projectDescription} 
            setDescription={(description) => {
              if (typeof description === 'function') {
                const newDesc = description(projectDescription);
                const desc = newDesc || "";
                setProjectDescription(desc);
              } else {
                const desc = description || "";
                setProjectDescription(desc);
              }
            }} 
          />
        </div>

        <p className="text-xs text-faintWhite mt-2 italic">{isSaving ? 'Saving...' : 'Autosaved'}</p>

        {/* privacy */}
        <div className="w-full mt-4">
          <div className="flex justify-between mt-2">
            <div className="flex gap-x-1 items-center">
              <p className="text-sm">Public Project</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 text-midWhite" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-backgroundDark text-fadedWhite mb-2">
                    <p>visible to everyone, even users outside your project</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={projectPrivacy === "public"}
              onCheckedChange={(checked) => {
                const newPrivacy = checked ? "public" : "private";
                setProjectPrivacy(newPrivacy);
                saveProjectPrivacy(newPrivacy);
              }}
              className="data-[state=checked]:bg-fadedWhite data-[state=unchecked]:bg-faintWhite "
            />
          </div>
        </div>

        {/* users */}
        <div className="w-full mt-4">
          <div className="flex gap-x-4">
            <div className="flex items-center gap-x-2">
              <h2 className="text-sm">Users</h2>
              <div className="bg-faintWhite/10 w-5 h-5 flex justify-center items-center font-semibold text-xs capitalize text-center font-noto rounded-full">
                {usersInProject?.length ?? 0}
              </div>
            </div>
            <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
              <Funnel className="h-3" />
              <p>Filter</p>
            </button>
          </div>
          <div className="mt-2 w-full flex flex-col gap-y-2 max-h-44 overflow-auto super-thin-scrollbar">
            {usersInProject.map((username, index) => (
              <div key={index} className="w-full border border-faintWhite flex justify-between gap-x-8 rounded-md px-2 py-1 items-center">
                <div className="flex items-center gap-x-2">
                  <h1 className="text-sm">{username}</h1>
                  <div className="bg-purple-300/20 text-xxs rounded-md px-2">Owner</div>
                </div>
                <div className="flex gap-x-2">
                  <button className="border border-faintWhite text-xxs px-2 rounded-md py-1">
                    Make Admin
                  </button>
                  <button className="border border-faintWhite text-xxs px-2 rounded-md py-1">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* integrations */}
        <div className="mt-4 w-full">
          <h2 className="text-sm">Integrations</h2>
          <div className="mt-2 w-full">
            <div className="w-full border border-faintWhite flex justify-between gap-x-8 rounded-md px-2 py-2 items-center">
              <div>
                <span className="flex gap-x-1 items-center">
                  <Github className="h-4" />
                  <h1 className="text-sm font-bold">Github</h1>
                </span>
                <p className="text-xs mt-2">
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nisi
                  minus autem omnis illum consequatur, cumque sint nostrum
                </p>
              </div>
              <Link target="_blank" to='https://github.com/apps/taskan-app/installations/new' className="border border-faintWhite text-xs px-2 rounded-md py-1">
                Connect
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageProject;
