import { clsx } from 'clsx';
import { ColumnKey, Columns, Task } from '../../../server/src/shared/types';

export function cn(...inputs: Parameters<typeof clsx>) {
  return clsx(...inputs);
}

export const groupTasksByColumn = (taskList: Task[]) => {
  const grouped: Columns = {
    backlog: [],
    "in progress": [],
    "for checking": [],
    done: [],
  };

  taskList.forEach((t) => {
    const key = t.progress as ColumnKey;
    grouped[key].push(t);
  });

  return grouped;
};