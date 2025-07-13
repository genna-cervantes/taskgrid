import LoadingModal from "@/components/LoadingModal";
import TaskDescription from "@/components/TaskDescription";
import TaskSelectCategory from "@/components/TaskSelectCategory";
import TaskSelectPriority from "@/components/TaskSelectPriority";
import { trpc } from "@/utils/trpc";
import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { priorityLevels } from "@/components/AddTaskForm";
import TaskTargetDates from "@/components/TaskTargetDates";
import { Task } from "../../../server/src/shared/types";
import TaskAssignee from "@/components/TaskAssignee";
import { useGuestId } from "@/contexts/UserContext";
import TaskSelectMedia from "@/components/TaskSelectMedia";
import TaskImageModal from "@/components/TaskImageModal";
import TaskLink from "@/components/TaskLink";
import TaskDiscussionBoard from "@/components/TaskDiscussionBoard";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Mousetrap from "mousetrap";

const TaskPage = () => {
  const { projectId: projectIdParam, taskId: taskIdParam } = useParams();
  const projectId = projectIdParam ?? "";
  const taskId = taskIdParam ?? "";

  const userContext = useGuestId();
  const { data: username, isLoading: usernameIsLoading } =
    trpc.getUsername.useQuery({
      id: projectId,
      guestId: userContext.guestId ?? "",
    });

  const { data, isLoading: taskDataIsLoading } = trpc.getTaskById.useQuery({
    projectId,
    taskId: taskId,
  });

  const task: Task | undefined = data
    ? {
        ...data,
        targetStartDate: data.targetStartDate
          ? new Date(data.targetStartDate)
          : undefined,
        targetEndDate: data.targetEndDate
          ? new Date(data.targetEndDate)
          : undefined,
      }
    : undefined;

  const [taskTitle, setTaskTitle] = useState(task?.title);
  const [taskDescription, setTaskDescription] = useState(task?.description);
  const [taskCategory, setTaskCategory] = useState(task?.category);
  const [taskPriority, setTaskPriority] = useState(task?.priority);
  const [taskAssignedTo, setTaskAssignedTo] = useState(task?.assignedTo ?? []);
  const [taskLink, setTaskLink] = useState(task?.link);
  const [taskTargetStartDate, setTaskTargetStartDate] = useState<
    Date | undefined
  >(task?.targetStartDate);
  const [taskTargetEndDate, setTaskTargetEndDate] = useState<Date | undefined>(
    task?.targetEndDate
  );

  const [taskTargetDateError, setTaskTargetDateError] = useState("");
  const [taskAssignedToError, setTaskAssignedToError] = useState("");
  const [taskMediaError, setTaskMediaError] = useState("");
  const [taskLinkError, setTaskLinkError] = useState("");

  const getUploadUrls = trpc.uploadTaskImages.useMutation();

  const [uploadTaskImagesIsLoading, setUploadTaskImagesIsLoading] =
    useState(false);

  const [files, setFiles] = useState<File[]>([]); // empty at first talaga
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [taskImageUrls, setTaskImagesUrls] = useState<
    { url: string; key: string }[]
  >([]);

  const [imageModalState, setImageModalState] = useState<{
    visible: boolean;
    url: string;
    index: number;
    deleteFunction:
      | ((url: string, index: number) => void)
      | ((url: string) => void);
  } | null>(null);

  const handleUpload = async (taskId: string) => {
    setUploadTaskImagesIsLoading(true);
    const response = await getUploadUrls.mutateAsync({
      projectId,
      taskId,
      previousKeys: taskImageUrls.map((t) => t.key),
      files: files.map((file) => ({
        name: file.name.split(".")[0],
        type: file.type,
      })),
    });

    await Promise.all(
      response.files.map(async ({ url, key }, index) => {
        const file = files[index];

        // Upload file to S3 using the signed URL
        const res = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!res.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        return { name: file.name, key };
      })
    );

    setUploadTaskImagesIsLoading(false);
  };

  useEffect(() => {
    if (task) {
      setTaskTitle(task.title);
      setTaskDescription(task.description);
      setTaskCategory(task.category);
      setTaskPriority(task.priority);
      setTaskAssignedTo(task.assignedTo ?? []);
      setTaskLink(task.link);
      setTaskTargetStartDate(task.targetStartDate);
      setTaskTargetEndDate(task.targetEndDate);
    }
  }, [task]); // get rid of this and just create state on the inputs

  const joinDiscussionRef = useRef<HTMLTextAreaElement>(null)

  const navigate = useNavigate()
  
  useEffect(() => {  
      Mousetrap.bind('ctrl+j', function(e) {
        e.preventDefault();
        joinDiscussionRef.current?.focus()
      });

      Mousetrap.bind('esc', function(e) {
        e.preventDefault();
        navigate(`/projects/${projectId}`)
      });
      
      return () => {
        Mousetrap.unbind('ctrl+s');
        Mousetrap.unbind('esc');
      };
    }, []);
  

  if (task == null && !taskDataIsLoading) {
    return <Navigate to="/404" replace />;
  }

  if (taskDataIsLoading || task == undefined) {
    console.log("loading");
    return <LoadingModal />;
  }

  return (
    <div className="w-full h-screen flex">
      <div className="scrollbar-group w-[60%] h-full">
        <div className="group-hover-scrollbar w-full px-4 flex flex-col gap-y-4 max-h-screen overflow-y-scroll super-thin-scrollbar">
          <div>
            <h3
              className={`text-xs text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
            >
              Title:
            </h3>
            <textarea
              placeholder="What's this about?"
              className={`w-full text-base h-12 super-thin-scrollbar placeholder:text-faintWhite shadow-bottom-grey focus:outline-none focus:ring-0 focus:border-transparent`}
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </div>
          <TaskDescription
            isPage={true}
            taskDescription={taskDescription}
            setTaskDescription={setTaskDescription}
          />
          <TaskSelectCategory
            isPage={true}
            projectId={projectId}
            taskCategoryOptions={[]}
            taskCategory={taskCategory}
            setTaskCategory={setTaskCategory}
          />
          <TaskSelectPriority
            isPage={true}
            priorityLevels={priorityLevels}
            taskPriority={taskPriority}
            setTaskPriority={setTaskPriority}
          />
          <TaskTargetDates
            isPage={true}
            taskTargetStartDate={taskTargetStartDate}
            taskTargetEndDate={taskTargetEndDate}
            setTaskTargetStartDate={setTaskTargetStartDate}
            setTaskTargetEndDate={setTaskTargetEndDate}
            taskTargetDateError={taskTargetDateError}
          />
          <TaskAssignee
            isPage={true}
            projectId={projectId}
            username={username}
            taskAssignedTo={taskAssignedTo}
            setTaskAssignedTo={setTaskAssignedTo}
            taskAssignedToError={taskAssignedToError}
          />
          {task && (
            <TaskSelectMedia
              isPage={true}
              task={task}
              projectId={projectId}
              taskMediaError={taskMediaError}
              setTaskMediaError={setTaskMediaError}
              previewUrls={previewUrls}
              setPreviewUrls={setPreviewUrls}
              taskImageUrls={taskImageUrls}
              setTaskImagesUrls={setTaskImagesUrls}
              setFiles={setFiles}
              setImageModalState={setImageModalState}
            />
          )}
          {imageModalState?.visible && (
            <TaskImageModal
              url={imageModalState.url}
              index={imageModalState.index}
              setDisplayImage={(s: boolean) => {
                setImageModalState((prev) => {
                  if (!prev) return null; // or whatever makes sense if modal is closed
                  return { ...prev, visible: s };
                });
              }}
              handleDelete={imageModalState.deleteFunction}
            />
          )}
          <TaskLink
            isPage={true}
            taskLink={taskLink}
            setTaskLink={setTaskLink}
            taskLinkError={taskLinkError}
          />
          <div className="flex items-center gap-x-4">
            <hr className="flex-grow border-t border-faintWhite" />
            <p className="text-xs text-center text-faintWhite whitespace-nowrap">
              Advanced Task Details
            </p>
            <hr className="flex-grow border-t border-faintWhite" />
          </div>
          <div>
            <h3
              className={`text-xs text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
            >
              Depends On:
            </h3>
            <Select>
            <SelectTrigger className="w-full border-none shadow-bottom-grey px-0 placeholder:text-faintWhite">
                <p className={`text-base text-faintWhite`} >Select Task</p>
            </SelectTrigger>
            <SelectContent className="bg-backgroundDark">
                <SelectGroup className={`text-base`}>
                <SelectItem value="apple" className="hover:cursor-pointer">Apple</SelectItem>
                <SelectItem value="banana" >Banana</SelectItem>
                <SelectItem value="blueberry" >Blueberry</SelectItem>
                <SelectItem value="grapes" >Grapes</SelectItem>
                <SelectItem value="pineapple" >Pineapple</SelectItem>
                </SelectGroup>
            </SelectContent>
            </Select>
          </div>
          <div>
            <h3
              className={`text-xs text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
            >
              Sub Tasks:
            </h3>
            <div className="flex my-1 gap-x-2 items-center">
                <Checkbox className="bg-inherit h-5 w-5 border border-faintWhite" />
                <input type='text' placeholder="Subtask 1" className="shadow-bottom-grey placeholder:text-faintWhite text-base w-full focus:outline-none focus:ring-0 focus:border-transparent" />
            </div>
          </div>
          <div className="mb-16">
            <h3
              className={`text-xs text-midWhite !font-rubik tracking-wider transition-all duration-100 `}
            >
              Personal Notes:
            </h3>
            <textarea
              placeholder="Notes only you can see"
              className={`w-full text-base h-24 placeholder:text-faintWhite shadow-bottom-grey focus:outline-none focus:ring-0 focus:border-transparent`}
              value=""
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="w-[40%] px-6 h-screen">
        <TaskDiscussionBoard ref={joinDiscussionRef} isPage={true} user={username} taskId={task.id} />
      </div>
    </div>
  );
};

export default TaskPage;
