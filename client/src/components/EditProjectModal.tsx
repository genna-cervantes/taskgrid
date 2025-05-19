import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectFormData, projectSchema } from "./AddProjectForm";
import { trpc } from "../utils/trpc";
import { useGuestId } from "../contexts/UserContext";

const EditProjectModal = ({
  editProject,
  setEditProject,
  setEditProjectModal,
}: {
  editProject: {
    projectId: string;
    projectName: string;
},
  setEditProject: React.Dispatch<React.SetStateAction<{
      projectId: string;
      projectName: string;
    }>>
  setEditProjectModal: React.Dispatch<React.SetStateAction<boolean>>
}) => {

  const guestId = useGuestId()
  const utils = trpc.useUtils()
  
  const editProjectName = trpc.editProjectName.useMutation({
    onSuccess: (data) => {
      console.log("Project created:", data);
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: editProject.projectName || "",
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    // await updateProjectName(projectId, data.name);
    editProjectName.mutate({id: editProject.projectId, name: data.name, guestId})
    setEditProjectModal(false);
    setEditProject({
      projectId: "",
      projectName: ""
    });
    utils.getProjects.invalidate()
  };

  // helper functions
  const handleClickOutside = () => {
    setEditProjectModal(false);
    setEditProject({
      projectId: "",
      projectName: ""
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={handleClickOutside} // Close when clicking backdrop
    >
      <div
        id="edit-project-modal"
        className="bg-[#464646] rounded-lg shadow-xl p-6 w-full max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <span className="w-full flex flex-col">
          <label htmlFor="name" className="text-xs font-semibold mb-2">
            Project Id:
          </label>
          <h1>{editProject.projectId}</h1>
        </span>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-y-4"
        >
          <span className="w-full flex flex-col">
            <label htmlFor="title" className="text-xs font-semibold mb-2">
              Project Name:
            </label>
            <input {...form.register("name")} placeholder="New Project Name..." />
            {form.formState.errors.name && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </span>
          <button
            type="submit"
            className="bg-green-400 w-full text-white text-sm font-semibold py-2 rounded-md cursor-pointer"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
