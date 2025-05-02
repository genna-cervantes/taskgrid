import React, { createContext, useContext, useState } from 'react';

export const ActionContext = createContext<{ action: string|undefined, setAction: (action: string|undefined) => void } | undefined>(undefined);

export const ActionProvider = ({ children }: { children: React.ReactNode }) => {
    const [action, setAction] = useState<string|undefined>(undefined);
  
    return (
      <ActionContext.Provider value={{ action, setAction }}>
        {children}
      </ActionContext.Provider>
    );
  };
  