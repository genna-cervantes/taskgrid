import { trpc } from "@/utils/trpc";
import { Pen } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";

const BreadCrumbs = ({
  crumbs,
}: {
  crumbs: { name: string; url: string }[];
}) => {

  const {workspaceId} = useParams()
  const utils = trpc.useUtils();

  const [editMode, setEditMode] = useState(false);
  const [editedWorkspaceName, setEditedWorkspaceName] = useState(
    crumbs[0]?.name || ""
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // mutations

  const updateWorkspaceName = trpc.workspaces.updateWorkspaceName.useMutation({
    onSuccess: () => {
      // toast
      utils.workspaces.checkWorkspaceId.invalidate()
    }

  })
  
  // helpers
  const handleEdit = () => {
    setEditedWorkspaceName(crumbs[0].name);
    setEditMode(true);
  };

  const handleSave = () => {
    if (!workspaceId) return;

    updateWorkspaceName.mutate({workspaceId, workspaceName: editedWorkspaceName})
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditedWorkspaceName(crumbs[0].name);
    setEditMode(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  useEffect(() => {
    if (editMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editMode]);

  return (
    <div className="w-full flex gap-x-2 justify-start mb-3 mt-1 text-xs items-center text-white/80">
      {crumbs.map((c, index) => (
        <React.Fragment key={index}>
          {(editMode && c.url.startsWith('/workspaces')) ? (
            <input
              ref={inputRef}
              type="text"
              className="w-fit bg-transparent  outline-none text-white"
              value={editedWorkspaceName}
              onChange={(e) => setEditedWorkspaceName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <Link
              to={c.url}
              className={`truncate text-ellipsis overflow-hidden hover:underline ${
                index < crumbs.length - 1 ? "text-faintWhite" : ""
              }`}
            >
              {index === 0 && editMode ? editedWorkspaceName : c.name}
            </Link>
          )}
          {index !== crumbs.length - 1 && " > "}
        </React.Fragment>
      ))}
      {crumbs.length === 1 && crumbs[0].url.startsWith('/workspaces') && !editMode && (
        <button onClick={handleEdit}>
          <Pen className="h-4 text-midWhite hover:text-white" />
        </button>
      )}
    </div>
  );
};

export default BreadCrumbs;