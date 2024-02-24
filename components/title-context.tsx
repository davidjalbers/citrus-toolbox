import React, { createContext, useContext, useState } from 'react';

interface TitleContextProps {
  title: string;
  setTitle: (route: string) => void;
}
const TitleContext = createContext<TitleContextProps | undefined>(undefined);

interface TitleProviderProps {
  children: React.ReactNode;
}
export const TitleProvider: React.FC<TitleProviderProps> = ({ children }) => {
  const [route, setRoute] = useState('');

  return <TitleContext.Provider value={{ title: route, setTitle: setRoute }}>{children}</TitleContext.Provider>;
};

export const useTitleContext = (): TitleContextProps => {
  const context = useContext(TitleContext);

  if (!context) {
    throw new Error('useTitleContext must be used within a TitleProvider');
  }

  return context;
};
