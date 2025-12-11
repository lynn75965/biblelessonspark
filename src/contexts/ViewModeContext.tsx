import React, { createContext, useContext, useState, ReactNode } from 'react';

// View modes aligned with accessControl.ts roles
export type ViewMode = 'admin' | 'orgLeader' | 'personal';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isSimulatedView: boolean;
  viewModeLabel: string;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  admin: 'Admin View',
  orgLeader: 'Org Leader View',
  personal: 'Personal Workspace'
};

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const stored = sessionStorage.getItem('adminViewMode');
    return (stored as ViewMode) || 'admin';
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    sessionStorage.setItem('adminViewMode', mode);
  };

  const value: ViewModeContextType = {
    viewMode,
    setViewMode,
    isSimulatedView: viewMode !== 'admin',
    viewModeLabel: VIEW_MODE_LABELS[viewMode]
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}

export function useEffectiveRole(actualIsAdmin: boolean) {
  const { viewMode } = useViewMode();
  
  if (!actualIsAdmin) {
    return {
      showAdminFeatures: false,
      showOrgLeaderFeatures: false,
      effectiveRole: 'teacher' as const
    };
  }
  
  switch (viewMode) {
    case 'admin':
      return {
        showAdminFeatures: true,
        showOrgLeaderFeatures: true,
        effectiveRole: 'admin' as const
      };
    case 'orgLeader':
      return {
        showAdminFeatures: false,
        showOrgLeaderFeatures: true,
        effectiveRole: 'orgLeader' as const
      };
    case 'personal':
      return {
        showAdminFeatures: false,
        showOrgLeaderFeatures: false,
        effectiveRole: 'teacher' as const
      };
  }
}