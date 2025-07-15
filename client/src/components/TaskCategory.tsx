const TaskCategory = ({ category, taskCategoryOptions }: { category: string, taskCategoryOptions: {
    category: string;
    color: string;
}[] | undefined }) => {

  let bg = taskCategoryOptions?.find((c) => c.category === category)?.color ?? 'gray'
  
  return (
    <span className={`bg-${bg}-200/50 text-xxs px-2 rounded-md flex items-center`}>
      {category}
    </span>
  );
};

export default TaskCategory;
