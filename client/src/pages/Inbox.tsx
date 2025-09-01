import BreadCrumbs from "@/components/BreadCrumbs";
import { useNotificationsSocket } from "@/contexts/NotificationContext";
import { useUserContext } from "@/contexts/UserContext";
import { trpc } from "@/utils/trpc";
import { Check, MailOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";

const Inbox = () => {
  const { workspaceId, projectId } = useParams();
  const { username } = useUserContext();

  const { notifications } = useNotificationsSocket();

  // get non read notifs from backend
  const { data } = trpc.notifications.getUnreadNotifications.useQuery(
    { username: username!, projectId: projectId! },
    {
      enabled: !!username && username !== "" && !!projectId && projectId !== "",
    }
  );

  // check if workspace exists
  const { data: workspaceName, isLoading: workspaceExistsIsLoading } =
    trpc.workspaces.checkWorkspaceId.useQuery(
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    );

  const { data: projectName, isLoading: projectNameIsLoading } =
    trpc.projects.getProjectNameByKey.useQuery(
      {
        id: projectId!,
      },
      { enabled: projectId !== "" }
    );

  return (
    <>
      <BreadCrumbs
        crumbs={[
          {
            name: workspaceName as string,
            url: `/workspaces/${workspaceId}`,
          },
          {
            name: projectName as string,
            url: `/workspaces/${workspaceId}/projects/${projectId}`,
          },
          {
            name: "inbox",
            url: `/workspaces/${workspaceId}/projects/${projectId}/inbox`,
          },
        ]}
      />
      <div className="w-full">
        <div className="flex items-center gap-x-4">
          <div className="flex gap-x-2 items-center">
            <p className="text-sm font-semibold">Unread Messages</p>
            <div className="bg-faintWhite/10 w-5 h-5 flex justify-center items-center font-semibold text-xs capitalize text-center font-noto rounded-full">
              3
            </div>
          </div>
          <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
            <MailOpen className="h-3" />
            <p>Mark all as read</p>
          </button>
        </div>

        <div className="w-full flex flex-col gap-y-2 mt-3">
          {/* acutal notifs */}
          {notifications.length > 0 ? (
            notifications.map((n) => <MentionNotification comment={n} />)
          ) : (
            <p>What an empty sea..</p>
          )}
        </div>
      </div>
    </>
  );
};

const MentionNotification = ({ comment }: { comment: string }) => {
  return (
    <div className="w-full border border-faintWhite rounded-md px-3 py-3">
      <div className="mb-3">
        <p className="text-xxs text-midWhite mb-2">
          {new Date().toLocaleDateString()}
        </p>
        <h1 className="text-xs font-bold">
          🔔 You were mentioned in a discussion!
        </h1>
        <p className="text-xxs mt-2 text-fadedWhite">
          <ReactMarkdown>{comment}</ReactMarkdown>
        </p>
      </div>

      <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
        <MailOpen className="h-3" />
        <p>Mark as read</p>
      </button>
    </div>
  );
};

//   <div className="w-full border border-faintWhite rounded-md px-3 py-3">
//             <div className="mb-3">
//               <p className="text-xxs text-midWhite mb-2">
//                 August 20, 2025 6:16AM
//               </p>
//               <h1 className="text-xs font-bold">
//                 🚀 Great Progress Today Team!
//               </h1>
//               <p className="text-xxs mt-2 text-fadedWhite">
//                 <ReactMarkdown>
//                   {`Your team has been moving tasks quickly — **3 tasks with progress** and counting.  Keep the momentum going! 🎯
//         - Notifications → Done
//         - Finetuning → In Review
//         - Unit Tests → Done `}
//                 </ReactMarkdown>
//               </p>
//             </div>

//             <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
//               <MailOpen className="h-3" />
//               <p>Mark as read</p>
//             </button>
//           </div>
//           <div className="w-full border border-faintWhite rounded-md px-3 py-3">
//             <div className="mb-3">
//               <h1 className="text-xs font-bold">
//                 🔔 You were mentioned by @Sara on Task:{" "}
//                 <span className="underline">Student Dashboard Revamp</span>
//               </h1>
//               <p className="text-xxs mt-2 text-fadedWhite">
//                 <ReactMarkdown>
//                   {`Message: "How is this going along so far? @Genna"`}
//                 </ReactMarkdown>
//               </p>
//             </div>

//             <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
//               <MailOpen className="h-3" />
//               <p>Mark as read</p>
//             </button>
//           </div>
//           <div className="w-full border border-faintWhite rounded-md px-3 py-3">
//             <div className="mb-3">
//               <h1 className="text-xs font-bold">
//                 ❓ Having trouble with Task:{" "}
//                 <span className="underline">Student Dashboard Revamp</span>?
//               </h1>
//               <p className="text-xxs mt-2 text-fadedWhite">
//                 <ReactMarkdown>
//                   {`Task has been stagnant for 5 days. Better to inform your team to unblock progress. Keep pushing — small steps move the project forward!`}
//                 </ReactMarkdown>
//               </p>
//             </div>

//             <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
//               <MailOpen className="h-3" />
//               <p>Mark as read</p>
//             </button>
//           </div>

export default Inbox;
