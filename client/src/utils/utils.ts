import { clsx } from 'clsx';
import { ColumnKey, Columns } from '../../../server/src/shared/types';
import { Task } from '../../../server/src/schemas/schemas';

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