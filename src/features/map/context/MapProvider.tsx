import React, { useState } from 'react';
import {
	DirectionPathResponse,
  MapContext,
  MapContextType,
  StartEndPoint,
} from '@/features/map/context/MapContext';

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [directionResult, setDirectionResult] = useState<DirectionPathResponse | null>(null);
  const [isShowingPath, setIsShowingPath] = useState<boolean>(false);
  const [startEndPoint, setStartEndPoint] = useState<StartEndPoint | null>(null);

  const showPath = (result: DirectionPathResponse) => {
    setDirectionResult(result);
    setIsShowingPath(true);
  };

  const clearPath = () => {
    setDirectionResult(null);
    setIsShowingPath(false);
  };
	

  const value: MapContextType = {
		directionResult,
    isShowingPath,
    startEndPoint,
    showPath,
    clearPath,
    setStartEndPoint,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};
