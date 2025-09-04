import React, { useState, useCallback, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";


const QuillEditor = ({description, setDescription, isPage = false}: {description: string|undefined, setDescription: React.Dispatch<React.SetStateAction<string | undefined>>, isPage?: boolean}) => {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Use a timeout to check if focus moved to a toolbar element
    setTimeout(() => {
      const activeElement = document.activeElement;
      if (containerRef.current && containerRef.current.contains(activeElement)) {
        // Don't blur if focus is within the Quill container
        return;
      }
      setIsFocused(false);
    }, 0);
  }, []);

  let modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [
        { list: "ordered" },
        { list: "bullet" },
      ],
      ["link", "image"],

      [{ 'header': [1, 2, 3, false] }],

      [{ 'color': [] }, { 'background': [] }],    

      ["clean"],
    ],
  };

  let formats = [
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
    "image",
    "header",
    "color",
    "background",
  ];

  return (
    <div 
      ref={containerRef}
      className={`quill-wrapper ${!isPage ? 'focused' : isFocused ? 'focused' : ''}`}
    >
      <ReactQuill
        onFocus={handleFocus}
        onBlur={handleBlur}
        theme="snow"
        value={description}
        onChange={setDescription}
        placeholder="Write description..."
        modules={modules}
        formats={formats}
      />
    </div>
  );
};

export default QuillEditor;
