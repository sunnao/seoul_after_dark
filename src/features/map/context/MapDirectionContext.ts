import { createContext, useContext } from 'react';

// 폴리라인 경로 타입
export interface StartEndPoint {
  start: naver.maps.LatLngObjectLiteral;
  end: naver.maps.LatLngObjectLiteral;
}

export interface DirectionPathResponse {
  path: number[][];
  summary: {
    distance: number;
    duration: number;
    departureTime: string;
  };
  guide: Array<{
    distance: number;
    duration: number;
    pointIndex: number;
    instructions: string;
    type: number;
  }>;
}

export interface MapDirectionContextType {
  // 길찾기 관련 상태
  directionResult: DirectionPathResponse | null;
  isShowingPath: boolean;
  startEndPoint: StartEndPoint | null;
  pathPointIndex: number | null;

  // 길찾기 관련 함수
  showPath: (directionResult: DirectionPathResponse) => void;
  clearPath: () => void;
  setStartEndPoint: (startEndPoint: StartEndPoint) => void;
  setPathPointIndex: (pointIndex: number) => void;
}

export const MapDirectionContext = createContext<MapDirectionContextType | null>(null);

export const useMapDirectionContext = () => {
  const context = useContext(MapDirectionContext);
  if (!context) {
    throw new Error('useMapDirectionContext must be used within a MapDirectionProvider');
  }
  return context;
};
