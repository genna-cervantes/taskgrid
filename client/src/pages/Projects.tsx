import React, { useState } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { getUsernameForProject } from '../utils/indexedb'
import UserNameModal from '../components/UserNameModal';
import LinkCopiedModal from '../components/LinkCopiedModal';

const Projects = () => {

  const navigate = useNavigate();
  const { projectId } = useParams();

  if (!projectId){
    navigate('/');
    return;
  }

  const [usernameModal, setUsernameModal] = useState(false)
  const [linkCopiedModal, setLinkCopiedModal] = useState(false)
  const [userName, setUsername] = useState("")

  const handleShare = async () => {
    // check if name is set in storage
    let userNameFromIdb = await getUsernameForProject(projectId)
    
    // if not prompt for name
    if (!userNameFromIdb){
      // set name in indexedb
      setUsernameModal(true)
      // add name to users in projects db
    }
    
    setUsername(userNameFromIdb)
    // copy link to clipboard
    setLinkCopiedModal(true)
  }

  return (
    <>
      {linkCopiedModal && <LinkCopiedModal setLinkCopiedModal={setLinkCopiedModal} />}
      {usernameModal && <UserNameModal projectId={projectId} setUsernameModal={setUsernameModal} />}
      <div className='h-full flex flex-col'>
          <div className='flex justify-end px-4 mt-4 gap-x-4 items-center'>
            <h1>{userName}</h1>
            <button onClick={handleShare} className='px-3 py-1 rounded-md bg-green-400 text-sm font-bold cursor-pointer'>Share</button>
          </div>
          <Outlet />
      </div>
    </>
  )
}

export default Projects