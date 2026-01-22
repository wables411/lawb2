import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChessPieceSet, getDefaultPieceSet } from '../config/chessPieceSets';

interface ChessPieceSetContextType {
  currentPieceSet: ChessPieceSet;
  setCurrentPieceSet: (pieceSet: ChessPieceSet) => void;
}

const ChessPieceSetContext = createContext<ChessPieceSetContextType | undefined>(undefined);

export const ChessPieceSetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPieceSet, setCurrentPieceSet] = useState<ChessPieceSet>(getDefaultPieceSet());

  return (
    <ChessPieceSetContext.Provider value={{ currentPieceSet, setCurrentPieceSet }}>
      {children}
    </ChessPieceSetContext.Provider>
  );
};

export const useChessPieceSet = (): ChessPieceSetContextType => {
  const context = useContext(ChessPieceSetContext);
  if (!context) {
    // Return default if context is not available (for backwards compatibility)
    return {
      currentPieceSet: getDefaultPieceSet(),
      setCurrentPieceSet: () => {}
    };
  }
  return context;
};
