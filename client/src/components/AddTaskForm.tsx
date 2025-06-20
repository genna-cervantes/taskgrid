import React, { useContext, useRef, useState } from "react";
import { Task } from "../../../server/src/shared/types";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "../utils/trpc";
import { ActionContext } from "../contexts/ActionContext";
import { RecentTaskContext } from "../contexts/RecentTaskContext";
import SelectAssignee from "./SelectAssignee";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Priority is required",
  }),
  link: z.union([z.string().url("Invalid URL"), z.literal("")]).optional(),
  assignedTo: z
    .array(z.string())
    .min(1, { message: "At least one assignee is required" }),
});

export type TaskFormData = z.infer<typeof taskSchema>;

export const priorityLevels = ["low", "medium", "high"] as const;
export type PriorityLevel = (typeof priorityLevels)[number];

const AddTaskForm = ({
  projectId,
  col,
  setAddModal,
  username,
}: {
  projectId: string;
  col: string;
  setAddModal: React.Dispatch<React.SetStateAction<boolean>>;
  username: string | undefined;
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  const utils = trpc.useUtils();
  const actionContext = useContext(ActionContext);
  const recentTaskContext = useContext(RecentTaskContext);

  const inputFileRef = useRef<HTMLInputElement>(null);

  const [taskAssignedTo, setTaskAssignedTo] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const { data: usersInProject } = trpc.getUsernamesInProject.useQuery({
    id: projectId,
  });

  const insertTask = trpc.insertTask.useMutation({
    onSuccess: async (data: Task) => {
      console.log("Task created:", data);
      
      await handleUpload(data.id);

      recentTaskContext?.setTasks([data as Task]); // keep track of this task for removal later if undone
      actionContext?.setAction("added");
      setAddModal(false);

      // files

      utils.getTasks.invalidate({ id: projectId });
    },
    onError: (error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const getUploadUrls = trpc.uploadTaskImages.useMutation();

  const handleUpload = async (taskId: string) => {
    
    const response = await getUploadUrls.mutateAsync({
      projectId,
      taskId,
      previousKeys: [],
      files: files.map((file) => ({
        name: file.name.split('.')[0],
        type: file.type,
      })),
    });

    const uploadResults = await Promise.all(
      response.files.map(async ({ url, key }, index) => {
        const file = files[index];

        // Upload file to S3 using the signed URL
        const res = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type
          },
          body: file,
        });

        if (!res.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        return { name: file.name, key };
      })
    );

    console.log("Upload complete:", uploadResults);
  };

  const onSubmit = async (data: TaskFormData) => {
    insertTask.mutate({ id: projectId, task: { ...data, progress: col, files: [] } }); // empty files array first
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE_MB = 2;
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files).slice(0, 3 - previewUrls.length);
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(`${file.name} is too large (max ${MAX_FILE_SIZE_MB}MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

    setFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removePreview = (url: string, index: number) => {
    setPreviewUrls((prev) => prev.filter((u) => u !== url));
    setFiles((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(url);
  };

  const handleClickUpload = () => {
    if (previewUrls.length < 3) {
      inputFileRef.current?.click();
    } else {
      alert("Maximum of 3 images allowed.");
    }
  };

  const remainingSlots = 3 - previewUrls.length;
  const selectedPriority = watch("priority");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (insertTask.isLoading) {
          e.stopPropagation();
        } else {
          setAddModal(false);
        }
      }} // Close when clicking backdrop
    >
      <div
        className="dark:bg-light bg-lmLightBackground rounded-lg shadow-xl p-4 md:p-6 w-[90%] md:w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-y-4"
        >
          <span className="w-full flex flex-col">
            <label htmlFor="title" className="text-xs font-semibold mb-2">
              Task Title:
            </label>
            <input
              {...register("title")}
              placeholder="New Task Title..."
              className="text-xs md:text-base"
            />
            {errors.title && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.title.message}
              </p>
            )}
          </span>
          <span className="w-full flex flex-col">
            <label htmlFor="description" className="text-xs font-semibold mb-2">
              Task Description:
            </label>
            <textarea
              {...register("description")}
              placeholder="New Task Description..."
              className="text-xs md:text-base"
            />
            {errors.description && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.description.message}
              </p>
            )}
          </span>
          <span className="w-full flex flex-col">
            <label htmlFor="description" className="text-xs font-semibold mb-2">
              Task Media:
            </label>
            <span className="flex w-full justify-start">
              <div className="flex gap-x-2 w-full">
                {/* Render image previews */}
                {previewUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="group/upload relative h-12 w-1/3 overflow-hidden rounded shadow"
                  >
                    <img
                      src={url}
                      alt={`Preview ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePreview(url, idx)}
                      className="hidden group-hover/upload:flex absolute top-0 left-0 w-full h-full bg-black/50 text-fadedWhite justify-center items-center text-xs px-1 rounded-bl"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-circle-minus-icon lucide-circle-minus"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                      </svg>
                    </button>
                  </div>
                ))}

                {previewUrls.length < 3 && (
                  <button
                    type="button"
                    onClick={handleClickUpload}
                    className={`border-2 border-midWhite px-4 py-[0.4rem] rounded-lg flex justify-center items-center ${
                      remainingSlots === 2
                        ? "w-2/3"
                        : remainingSlots === 1
                          ? "w-1/3"
                          : "w-full"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-upload-icon lucide-upload text-midWhite"
                    >
                      <path d="M12 3v12" />
                      <path d="m17 8-5-5-5 5" />
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    </svg>
                  </button>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                ref={inputFileRef}
                className="hidden"
                onChange={handleFileChange}
              />
            </span>
            {errors.description && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.description.message}
              </p>
            )}
          </span>
          <span className="w-full flex flex-col">
            <label htmlFor="description" className="text-xs font-semibold mb-2">
              Task Link:
            </label>
            <input
              {...register("link")}
              placeholder="New Task Link..."
              className="text-xs md:text-base"
            />
            {errors.link && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.link.message}
              </p>
            )}
          </span>
          <span className="w-full flex flex-col">
            <label htmlFor="priority" className="text-xs font-semibold mb-2">
              Task Priority:
            </label>
            <span className="flex gap-x-2 text-sm">
              {priorityLevels.map((p) => (
                <button
                  key={p}
                  onClick={() =>
                    setValue("priority", p, { shouldValidate: true })
                  }
                  type="button"
                  className={`${
                    selectedPriority === p
                      ? "bg-lmMidBackground dark:bg-midWhite text-fadedBlack dark:text-white"
                      : "bg-lmBackground/60"
                  } text-sm md:text-base  dark:bg-faintWhite dark:text-white text-fadedBlack flex-1 hover:bg-lmMidBackground dark:hover:bg-midWhite rounded-md py-1 cursor-pointer transition-colors`}
                >
                  {p}
                </button>
              ))}
            </span>
            {errors.priority && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.priority.message}
              </p>
            )}
          </span>
          <span className="w-full flex flex-col">
            <SelectAssignee
              setValue={setValue}
              setTaskAssignedTo={setTaskAssignedTo}
              taskAssignedTo={taskAssignedTo}
              username={username ?? ""}
              usersInProject={usersInProject ?? []}
            />
            {errors.assignedTo && (
              <p className="text-red-400 text-xs font-semibold mt-1">
                {errors.assignedTo.message}
              </p>
            )}
          </span>
          <button
            type="submit"
            className="w-full flex justify-center text-midBlack dark:text-fadedWhite font-semibold bg-lmBackground hover:bg-lmMidBackground dark:bg-faintWhite rounded-md py-2 cursor-pointer dark:hover:bg-midWhite text-xs md:text-base disabled:cursor-not-allowed disabled:bg-midWhite"
            disabled={insertTask.isLoading}
          >
            {!insertTask.isLoading ? (
              "Add Task"
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

export default AddTaskForm;
