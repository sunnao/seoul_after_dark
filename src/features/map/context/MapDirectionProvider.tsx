import { useState } from 'react';
import {
	DirectionPathResponse,
  MapDirectionContext,
  MapDirectionContextType,
  StartEndPoint,
} from '@/features/map/context/MapDirectionContext';

export const MapDirectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [directionResult, setDirectionResult] = useState<DirectionPathResponse | null>(null);
  const [isShowingPath, setIsShowingPath] = useState<boolean>(false);
  const [startEndPoint, setStartEndPoint] = useState<StartEndPoint | null>(null);
  const [pathPointIndex, setPathPointIndex] = useState<number | null>(null);

  const showPath = (result: DirectionPathResponse) => {
    setDirectionResult(result);
    setIsShowingPath(true);
  };

  const clearPath = () => {
    setDirectionResult(null);
    setIsShowingPath(false);
  };
	
  const value: MapDirectionContextType = {
    directionResult,
    isShowingPath,
    startEndPoint,
    pathPointIndex,
    showPath,
    clearPath,
    setStartEndPoint,
    setPathPointIndex,
  };

  return <MapDirectionContext.Provider value={value}>{children}</MapDirectionContext.Provider>;
};
