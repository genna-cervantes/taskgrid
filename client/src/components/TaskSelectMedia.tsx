import React, { useRef, useState } from "react";
import { Task } from "../../../server/src/shared/types";
import { trpc } from "@/utils/trpc";

const TaskSelectMedia = ({
  task,
  projectId,
  taskMediaError,
  setTaskMediaError,
  previewUrls,
  setPreviewUrls,
  taskImageUrls,
  setTaskImagesUrls,
  setFiles,
  setImageModalState,
  isPage=false
}: {
    isPage?: boolean
  task: Task;
  projectId: string;
  taskMediaError: string;
  setTaskMediaError: React.Dispatch<React.SetStateAction<string>>;
  previewUrls: string[];
  setPreviewUrls: React.Dispatch<React.SetStateAction<string[]>>;
  taskImageUrls: {
    url: string;
    key: string;
  }[];
  setTaskImagesUrls: React.Dispatch<
    React.SetStateAction<
      {
        url: string;
        key: string;
      }[]
    >
  >;
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setImageModalState: React.Dispatch<
    React.SetStateAction<{
      visible: boolean;
      url: string;
      index: number;
      deleteFunction:
        | ((url: string, index: number) => void)
        | ((url: string) => void);
    } | null>
  >;
}) => {
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [taskImagesHasInitialized, setTaskImagesHasInitialized] =
    useState(false);

  const { isLoading: taskImageUrlsIsLoading } = trpc.tasks.getTaskImages.useQuery(
    { taskId: task.id, projectId, keys: task.files },
    {
      enabled: !!task && !taskImagesHasInitialized,
      onSuccess: (data) => {
        setTaskImagesUrls(data ?? []);
        setTaskImagesHasInitialized(true);
      },
    }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE_MB = 2;
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files).slice(0, 3 - previewUrls.length);
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setTaskMediaError(
          `${file.name} is too large (max ${MAX_FILE_SIZE_MB}MB)`
        );
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

  const handleClickUpload = () => {
    if (previewUrls.length + (taskImageUrls?.length ?? 3) < 3) {
      // better not allowed when task images are still loading
      inputFileRef.current?.click();
    } else {
      alert("Maximum of 3 images allowed.");
    }
  };

  // removing file functions
  // one for preview: just uploaded
  const removePreview = (url: string, index: number) => {
    setPreviewUrls((prev) => prev.filter((u) => u !== url));
    setFiles((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(url);
  };

  // one for previous: from s3 already
  const removeTaskImage = (url: string) => {
    setTaskImagesUrls((prev) => prev.filter((u) => u.url != url));
  };

  const showImage = (
    url: string,
    index: number,
    deleteFunction:
      | ((url: string, index: number) => void)
      | ((url: string) => void)
  ) => {
    setImageModalState({
      visible: true,
      url,
      index,
      deleteFunction,
    });
  };

  const remainingSlots =
    3 - (previewUrls.length + (taskImageUrls?.length ?? 3));

  return (
    <div>
      <h3
        className={`${isPage ? "text-xs" : "text-xxs"} text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
      >
        Media:
      </h3>

      <div className={`flex w-full gap-x-2 ${isPage ? "h-20" : "h-12"} mt-1`}>
        {taskImageUrlsIsLoading || taskImageUrls == undefined ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* loop thru media images from s3 */}
            {taskImageUrls?.map((url) => (
              <div
                key={url.url}
                className="group/image relative w-1/3 rounded-md overflow-hidden"
              >
                <button
                  className="hidden group-hover/image:flex absolute inset-0 items-center justify-center bg-black/50 text-white text-sm z-10 cursor-pointer"
                  // onClick={() => removeTaskImage(url.url)}
                  onClick={() => showImage(url.url, 0, removeTaskImage)}
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
                    className="lucide lucide-scan-eye-icon lucide-scan-eye text-midWhite/50"
                  >
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <circle cx="12" cy="12" r="1" />
                    <path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0" />
                  </svg>
                </button>
                <img
                  src={url.url}
                  alt="Task image"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {/* // loop thru previewUrls */}
            {previewUrls.map((url, idx) => (
              <div
                key={idx}
                className={`group/upload relative ${isPage ? "h-20" : "h-12"} w-1/3 overflow-hidden rounded shadow`}
              >
                <img
                  src={url}
                  alt={`Preview ${idx}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => showImage(url, idx, removePreview)}
                  // onClick={() => removePreview(url, idx)}
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
                    className="lucide lucide-scan-eye-icon lucide-scan-eye text-midWhite/50"
                  >
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <circle cx="12" cy="12" r="1" />
                    <path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0" />
                  </svg>
                </button>
              </div>
            ))}
          </>
        )}
        {taskImageUrls != undefined &&
        !taskImageUrlsIsLoading &&
        previewUrls.length + taskImageUrls.length < 3 ? ( // combined preview and s3
          <>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={inputFileRef}
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handleClickUpload}
              className={`border border-faintWhite group/click-upload hover:border-midWhite px-4 py-[0.4rem] rounded-lg flex justify-center items-center ${
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
                className="lucide lucide-upload-icon lucide-upload text-faintWhite group-hover/click-upload:text-midWhite"
              >
                <path d="M12 3v12" />
                <path d="m17 8-5-5-5 5" />
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              </svg>
            </button>
          </>
        ) : (
          <></>
        )}
      </div>

      {taskMediaError !== "" && (
        <h4 className="font-semibold text-xs text-red-400">{taskMediaError}</h4>
      )}
    </div>
  );
};

export default TaskSelectMedia;
