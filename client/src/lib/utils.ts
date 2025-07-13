import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const pickRandomColor = (taskCategoryOptions: {color: string, category: string}[]) => {
  const colors = ['red', 'orange', 'lime', 'yellow', 'green', 'teal', 'blue', 'indigo', 'purple', 'pink', 'rose'];
  const usedColors = taskCategoryOptions.map((o) => o.color);
  const availColors = colors.filter((c) => !usedColors.includes(c));

  return availColors[Math.floor(Math.random() * availColors.length)]
}

export const taskCategoryOptionsAreEqual = (a: any, b: any) => {
  if (a == null && b == null) return false;
  if (a?.length ?? 0 !== b?.length ?? 0) return false;
  return a.every((item: any, idx: any) => 
    item.category === b[idx].category && item.color === b[idx].color
  );
};

