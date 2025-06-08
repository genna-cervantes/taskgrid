import React, { createContext, useState } from 'react';
import { Task } from '../../../server/src/shared/types';

export const RecentTaskContext = createContext<{ tasks: Task[]|undefined, setTasks: (task: Task[]|undefined) => void } | undefined>(undefined);

export const RecentTaskProvider = ({ children }: { children: React.ReactNode }) => {
    const [tasks, setTasks] = useState<Task[]|undefined>(undefined);
  
    return (
      <RecentTaskContext.Provider value={{ tasks, setTasks }}>
        {children}
      </RecentTaskContext.Provider>
    );
  };
  