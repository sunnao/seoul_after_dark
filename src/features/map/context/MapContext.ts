import { MarkerWithData, ViewNightSpot } from '@/features/map/types/mapTypes';
import { createContext, useContext } from 'react';

export interface MapContextType {
  mapInstanceRef: React.RefObject<naver.maps.Map | null>;
  currentMarkerRef: React.RefObject<naver.maps.Marker | null>;
  totalPlaceData: ViewNightSpot[];
  visiblePlacesData: ViewNightSpot[];
  setVisiblePlacesData: (places: ViewNightSpot[]) => void;
  isLoadingPlaces: boolean;
  isFavoriteMode: boolean;
	setIsFavoriteMode: (isFavoriteMode: boolean) => void;
  createMarkerIcon: (
    place: ViewNightSpot,
    isSelected?: boolean,
  ) => {
    content: string;
    anchor: naver.maps.Point;
  } | null;
  isNaverReady: boolean;
  isScriptLoading: boolean;
  scriptError: ErrorEvent | null;
	updateVisibleMarkers: () => void;
	filterPlaces: (places: ViewNightSpot[]) => ViewNightSpot[];
	fitMapToMarkers: (places: ViewNightSpot[]) => void;
	searchKeyword: string;
	setSearchKeyword: (keyword: string) => void;
	isSearchMode: boolean;
	setIsSearchMode: (isSearchMode: boolean) => void;
	activeFilters: string[];
	setActiveFilters: (filters: string[]) => void;
	markersRef: React.RefObject<MarkerWithData[]>;
	selectedInfoWindowRef: React.RefObject<naver.maps.InfoWindow | null>;
	selectedMarkerRef: React.RefObject<MarkerWithData | null>;
}

export const MapContext = createContext<MapContextType | null>(null);

export const useMapContext = () => {
	const context = useContext(MapContext);
	if (!context) {
		throw new Error('useMapContext must be used within a MapProvider');
	}
	return context;
};
