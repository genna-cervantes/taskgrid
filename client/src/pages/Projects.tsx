import React from 'react'
import { Outlet } from 'react-router-dom'

const Projects = () => {
  return (
    <div className='h-full flex flex-col'>
        <div>Projects</div>
        <Outlet />
    </div>
  )
}

export default Projects