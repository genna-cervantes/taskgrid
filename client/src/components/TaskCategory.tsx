const TaskCategory = ({ category }: { category: string }) => {
  let bg = "";
  if (category === "feature") {
    bg = "bg-purple-400/25";
  } else if (category === "bug") {
    bg = "bg-red-400/25";
  } else if (category === "refactor") {
    bg = "bg-orange-400/25";
  } else {
    return <></>;
  }

  return (
    <span className={`${bg} text-xxs px-2 rounded-md flex items-center`}>
      {category}
    </span>
  );
};

export default TaskCategory;
