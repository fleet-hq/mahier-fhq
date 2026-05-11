'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface MobilePanelContextType {
  isMobilePanelOpen: boolean;
  setIsMobilePanelOpen: (open: boolean) => void;
}

const MobilePanelContext = createContext<MobilePanelContextType | undefined>(undefined);

export function MobilePanelProvider({ children }: { children: ReactNode }) {
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  return (
    <MobilePanelContext.Provider value={{ isMobilePanelOpen, setIsMobilePanelOpen }}>
      {children}
    </MobilePanelContext.Provider>
  );
}

export function useMobilePanel() {
  const context = useContext(MobilePanelContext);
  if (context === undefined) {
    throw new Error('useMobilePanel must be used within a MobilePanelProvider');
  }
  return context;
}
