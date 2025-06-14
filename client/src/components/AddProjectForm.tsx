import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { trpc } from "../utils/trpc";
import { useGuestId } from "../contexts/UserContext";

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

const AddProjectForm = ({
  setAddProjectForm,
}: {
  setAddProjectForm: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const utils = trpc.useUtils();
  const userContext = useGuestId();

  const addProject = trpc.addProject.useMutation({
    onSuccess: (data) => {
      setAddProjectForm(false);
      utils.getUserProjects.invalidate();
      console.log("Project created:", data);
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    const id = uuidv4() as string;
    addProject.mutate({
      id,
      name: data.name,
      guestId: userContext.guestId ?? "",
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (addProject.isLoading) {
          e.stopPropagation();
        } else {
          setAddProjectForm(false);
        }
      }}
    >
      <div
        className="dark:bg-light bg-lmLightBackground rounded-lg shadow-xl p-6 w-[90%] md:w-full max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-y-4"
        >
          <span className="w-full flex flex-col">
            <label htmlFor="title" className="text-xs font-semibold mb-2">
              Project Name:
            </label>
            <input {...register("name")} placeholder="New Project Name..." />
            {errors.name && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.name.message}
              </p>
            )}
          </span>
          <button
            type="submit"
            className="w-full text-sm bg-green-500 text-white rounded-md py-2 cursor-pointer hover:bg-green-600 flex justify-center items-center disabled:cursor-not-allowed disabled:bg-gray-300"
            disabled={addProject.isLoading}
          >
            {!addProject.isLoading ? (
              "Add Project"
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

export default AddProjectForm;
