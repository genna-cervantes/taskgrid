import { clsx } from "clsx";
import { Columns, Task } from "../../../server/src/shared/types";

export function cn(...inputs: Parameters<typeof clsx>) {
  return clsx(...inputs);
}

export const groupTasksByColumn = (taskList: Task[], key: string, taskCategoryOptions?: { category: string }[], usersInProject?: { id: string, username: string }[]) => {
  // const grouped: Columns = {
  //   backlog: [],
  //   "in progress": [],
  //   "for checking": [],
  //   done: [],
  // };
  let groupKeys: string[] = []
  if (key !== "progress" && key !== "priority" && key !== "category" && key !== "assignTo") {
    throw new Error("Invalid key");
  }

  if (key === "progress") {
    groupKeys = ["backlog", "in progress", "for checking", "done"];
  } else if (key === "priority") {
    groupKeys = ["low", "medium", "high"];
  } else if (key === "category" && taskCategoryOptions) {
    groupKeys = taskCategoryOptions.map((t) => t.category);
  } else if (key === "assignTo" && usersInProject) {
    groupKeys = usersInProject.map((u) => u.username);
  }

  const grouped: Columns = {};
  groupKeys.forEach((key) => {
    grouped[key] = [];
  })

  taskList.forEach((t) => {
    const keyValue = t[key as keyof Task] as string | string[];
    
    if (Array.isArray(keyValue)) {
      if (keyValue.length === 0) {
        if (!grouped['undefined']) {
          grouped['undefined'] = [];
        }
        grouped['undefined'].push(t);
      }

      keyValue.forEach((k) => {
        if (!grouped[k]) {
          grouped[k] = [];
        }
        grouped[k].push(t);
      })
      return;
    }

    if (!grouped[keyValue]) {
      console.log('key value', keyValue)
      grouped[keyValue] = [];
    }

    grouped[keyValue].push(t);
  });

  return grouped;
};

export const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
