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

const Home = () => {
  const userContext = useUserContext();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
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

  const { data: projects, isLoading: projectsIsLoading } =
    trpc.getUserProjects.useQuery({ guestId: userContext.userId ?? "" });

  // need loading screen
  if (userContext.isLoading && userContext.userId == null && !userContext.userId) {
    return <>Loading Guest ID...</>;
  }

  return (
    <div className="">
      {/* <div className="text-center">
        <div className="flex justify-center items-center gap-4">
          <h1 className="text-2xl pt-4">
            Your <span className="text-green-400 font-semibold">TasKan</span> Boards
          </h1>
          <button
            onClick={toggleTheme}
            className="mt-4 p-2 rounded-lg bg-gray-200 dark:bg-backgroundDark hover:bg-gray-300 dark:hover:bg-light transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "🌞" : "🌙"}
          </button>
        </div>
        <p className="text-xs pt-2 opacity-50">
          Guest ID: {userContext.guestId ?? "Loading..."}
        </p>
      </div> */}

      <BreadCrumbs crumbs={[]} />
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
