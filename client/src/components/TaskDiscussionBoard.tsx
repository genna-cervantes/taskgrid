import { SendHorizonal } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { trpc } from "../utils/trpc";

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

const TaskDiscussionBoard = ({
  taskId,
  user,
}: {
  taskId: string;
  user: string;
}) => {
  const utils = trpc.useUtils();

  const [insertComment, setInsertComment] = useState("");

  const { data, isLoading: commentsIsLoading } =
    trpc.getCommentsByTask.useQuery({ taskId });

  console.log(data);

  const comments = data?.map((c) => ({
    ...c,
    createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : null,
  }));

  const addComment = trpc.addComment.useMutation({
    onSuccess: () => {
      utils.getCommentsByTask.invalidate({ taskId });
    },
  });

  console.log(comments);

  return (
    <div className="w-1/2 flex flex-col h-full max-h-full">
      <h1 className="text-sm">Discussion:</h1>
      <div className="flex flex-col flex-1 h-full min-h-0 justify-between gap-y-6">
        <div className="flex-1 overflow-y-auto min-h-0 max-h-full mt-2 scrollbar-none">
          {commentsIsLoading && (
            <p className="text-sm text-midWhite">Comments are loading...</p>
          )}
          <div className="flex flex-col gap-y-2">
            {!commentsIsLoading &&
            Array.isArray(comments) &&
            comments.length > 0
              ? comments.map((c) => (
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
              : !commentsIsLoading && (
                  <p className="text-sm text-midWhite">No comments yet...</p>
                )}
          </div>
        </div>
        <div>
          <span className="flex justify-between items-center gap-x-2">
            <textarea
              value={insertComment}
              onChange={(e) => setInsertComment(e.target.value)}
              className="w-full h-12 px-2 py-1 border border-midWhite rounded-md text-sm"
              placeholder="Join the discussion"
            />
            <button
              type="button"
              className="text-midWhite hover:text-white"
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

export default TaskDiscussionBoard;
