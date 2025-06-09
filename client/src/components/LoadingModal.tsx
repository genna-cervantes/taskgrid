const LoadingModal = () => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-loader-circle-icon lucide-loader-circle animate-spin"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    </div>
  );
};

export default LoadingModal;
