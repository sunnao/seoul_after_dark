import { CreatePlaceInfo } from '@/features/map/components/EditPlaceModal';
import { MarkerWithData, ViewNightSpot } from '@/features/map/types/mapTypes';
import { createContext, useContext } from 'react';

export interface MapContextType {
  mapInstanceRef: React.RefObject<naver.maps.Map | null>;
  currentMarkerRef: React.RefObject<naver.maps.Marker | null>;
  totalPlaceData: ViewNightSpot[];
  visiblePlacesData: ViewNightSpot[];
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
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  isSearchMode: boolean;
  setIsSearchMode: (isSearchMode: boolean) => void;
  activeFilters: string[];
  setActiveFilters: (filters: string[]) => void;
  markersRef: React.RefObject<MarkerWithData[]>;
  selectedMarkerRef: React.RefObject<MarkerWithData | null>;
  selectedInfoWindowRef: React.RefObject<naver.maps.InfoWindow | null>;
  resetSelectedMarkerAndInfoWindow: () => void;
  openInfoWindowForPlace: () => void;
  handlePlaceSelect: (place: ViewNightSpot | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isSidebarOpen: boolean) => void;
  selectedPlace: ViewNightSpot | null;
  setSelectedPlace: (place: ViewNightSpot | null) => void;
  isLocating: boolean;
  getCurrentLocation: () => void;
  currentLocation: naver.maps.LatLngObjectLiteral | null;
  defaultCenterRef: React.RefObject<naver.maps.LatLngObjectLiteral>;
  isInitialSearchFitRef: React.RefObject<boolean>;
  modalOpen: boolean;
  setModalOpen: (modalOpen: boolean) => void;
  modalMode: 'create' | 'update';
  setModalMode: (modalMode: 'create' | 'update') => void;
  createPlaceInfo: CreatePlaceInfo | null;
  setCreatePlaceInfo: (createPlaceInfo: CreatePlaceInfo | null) => void;
}

export const MapContext = createContext<MapContextType | null>(null);

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};
