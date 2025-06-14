import React, { useState } from "react";

const LinkCopiedModal = ({
  setLinkCopiedModal,
}: {
  setLinkCopiedModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = () => {
    setIsLoading(true);
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        console.log("URL copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
    setIsLoading(false);
    setLinkCopied(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setLinkCopiedModal(false)} // Close when clicking backdrop
    >
      <div
        className="dark:bg-light bg-lmLightBackground rounded-lg shadow-xl p-6 w-[90%] md:w-full max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        Share this board with colleagues to track task progress.
        <button
          onClick={handleCopyLink}
          className="bg-green-400 text-sm text-white font-semibold py-2 rounded-md cursor-pointer disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {linkCopied ? (
            !isLoading ? (
              "Link copied to clipboard!"
            ) : (
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
            )
          ) : !isLoading ? (
            "Copy board link to clipboard"
          ) : (
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
          )}
        </button>
      </div>
    </div>
  );
};

export default LinkCopiedModal;
