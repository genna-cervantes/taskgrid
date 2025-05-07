import React, { useEffect, useRef, useState } from "react";
import { trpc } from "../utils/trpc";
import { getAllProjects } from "../utils/indexedb";
import EditProjectModal from "../components/EditProjectModal";
import { Link } from "react-router-dom";
import ProjectBlock from "../components/ProjectBlock";
import AddProjectBlock from "../components/AddProjectBlock";
import DeleteProjectModal from "../components/DeleteProjectModal";

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

  useEffect(() => {
    // check if name is set in storage
    const fetchProjectIds = async () => {
      const projects = await getAllProjects();
      setProjectIds(projects);
    };

    fetchProjectIds();
  }, []);

  useEffect(() => {
    console.log(projectIds);
  }, [projectIds]);

  const handleClickOptions = (id: string) => {
    if (editModal === id) {
      setEditModal("");
    } else {
      setEditModal(id);
    }
  };

  return (
    <div className="my-6">
      <h1 className="text-center text-2xl py-4">
        Your <span className="text-green-400 font-semibold">TaskGrid</span>{" "}
        Boards
      </h1>
      <div className="grid grid-cols-4 px-8 gap-x-8 gap-y-4 mt-8">
        {projectIds.map((p) => {
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
