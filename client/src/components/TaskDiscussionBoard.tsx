import { Info } from "lucide-react";
import { useState, useEffect, useRef, forwardRef, Ref } from "react";
import { trpc } from "../utils/trpc";
import { useParams } from "react-router-dom";
import { MentionsInput, Mention } from "react-mentions";

const Comment = ({ comment }: { comment: string }) => {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (ref.current) {
      setIsTruncated(ref.current.scrollHeight > ref.current.clientHeight + 2);
    }
  }, [comment]);

  return (
    <>
      <div
        ref={ref}
        className={`text-sm text-white/80 break-words ${
          expanded ? "" : "line-clamp-2"
        }`}
        style={{ transition: "all 0.2s" }}
      >
        {comment}
      </div>
      {!expanded && isTruncated && (
        <button
          className="text-xs text-midWhite underline mt-1"
          onClick={() => setExpanded(true)}
        >
          Read more
        </button>
      )}
    </>
  );
};

type TaskDiscussionBoardProps = {
  taskId: string;
  user: string | undefined;
  isPage?: boolean;
};

const TaskDiscussionBoardBase = (
  props: TaskDiscussionBoardProps,
  ref: Ref<HTMLTextAreaElement>
) => {
  const { projectId } = useParams();

  const { taskId, user } = props;
  const [insertComment, setInsertComment] = useState("");
  const [showUsernames, setShowUsername] = useState(false);

  const utils = trpc.useUtils();

  const { data, isLoading: commentsIsLoading } =
    trpc.tasks.getCommentsByTask.useQuery({ taskId });

  const { data: usersInProj } = trpc.users.getUsernamesInProject.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  const comments = data?.map((c) => ({
    ...c,
    createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : null,
  }));

  const addComment = trpc.tasks.addComment.useMutation({
    onSuccess: () => {
      utils.tasks.getCommentsByTask.invalidate({ taskId });
    },
  });

  const mentionInputStyle = {
    control: {
      backgroundColor: "transparent",
      fontSize: "0.875rem", // text-sm
      fontWeight: "normal",
      width: '100%',
    },
    "&multiLine": {
      control: {
        minHeight: "3.5rem", // h-14
        fontFamily: "inherit",
        width: '100%',
      },
      highlighter: {
        padding: "0.25rem 0.5rem", // py-1 px-2
        border: "1px solid transparent",
        borderRadius: "0.5rem", // rounded-lg
      },
      input: {
        padding: "0.25rem 0.5rem", // py-1 px-2
        border: "1px solid rgba(255, 255, 255, 0.1)", // border-faintWhite/10
        borderRadius: "0.5rem", // rounded-lg
        outline: "none",
        "&:focus": {
          outline: "none",
          boxShadow: "none", // focus:ring-0
        },
      },
    },
    suggestions: {
      list: {
        backgroundColor: "rgba(26, 26, 26, 1) !important",
        borderRadius: "0.5rem",
        fontSize: "0.75rem",
        color: '#000',
      },
      item: {
        padding: "4px 4px",
        "&focused": {
          backgroundColor: "#f3f4f6",
        },
      },
    },
  };


  return (
    <div className="w-full h-full pb-8 flex flex-col gap-y-4 pr-2">
      <div className={`flex-1 `}>
        {commentsIsLoading && (
          <p className="text-sm text-midWhite">Comments are loading...</p>
        )}
        <div className="flex flex-col gap-y-3">
          {!commentsIsLoading &&
          Array.isArray(comments) &&
          comments.length > 0 ? (
            comments.map((c) => (
              <div
                key={c.commentId}
                className="p-2 rounded-md border border-faintWhite/10"
              >
                <Comment comment={c.comment} />
                <div className="flex justify-between w-full items-center mt-2">
                  <div className="text-xs font-semibold text-midWhite">
                    {c.commentBy}
                  </div>
                  <div className="text-xxs text-midWhite">{c.createdAt}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-midWhite">No comments yet...</p>
          )}
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-start gap-y-1 w-full">
        <span className="flex items-center text-midWhite">
          <Info className="h-3" />
          <p className="text-xxs italic">press enter to send message</p>
        </span>
        <MentionsInput
          className="w-full"
          value={insertComment}
          onChange={(e) => setInsertComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();

              if (!projectId) return;

              if (insertComment.trim().length > 0) {
                addComment.mutate({
                  taskId,
                  projectId,
                  comment: insertComment,
                  commentBy: user!,
                });
                setInsertComment("");
              }

              setShowUsername(false);
            }
          }}
          style={mentionInputStyle}
          placeholder="Add a comment... (use @ to mention someone)"
        >
          <Mention
            className="bg-light"
            trigger="@"
            data={
              usersInProj?.map((user) => ({ id: user, display: user })) ?? []
            }
            // style={mentionStyle}
          />
        </MentionsInput>

        {/* <textarea
          ref={ref}
          value={insertComment}
          onChange={(e) => setInsertComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "@") {
              setShowUsername(true);
            }
            if (e.key === "Enter") {
              e.preventDefault();

              if (!projectId) return;

              if (insertComment.trim().length > 0) {
                addComment.mutate({
                  taskId,
                  projectId,
                  comment: insertComment,
                  commentBy: user!,
                });
                setInsertComment("");
              }

              setShowUsername(false);
            }
          }}
          className="w-full h-14 px-2 py-1 border border-faintWhite/10 rounded-lg text-sm placeholder:text-faintWhite focus:outline-none focus:ring-0"
          placeholder="Join the discussion"
        /> */}
        {/* <button
          type="button"
          className="text-midWhite hover:text-white focus:text-white focus:outline-none focus:ring-0 disabled:hover:text-midWhite disabled:hover:cursor-not-allowed"
          onClick={() => {
            if (insertComment.trim().length > 0) {
              addComment.mutate({
                taskId,
                comment: insertComment,
                commentBy: user!,
              });
              setInsertComment("");
            }
          }}
          disabled={
            !user || addComment.isLoading || insertComment.trim().length === 0
          }
        >
          <SendHorizonal />
        </button> */}
      </div>
    </div>
  );
};

// ✅ Correct way to export forwardRef component with TypeScript
const TaskDiscussionBoard = forwardRef(TaskDiscussionBoardBase);
export default TaskDiscussionBoard;
