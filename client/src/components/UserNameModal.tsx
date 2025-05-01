import React, { useState } from 'react'
import { setUsernameForProject } from '../utils/indexedb'

const UserNameModal = ({projectId, setUsernameModal}: {projectId: string, setUsernameModal: React.Dispatch<React.SetStateAction<boolean>>}) => {

    const [name, setName] = useState("")
    
    const handleSaveName = async () => {
        await setUsernameForProject(projectId, name)
        setUsernameModal(false);
    }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setUsernameModal(false)} // Close when clicking backdrop
    >
      <div
        className="bg-[#464646] rounded-lg shadow-xl p-6 w-full max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <div className='flex justify-between items-center'> 
            <h1 className='text-sm font-bold'>What name should others in this project call you?</h1>
            <button onClick={() => setUsernameModal(false)} className='px-4 py-1 text-white text-sm font-semibold rounded-md bg-white/20 cursor-pointer'>Close</button>
        </div>
        <input type="text" placeholder='Karina Yoo' value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={handleSaveName} className='w-full bg-green-400 text-white font-semibold text-sm py-2 rounded-md cursor-pointer'>Save</button>
      </div>
    </div>
  )
}

export default UserNameModal