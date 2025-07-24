import { useEffect, useRef, useState } from "react";
import EditProjectModal from "../components/EditProjectModal";
import ProjectBlock from "../components/ProjectBlock";
import AddProjectBlock from "../components/AddProjectBlock";
import DeleteProjectModal from "../components/DeleteProjectModal";
import { trpc } from "../utils/trpc";
import { useUserContext } from "../contexts/UserContext";
import { Project } from "../../../server/src/shared/types";
import ManageProjectModal from "../components/ManageProjectModal";
// import { useTheme } from "../contexts/ThemeContext";
import BreadCrumbs from "@/components/BreadCrumbs";
import { Navigate, useOutletContext, useParams } from "react-router-dom";
import Mousetrap from "mousetrap";

const Home = () => {
  const userContext = useUserContext();
  const { workspaceId } = useParams()
  
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { setToggleSidebar } = useOutletContext<{
      setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
    }>();

  const [editProject, setEditProject] = useState({
    projectId: "",
    projectName: "",
  });
  const [editProjectModal, setEditProjectModal] = useState(false);
  const [manageProjectModal, setManageProjectModal] = useState(false);
  const [deleteProjectModal, setDeleteProjectModal] = useState(false);
  // const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = dropdownRef.current;
      const modal = document.getElementById("edit-project-modal");

      if (
        dropdown &&
        !dropdown.contains(event.target as Node) &&
        (!modal || !modal.contains(event.target as Node))
      ) {
        setEditProject({
          projectId: "",
          projectName: "",
        });
        setEditProjectModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // check if workspace exists
  const { data: workspaceName, isLoading: workspaceExistsIsLoading } = trpc.checkWorkspaceId.useQuery({workspaceId: workspaceId!, guestId: userContext.userId ?? ""}, {enabled: userContext.userId !== "" && workspaceId !== ""})

  const { data: projects, isLoading: projectsIsLoading } =
    trpc.getUserWorkspaceProjects.useQuery({ guestId: userContext.userId ?? "", workspaceId: workspaceId! }, {enabled: userContext.userId !== "" && workspaceId !== ""});

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

  // need loading screen
  if (userContext.isLoading && userContext.userId == null && !userContext.userId) {
    return <>Loading Guest ID...</>;
  }
  if (workspaceExistsIsLoading && !workspaceName) {
    return <>Loading Workspace...</>;
  }

  // no provided workspace id
  if (!workspaceId || workspaceId === "" || !workspaceName){
    return <Navigate to={`/workspaces/${userContext.currentWorkspace}`} replace />;
  }

  return (
    <div className="">
      <BreadCrumbs crumbs={[{name: workspaceName, url: `/workspaces/${workspaceId}`}]} />
      {!projects && projectsIsLoading ? (
        <p className="text-sm opacity-50 text-center mt-8">
          Loading your taskan boards...
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-4">
          {projects &&
            projects.map((p: Project) => {
              return (
                <ProjectBlock
                  key={p.id}
                  p={p}
                  workspaceId={workspaceId}
                  editProject={editProject}
                  setEditProject={setEditProject}
                  dropdownRef={dropdownRef}
                  setEditProjectModal={setEditProjectModal}
                  setManageProjectModal={setManageProjectModal}
                  setDeleteProjectModal={setDeleteProjectModal}
                />
              );
            })}
          <AddProjectBlock />
        </div>
      )}
      <footer className="fixed bottom-0 py-6 w-full">
        <h1 className="text-center text-xs opacity-50">
          Send questions, issues, and suggestions to{" "}
          <span className="font-bold underline">@gengennadevs</span>
          {" "}on x.com
        </h1>
      </footer>
      {editProjectModal && (
        <EditProjectModal
          editProject={editProject}
          setEditProject={setEditProject}
          setEditProjectModal={setEditProjectModal}
        />
      )}
      {manageProjectModal && (
        <ManageProjectModal
          editProject={editProject}
          setEditProject={setEditProject}
          setManageProjectModal={setManageProjectModal}
        />
      )}
      {deleteProjectModal && (
        <DeleteProjectModal
          editProject={editProject}
          setDeleteProjectModal={setDeleteProjectModal}
          setEditProject={setEditProject}
        />
      )}
    </div>
  );
};

export default Home;
