import React, { useState } from "react";

const LinkCopiedModal = ({
  setLinkCopiedModal,
}: {
  setLinkCopiedModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        console.log("URL copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
    setLinkCopied(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setLinkCopiedModal(false)} // Close when clicking backdrop
    >
      <div
        className="bg-[#464646] rounded-lg shadow-xl p-6 w-full max-w-xl flex flex-col gap-y-4"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        <button
          onClick={handleCopyLink}
          className="bg-green-400 text-sm font-semibold py-2 rounded-md cursor-pointer"
        >
          {linkCopied
            ? "Link copied to clipboard!"
            : "Copy board link to clipboard"}
        </button>
      </div>
    </div>
  );
};

export default LinkCopiedModal;
