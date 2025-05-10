import React, { useContext, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { getProjectNameByKey, getUsernameForProject } from "../utils/indexedb";
import UserNameModal from "../components/UserNameModal";
import LinkCopiedModal from "../components/LinkCopiedModal";
import ActionModal from "../components/ActionModal";
import { ActionContext } from "../contexts/ActionContext";
import SidebarButton from "../components/SidebarButton";
import Sidebar from "../components/Sidebar";
import { trpc } from "../utils/trpc";
import { groupTasksByColumn } from "../utils/utils";
import { Columns } from "../../../server/src/shared/types";


const initialColumns: Columns = {
  backlog: [],
  "in progress": [],
  "for checking": [],
  done: [],
};

const Projects = () => {

  // pag share = true mag jjoin siya ndi kanya so hingin agad ung name
  // pag galing sa home walang share = true so wag na hingin agad ung name

  // UNG SA KAGAYA SA SE NA DAPAT GALING FROM THAT LINK KUNIN UNG STATE IF NDI HINGIN NA AGAD UNG NAME IF WALA NAKASET KASI SHARED UN
  const location = useLocation();
  const fromHome = location.state?.from === "home";

  const navigate = useNavigate();
  const { projectId } = useParams();

  if (!projectId) {
    navigate("/");
    return;
  }

  const [usernameModal, setUsernameModal] = useState(false);
  const [linkCopiedModal, setLinkCopiedModal] = useState(false);
  const [userName, setUsername] = useState();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [projectName, setProjectName] = useState("")
  const [columns, setColumns] = useState(initialColumns);

  const actionContext = useContext(ActionContext);

  const { data, isLoading } = trpc.getTasks.useQuery({ id: projectId ?? "" });

    useEffect(() => {
      if (data) {
        setColumns(groupTasksByColumn(data));
      }
    }, [data]);


  // check if name is set in storage
  const fetchUsername = async () => {
    const userNameFromIdb = await getUsernameForProject(projectId);
    setUsername(userNameFromIdb);
    return userNameFromIdb
  };

  const fetchProjectName = async () => {
    const projectNameFromIdb = await getProjectNameByKey(projectId);
    setProjectName(projectNameFromIdb ?? "")
  }

  useEffect(() => {
    fetchProjectName()
  }, [projectId])

  useEffect(() => {
    fetchUsername();
  }, []);


  useEffect(() => {
    const checkUsername = async () => {
      const username = await fetchUsername();
  
      if (!fromHome && (!username || username === "")) {
        console.log(username);
        setUsernameModal(true);
      }
    };
  
    checkUsername();
  }, []);

  const handleShare = async () => {
    // if not prompt for name
    if (!userName) {
      // set name in indexedb
      setUsernameModal(true);
      return;
      // add name to users in projects db
    }

    // copy link to clipboard
    setLinkCopiedModal(true);
  };

  return (
    <>
      {linkCopiedModal && (
        <LinkCopiedModal setLinkCopiedModal={setLinkCopiedModal} />
      )}
      {usernameModal && (
        <UserNameModal
          fromHome={fromHome}
          projectId={projectId}
          setUsernameModal={setUsernameModal}
        />
      )}
      {/* {openSidebar && <Sidebar setOpenSidebar={setOpenSidebar} />} */}
      <div className="h-full flex flex-col">
        <div className="flex justify-between px-6 items-center py-4">
          {/* <SidebarButton openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} /> */}
          <div className="flex items-center gap-x-4">
            <Link to='/' className="font-bold">TaskGrid</Link>
            <h1 className="">{projectName}</h1>
          </div>
          <div>
            <h1>filter</h1>
          </div>
          <div className="flex justify-end gap-x-4 items-center">
            <h1>{userName}</h1>
            <button
              onClick={handleShare}
              className="px-3 py-1 rounded-md bg-green-400 text-sm font-bold cursor-pointer"
            >
              Share
            </button>
          </div>
        </div>
        <Outlet context={{ setUsernameModal, userName, columns }} />
      </div>
      <div className="w-full flex justify-center">
        {actionContext?.action && (
          <ActionModal projectId={projectId} action={actionContext.action} />
        )}
      </div>
    </>
  );
};

export default Projects;
