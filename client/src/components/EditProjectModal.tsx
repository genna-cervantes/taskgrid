import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectFormData, projectSchema } from "./AddProjectForm";
import { trpc } from "../utils/trpc";

const EditProjectModal = ({
  projectId,
  setEditProjectModal,
  setEditModal,
}: {
  projectId: string;
  setEditProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEditModal: React.Dispatch<React.SetStateAction<string>>;
}) => {
  // get name of project

   const editProjectName = trpc.editProjectName.useMutation({
    onSuccess: (data) => {
      console.log("Project created:", data);
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const { data: projectNameFromDb } = trpc.getProjectNameByKey.useQuery({id: projectId})

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: projectNameFromDb || "",
    },
  });

  const handleClickOutside = () => {
    setEditProjectModal(false);
    setEditModal("");
  };

  useEffect(() => {
    if (projectNameFromDb) {
      form.reset({ name: projectNameFromDb });
    }
  }, [projectNameFromDb]);

  const onSubmit = async (data: ProjectFormData) => {
    // await updateProjectName(projectId, data.name);
    editProjectName.mutate({id: projectId, name: data.name})
    setEditProjectModal(false);
    setEditModal("");
    window.location.reload();
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
          <h1>{projectId}</h1>
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
