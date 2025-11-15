import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  currentView: string;
  navigateTo: (view: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState('dashboard');

  const navigateTo = (view: string) => {
    setCurrentView(view);
    window.history.pushState({}, '', `#${view}`);
  };

  return (
    <NavigationContext.Provider value={{ currentView, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
