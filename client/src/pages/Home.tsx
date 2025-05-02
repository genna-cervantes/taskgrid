import React, { useEffect, useRef, useState } from "react";
import { trpc } from "../utils/trpc";
import { getAllProjectIds, getAllProjects } from "../utils/indexedb";
import EditProjectModal from "../components/EditProjectModal";
import { Link } from "react-router-dom";

const Home = () => {
  // const { data, isLoading } = trpc.hello.useQuery({ name: "Genna" });

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [editModal, setEditModal] = useState("");
  const [editProjectModal, setEditProjectModal] = useState(false);

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
  

  const [projectIds, setProjectIds] = useState<{ id: string; name: string }[]>([
    { id: "q3432", name: "new project" },
    { id: "asdf", name: "new project" },
    { id: "23423", name: "new project" },
    { id: "afsd", name: "new project" },
    { id: "2890fuw", name: "new project" },
  ]);

  useEffect(() => {
    // check if name is set in storage
    const fetchProjectIds = async () => {
      const projects = await getAllProjects();
      setProjectIds(projects);
    };

    fetchProjectIds();
  }, []);

  useEffect(() => {
    console.log(projectIds)
  }, [projectIds])

  const handleClickOptions = (id: string) => {
    if (editModal === id){
      setEditModal("")
    }else{
      setEditModal(id)
    }
  }

  return (
    <div className="my-6">
      <h1 className="text-center text-2xl py-4">
        Your <span className="text-green-400 font-semibold">TaskGrid</span>{" "}
        Boards
      </h1>
      <div className="grid grid-cols-4 px-8 gap-x-8 gap-y-4 mt-8">
        {projectIds.map((p) => {
          return (
            <React.Fragment key={p.id}>
            <Link className="bg-[#282828] rounded-md h-28 px-4 py-4 flex flex-col justify-between cursor-pointer relative" to={`/projects/${p.id}`}>
              <div className="flex justify-between">
                <h1 className="font-bold">{p.name}</h1>
                <div className="relative">
                  <button className="cursor-pointer" onClick={() => handleClickOptions(p.id)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-ellipsis-vertical"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
          
                  {editModal === p.id && (
                    <div
                    ref={dropdownRef}
                    className="absolute top-full right-0 mt-2 bg-[#3a3a3a] p-2 rounded-md shadow-lg z-50 w-max flex flex-col gap-y-2 text-sm"
                  >
                    <button onClick={() => setEditProjectModal(true)} className="w-full h-1/2 hover:bg-white/20 text-white  p-2 px-4 rounded-md cursor-pointer">
                      edit project
                    </button>
                    <button className="w-full h-1/2 hover:bg-red-400 text-white  p-2 px-4 rounded-md cursor-pointer">
                      leave project
                    </button>
                  </div>
                  
                  
                  )}
                </div>
              </div>
              <h3 className="text-sm">{p.id}</h3>
            </Link>
          </React.Fragment>          
          );
        })}
      </div>
      {editProjectModal && <EditProjectModal projectId={editModal} setEditProjectModal={setEditProjectModal} setEditModal={setEditModal} />}
    </div>
  );
};

export default Home;
