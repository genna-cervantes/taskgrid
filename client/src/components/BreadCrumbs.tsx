import React from 'react'
import { Link } from 'react-router-dom'

const BreadCrumbs = ({crumbs}: {crumbs: {name: string, url: string}[]}) => {
  return (
    <div className="w-full flex gap-x-2 justify-start mb-2 text-sm items-center text-white/80">
        {crumbs.map((c, index) => (
            <React.Fragment key={index}>
            <Link
            to={c.url}
            key={index}
            className={`truncate text-ellipsis overflow-hidden hover:underline ${index < crumbs.length - 1 ? 'text-faintWhite' : ''}`}
            >
            {c.name}
            </Link>
            {index !== crumbs.length - 1 && ' > '}
            </React.Fragment>
        ))}
    </div>
  )
}

export default BreadCrumbs