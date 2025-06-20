const TaskImageModal = ({
  url,
  index,
  setDisplayImage,
  handleDelete,
}: {
  url: string;
  index: number;
  setDisplayImage: (s: boolean) => void;
  handleDelete:
    | ((url: string, index: number) => void)
    | ((url: string) => void);
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setDisplayImage(false)}
    >
      <div
        className="dark:bg-light dark:border-faintWhite/5 border-[1px] bg-lmLightBackground rounded-lg shadow-xl p-4 md:p-6 w-[90%] md:max-w-2xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <div className="md:h-[26rem] flex justify-center">
            <img src={url} alt="Task Image" className="object-contain h-full w-auto" />
        </div>
        <div className="flex gap-x-2">
          <button
            onClick={() => setDisplayImage(false)}
            className="bg-midWhite w-full text-white text-sm py-[0.35rem] font-semibold rounded-md cursor-pointer disabled:cursor-not-allowed"
          >
            Close
          </button>
          <button
            onClick={() => {
              handleDelete(url, index);
              setDisplayImage(false);
            }}
            className="bg-red-400 w-full text-white text-sm py-[0.35rem] font-semibold rounded-md cursor-pointer disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskImageModal;
