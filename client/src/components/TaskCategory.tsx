import { cn } from "@/utils/utils";

const TaskCategory = ({ category, taskCategoryOptions, className }: { category: string|undefined, taskCategoryOptions: {
    category: string;
    color: string;
}[] | undefined, className?: string }) => {

  let bg = taskCategoryOptions?.find((c) => c.category === category)?.color ?? 'gray'
  
  return (
    category && (
    <span className={cn(`text-xxs rounded-md flex gap-x-1 border px-1 border-faintWhite items-center`, className)}>
      <span className={`bg-${bg}-300/50 h-2 w-2 rounded-full`}></span>
      {category}
    </span>
    )
  );
};

export default TaskCategory;
