import { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";


const QuillEditor = ({description, setDescription}: {description: string|undefined, setDescription: React.Dispatch<React.SetStateAction<string | undefined>>}) => {

  let modules = {
    toolbar: [
      ["bold", "italic", "underline", "strike", "blockquote"],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["link", "image"],
      ["clean"],
    ],
  };

  let formats = [
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
  ];

  return (
    <ReactQuill
      theme="snow"
      value={description}
      onChange={setDescription}
      placeholder="Write description..."
      modules={modules}
      formats={formats}
    />
  );
};

export default QuillEditor;
