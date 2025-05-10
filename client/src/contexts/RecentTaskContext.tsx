import React, { createContext, useContext, useState } from 'react';
import { Task } from '../../../server/src/shared/types';

export const RecentTaskContext = createContext<{ task: Task|undefined, setTask: (task: Task|undefined) => void } | undefined>(undefined);

export const RecentTaskProvider = ({ children }: { children: React.ReactNode }) => {
    const [task, setTask] = useState<Task|undefined>(undefined);
  
    return (
      <RecentTaskContext.Provider value={{ task, setTask }}>
        {children}
      </RecentTaskContext.Provider>
    );
  };
  