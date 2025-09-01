import { Info } from "lucide-react";
import { useState, useEffect, useRef, forwardRef, Ref, useImperativeHandle } from "react";
import { trpc } from "../utils/trpc";
import { useParams } from "react-router-dom";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';

// Mention list component for TipTap
interface MentionListHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const MentionList = forwardRef<MentionListHandle, {
  items: { id: string; display: string }[];
  command: (item: { id: string; label: string }) => void;
}>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const divRef = useRef<HTMLDivElement>(null);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.display });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  // Expose keyboard navigation methods to parent component
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    }
  }));

  return (
    <div
      ref={divRef}
      className="bg-dark border bg-light border-faintWhite/10 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
    >
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            key={item.id}
            className={`block w-full text-left px-3 py-2 text-sm hover:bg-faintWhite/10 ${
              index === selectedIndex ? 'bg-faintWhite/10' : ''
            }`}
            onClick={() => selectItem(index)}
          >
            {item.display}
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-midWhite">No results</div>
      )}
    </div>
  );
});

// Function to convert mentions for database storage (with full format)
const convertMentionsForStorage = (htmlContent: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Find all mention spans
  const mentions = doc.querySelectorAll('span.mention[data-username][data-label]');
  
  mentions.forEach((mention) => {
    const username = mention.getAttribute('data-username');
    const displayName = mention.getAttribute('data-label');
    
    if (username && displayName) {
      // Replace the mention content with the full format for storage
      mention.textContent = `@${username}['${displayName}']`;
    }
  });
  
  return doc.body.innerHTML;
};

// Function to parse mentions in HTML and convert them to display format
const parseMentionsForDisplay = (htmlContent: string) => {
  // Parse the HTML content and replace mention spans with clickable elements
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Find all mention spans
  const mentions = doc.querySelectorAll('span.mention[data-username][data-label]');
  
  mentions.forEach((mention) => {
    const username = mention.getAttribute('data-username');
    const displayName = mention.getAttribute('data-label');
    
    if (username && displayName) {
      // Create a clickable mention element showing just @username
      const clickableMention = doc.createElement('span');
      clickableMention.className = 'mention cursor-pointer hover:bg-purple-300/40';
      clickableMention.textContent = `@${displayName}`;
      clickableMention.setAttribute('data-username', username);
      clickableMention.setAttribute('data-label', displayName);
      
      // Replace the original mention
      mention.parentNode?.replaceChild(clickableMention, mention);
    }
  });
  
  // Also handle plain text mentions that might be in old comments with format @801['Genna Cervantes']
  let content = doc.body.innerHTML;
  content = content.replace(/@(\w+)\['([^']+)'\]/g, (_, username, displayName) => {
    return `<span class="mention cursor-pointer hover:bg-purple-300/40" data-username="${username}" data-label="${displayName}">@${displayName}</span>`;
  });
  
  return content;
};

const Comment = ({ comment }: { comment: string }) => {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (ref.current) {
      setIsTruncated(ref.current.scrollHeight > ref.current.clientHeight + 2);
    }
  }, [comment]);

  // Handle mention clicks
  // const handleMentionClick = (event: React.MouseEvent) => {
  //   const target = event.target as HTMLElement;
  //   if (target.classList.contains('mention')) {
  //     const username = target.getAttribute('data-username');
  //     const displayName = target.getAttribute('data-label');
  //     if (username && displayName) {
  //       // navigation to user profile or other actions here
  //       console.log(`Clicked mention: ${displayName} (ID: ${username})`);
  //     }
  //   }
  // };

  // Check if comment is HTML (contains tags) or plain text
  const isHtmlComment = comment.includes('<') && comment.includes('>');
  const processedComment = isHtmlComment ? parseMentionsForDisplay(comment) : comment;

  return (
    <>
      <div
        ref={ref}
        className={`text-sm text-white/80 break-words ${
          expanded ? "" : "line-clamp-2"
        }`}
        style={{ transition: "all 0.2s" }}
      >
        {isHtmlComment ? (
          <div dangerouslySetInnerHTML={{ __html: processedComment }} />
        ) : (
          comment
        )}
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
  _ref: Ref<HTMLTextAreaElement>
) => {
  const { projectId } = useParams();

  const { taskId, user } = props;

  const utils = trpc.useUtils();

  const { data, isLoading: commentsIsLoading } =
    trpc.tasks.getCommentsByTask.useQuery({ taskId });

  const { data: usersInProj } = trpc.users.getUsersInProject.useQuery(
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
      editor?.commands.clearContent();
    },
  });

  // Create TipTap editor with mention support
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Add a comment... (use @ to mention someone)',
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        renderHTML({ node }) {
          return [
            'span',
            {
              class: 'mention',
              'data-type': 'mention',
              'data-username': node.attrs.username,
              'data-label': node.attrs.label,
            },
            `@${node.attrs.label}`,
          ];
        },
        suggestion: {
          items: ({ query }: { query: string }) => {
            const users = usersInProj?.map((user) => ({ username: user.username, display: user.username })) ?? [];
            return users
              .filter(item => item.display.toLowerCase().startsWith(query.toLowerCase()))
              .slice(0, 5);
          },
          render: () => {
            let component: ReactRenderer | null = null;
            let popup: any[] | null = null;

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },

              onUpdate(props: any) {
                if (!component) return;
                
                component.updateProps(props);

                if (!props.clientRect || !popup) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: any) {
                if (props.event.key === 'Enter') props.event.preventDefault();
                if (props.event.key === 'Escape') {
                  if (popup && popup[0]) {
                    popup[0].hide();
                  }
                  return true;
                }

                return (component?.ref as any)?.onKeyDown?.(props);
              },

              onExit() {
                // Clean up popup first
                if (popup && popup[0]) {
                  try {
                    popup[0].destroy();
                  } catch (error) {
                    // Tippy instance might already be destroyed, ignore the error
                    console.debug('Tippy instance already destroyed');
                  }
                  popup = null;
                }
                
                // Clean up component
                if (component) {
                  try {
                    component.destroy();
                  } catch (error) {
                    // Component might already be destroyed, ignore the error
                    console.debug('ReactRenderer component already destroyed');
                  }
                  component = null;
                }
              },
            };
          },
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'w-full min-h-14 px-2 py-1 border border-faintWhite/10 rounded-lg text-sm focus:outline-none focus:ring-0 prose prose-sm prose-invert max-w-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-10',
      },
    },
    onUpdate: () => {
      // Optional: handle content changes if needed
    },
  });

  // Handle Enter key to submit comment
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        
        if (!projectId || !user) return;

        const content = editor.getHTML().trim();
        if (content.length > 0 && content !== '<p></p>') {
          // Convert mentions to storage format before saving
          const storageContent = convertMentionsForStorage(content);
          addComment.mutate({
            taskId,
            projectId,
            comment: storageContent,
            commentBy: user,
          });
        }
      }
    };

    editor.view.dom.addEventListener('keydown', handleKeyDown);
    return () => {
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, taskId, projectId, user, addComment]);

  // Cleanup editor on component unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);


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
        <div className="w-full">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

// ✅ Correct way to export forwardRef component with TypeScript
const TaskDiscussionBoard = forwardRef(TaskDiscussionBoardBase);
export default TaskDiscussionBoard;
