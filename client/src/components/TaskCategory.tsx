const TaskCategory = ({ category, taskCategoryOptions }: { category: string, taskCategoryOptions: {
    category: string;
    color: string;
}[] | undefined }) => {

  let bg = taskCategoryOptions?.find((c) => c.category === category)?.color ?? 'gray'
  
  return (
    <span className={`text-xxs rounded-md flex gap-x-1 border px-1 border-faintWhite items-center`}>
      <span className={`bg-${bg}-300/50 h-2 w-2 rounded-full`}></span>
      {category}
    </span>
  );
};

export default TaskCategory;
