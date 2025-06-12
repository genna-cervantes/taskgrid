import { useEffect, useRef, useState } from "react";
import EditProjectModal from "../components/EditProjectModal";
import ProjectBlock from "../components/ProjectBlock";
import AddProjectBlock from "../components/AddProjectBlock";
import DeleteProjectModal from "../components/DeleteProjectModal";
import { trpc } from "../utils/trpc";
import { useGuestId } from "../contexts/UserContext";
import { Project } from "../../../server/src/shared/types";
import ManageProjectModal from "../components/ManageProjectModal";

const Home = () => {

  const userContext = useGuestId();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [editProject, setEditProject] = useState({
    projectId: "",
    projectName: "",
  });
  const [editProjectModal, setEditProjectModal] = useState(false);
  const [manageProjectModal, setManageProjectModal] = useState(false);
  const [deleteProjectModal, setDeleteProjectModal] = useState(false);

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
    trpc.getUserProjects.useQuery({ guestId: userContext.guestId ?? "" });

  // need loading screen
  if (userContext.isLoading && userContext.guestId == null && !userContext.guestId){
    return <>
      Loading Guest ID...
    </>
  }

  return (
    <div className="my-6">
      <div className="text-center ">
        <h1 className="text-2xl pt-4">
          Your <span className="text-green-400 font-semibold">TasKan</span>{" "}
          Boards
        </h1>
        <p className="text-xs pt-2 opacity-50">Guest ID: {userContext.guestId ?? "Loading..."}</p>
      </div>

      {!projects && projectsIsLoading ? (
        <p className="text-sm opacity-50 text-center mt-8">
          Loading your taskan boards...
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-8 gap-x-8 gap-y-4 mt-8">
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
