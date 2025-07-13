import { Expand, Maximize2, SendHorizonal, SquareArrowOutUpRight, SquareArrowUpRight } from "lucide-react";
import { useState, useEffect, useRef, forwardRef, Ref } from "react";
import { trpc } from "../utils/trpc";
import { Link } from "react-router-dom";

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
        className={`text-sm text-white break-words ${
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
  user: string;
  isPage?: boolean;
};

const TaskDiscussionBoardBase = (
  props: TaskDiscussionBoardProps,
  ref: Ref<HTMLTextAreaElement>
) => {
  const { taskId, user, isPage = false } = props;
  const [insertComment, setInsertComment] = useState("");

  const utils = trpc.useUtils();

  const { data, isLoading: commentsIsLoading } =
    trpc.getCommentsByTask.useQuery({ taskId });

  const comments = data?.map((c) => ({
    ...c,
    createdAt: c.createdAt
      ? new Date(c.createdAt).toLocaleDateString()
      : null,
  }));

  const addComment = trpc.addComment.useMutation({
    onSuccess: () => {
      utils.getCommentsByTask.invalidate({ taskId });
    },
  });

  return (
    <div className={`${isPage ? "w-full" : "w-1/2"} flex flex-col min-h-0`}>
      <div className="flex justify-between w-full">
        <h1 className="text-sm mb-2">Discussion:</h1>
        {!isPage && (
          <Link to={`tasks/${taskId}`}>
            <SquareArrowOutUpRight className="h-5 w-5 hover:cursor-pointer text-midWhite hover:text-fadedWhite">
              <title>Expand Task</title>
            </SquareArrowOutUpRight>
          </Link>
        )}
      </div>
      <div className="flex flex-col flex-1 min-h-0 justify-between gap-y-6">
        <div
          className={`flex-1 overflow-y-auto ${
            isPage
              ? "min-h-[37rem] max-h-[37rem]"
              : "max-h-[32.5rem] min-h-[32.5rem]"
          } scrollbar-none`}
        >
          {commentsIsLoading && (
            <p className="text-sm text-midWhite">Comments are loading...</p>
          )}
          <div className="flex flex-col gap-y-2">
            {!commentsIsLoading &&
            Array.isArray(comments) &&
            comments.length > 0 ? (
              comments.map((c) => (
                <div
                  key={c.commentId}
                  className="p-2 rounded bg-faintWhite/5"
                >
                  <Comment comment={c.comment} />
                  <div className="flex justify-between w-full items-center mt-2">
                    <div className="text-xs font-semibold text-midWhite">
                      {c.commentBy}
                    </div>
                    <div className="text-xxs text-midWhite">
                      {c.createdAt}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-midWhite">No comments yet...</p>
            )}
          </div>
        </div>
        <div>
          <span className="flex justify-between items-center gap-x-2">
            <textarea
              ref={ref}
              value={insertComment}
              onChange={(e) => setInsertComment(e.target.value)}
              className="w-full h-14 px-2 py-1 border hover:border-midWhite border-faintWhite rounded-lg text-sm placeholder:text-faintWhite focus:outline-none focus:ring-0"
              placeholder="Join the discussion"
            />
            <button
              type="button"
              className="text-midWhite hover:text-white focus:text-white focus:outline-none focus:ring-0 disabled:hover:text-midWhite disabled:hover:cursor-not-allowed"
              onClick={() => {
                if (insertComment.trim().length > 0) {
                  addComment.mutate({
                    taskId,
                    comment: insertComment,
                    commentBy: user,
                  });
                  setInsertComment("");
                }
              }}
              disabled={
                addComment.isLoading || insertComment.trim().length === 0
              }
            >
              <SendHorizonal />
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};

// ✅ Correct way to export forwardRef component with TypeScript
const TaskDiscussionBoard = forwardRef(TaskDiscussionBoardBase);
export default TaskDiscussionBoard;