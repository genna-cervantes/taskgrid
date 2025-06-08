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
  };
  setEditProject: React.Dispatch<
    React.SetStateAction<{
      projectId: string;
      projectName: string;
    }>
  >;
  setEditProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const userContext = useGuestId();
  const utils = trpc.useUtils();

  const editProjectName = trpc.editProjectName.useMutation({
    onSuccess: (data) => {
      console.log("Project created:", data);
      setEditProjectModal(false);
      setEditProject({
        projectId: "",
        projectName: "",
      });
      utils.getUserProjects.invalidate();
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
    editProjectName.mutate({
      id: editProject.projectId,
      name: data.name,
      guestId: userContext.guestId ?? "",
    });
  };

  // helper functions
  const handleClickOutside = () => {
    setEditProjectModal(false);
    setEditProject({
      projectId: "",
      projectName: "",
    });
  };

  if (
    userContext.isLoading &&
    userContext.guestId == null &&
    !userContext.guestId
  ) {
    return <>Loading Guest ID...</>;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={handleClickOutside} // Close when clicking backdrop
    >
      <div
        id="edit-project-modal"
        className="bg-[#464646] rounded-lg shadow-xl p-6 w-[90%] md:w-full max-w-xl flex flex-col gap-y-4"
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
            <input
              {...form.register("name")}
              placeholder="New Project Name..."
            />
            {form.formState.errors.name && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </span>
          <button
            type="submit"
            className="bg-green-400 w-full text-white text-sm font-semibold py-2 rounded-md cursor-pointer disabled:cursor-not-allowed"
            disabled={editProjectName.isLoading}
          >
            {!editProjectName.isLoading ? (
              "Save"
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-loader-circle-icon lucide-loader-circle animate-spin"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
