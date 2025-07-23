import React from 'react'

const BreadCrumbs = ({crumbs}: {crumbs: {name: string, url: string}[]}) => {
  return (
    <div className="w-full flex justify-start mb-2">
        <h1 className="truncate text-ellipsis overflow-hidden">
            hello
        </h1>
    </div>
  )
}

export default BreadCrumbs