import { createContext } from 'react';

// 폴리라인 경로 타입
export interface PathPoint {
  lat: number;
  lng: number;
}

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
	},
	guide: Array<{
		distance: number;
		duration: number;
		pointIndex: number;
		type: number;
	}>;
}

export interface MapContextType {
  // 길찾기 관련 상태
  directionResult: DirectionPathResponse | null;
  isShowingPath: boolean;
  startEndPoint: StartEndPoint | null;

  // 길찾기 관련 함수
  showPath: (directionResult: DirectionPathResponse) => void;
  clearPath: () => void;
  setStartEndPoint: (startEndPoint: StartEndPoint) => void;
}

export const MapContext = createContext<MapContextType | null>(null);
