import { useEffect, useRef, useState } from "react";
import { getAllProjects } from "../utils/indexedb";
import EditProjectModal from "../components/EditProjectModal";
import ProjectBlock from "../components/ProjectBlock";
import AddProjectBlock from "../components/AddProjectBlock";
import DeleteProjectModal from "../components/DeleteProjectModal";
import { v4 as uuidv4 } from "uuid";
import { trpc } from "../utils/trpc";
import { trpcClient } from "../main";
import { useGuestId } from "../contexts/UserContext";
import { Project } from "../../../server/src/shared/types";

const Home = () => {
  // const { data, isLoading } = trpc.hello.useQuery({ name: "Genna" });

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [editModal, setEditModal] = useState("");
  const [editProjectModal, setEditProjectModal] = useState(false);
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
        setEditModal("");
        setEditProjectModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [projectIds, setProjectIds] = useState<{ id: string; name: string }[]>([]);

  const guestId = useGuestId()

  const {data: projects } = trpc.getProjects.useQuery({guestId})

  const handleClickOptions = (id: string) => {
    if (editModal === id) {
      setEditModal("");
    } else {
      setEditModal(id);
    }
  };

  return (
    <div className="my-6">
    <div className="text-center ">
      <h1 className="text-2xl pt-4">
        Your <span className="text-green-400 font-semibold">TasKan</span>{" "}
        Boards
      </h1>
      <p className="text-xs pt-2 opacity-50">Guest ID: {guestId}</p>
    </div>

      <div className="grid grid-cols-4 px-8 gap-x-8 gap-y-4 mt-8">
        {projects && projects.map((p: Project) => {
          return (
            <ProjectBlock
              key={p.id}
              p={p}
              handleClickOptions={handleClickOptions}
              editModal={editModal}
              dropdownRef={dropdownRef}
              setEditProjectModal={setEditProjectModal}
              setDeleteProjectModal={setDeleteProjectModal}
            />
          );
        })}
        <AddProjectBlock />
      </div>
      <footer className="fixed bottom-0 py-6 w-full">
        <h1 className="text-center text-xs opacity-50">
          Send questions, issues, and suggestions to <span className="font-bold underline">taskan@email.com</span>
        </h1>
      </footer>
      {editProjectModal && (
        <EditProjectModal
          projectId={editModal}
          setEditProjectModal={setEditProjectModal}
          setEditModal={setEditModal}
        />
      )}
      {deleteProjectModal && (
        <DeleteProjectModal projectId={editModal} setDeleteProjectModal={setDeleteProjectModal} setEditModal={setEditModal} />
      )}
    </div>
  );
};

export default Home;
