import React, { useContext, useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { getUsernameForProject } from "../utils/indexedb";
import UserNameModal from "../components/UserNameModal";
import LinkCopiedModal from "../components/LinkCopiedModal";
import ActionModal from "../components/ActionModal";
import { ActionContext } from "../contexts/ActionContext";
import SidebarButton from "../components/SidebarButton";
import Sidebar from "../components/Sidebar";

const Projects = () => {

  // pag share = true mag jjoin siya ndi kanya so hingin agad ung name
  // pag galing sa home walang share = true so wag na hingin agad ung name

  // UNG SA KAGAYA SA SE NA DAPAT GALING FROM THAT LINK KUNIN UNG STATE IF NDI HINGIN NA AGAD UNG NAME IF WALA NAKASET KASI SHARED UN

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
  const actionContext = useContext(ActionContext);

  useEffect(() => {
    // check if name is set in storage
    const fetchUsername = async () => {
      const userNameFromIdb = await getUsernameForProject(projectId);
      setUsername(userNameFromIdb);
    };

    fetchUsername();
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
          projectId={projectId}
          setUsernameModal={setUsernameModal}
        />
      )}
      {openSidebar && <Sidebar setOpenSidebar={setOpenSidebar} />}
      <div className="h-full flex flex-col">
        <div className="flex justify-between px-6 items-end">
          <SidebarButton openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
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
        <Outlet context={{ setUsernameModal, userName }} />
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
