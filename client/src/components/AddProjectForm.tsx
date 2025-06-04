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
  const guestId = useGuestId()

  const addProject = trpc.addProject.useMutation({
    onSuccess: (data) => {
      utils.getUserProjects.invalidate()
      console.log("Project created:", data);
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    const id = uuidv4() as string;
    addProject.mutate({id, name: data.name, guestId})
    setAddProjectForm(false)
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setAddProjectForm(false)} // Close when clicking backdrop
    >
      <div
        className="bg-[#464646] rounded-lg shadow-xl p-6 w-[90%] md:w-full max-w-xl flex flex-col gap-y-4"
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
            className="w-full text-sm bg-white/20 rounded-md py-2 cursor-pointer hover:bg-white/40"
          >
            Add Project
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProjectForm;
