import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { MapContext, useMapDirectionContext } from '@/features/map/context';
import { ApiResponse, MarkerWithData, ViewNightSpot } from '@/features/map/types/mapTypes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNaverObjInitialization } from '@features/map/hooks/useNaverObjInitialization';
import { renderToString } from 'react-dom/server';
import { HiStar } from 'react-icons/hi2';
import { SUBJECTS } from '@/features/map/constants/subjects';
import { useScript } from '@/hooks/useScript';
import { useCurrentLocation } from '@/features/map/hooks/useCurrentLocation';

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, authLoading } = useAuth();
  const { isShowingPath, setStartEndPoint } = useMapDirectionContext();

  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const currentMarkerRef = useRef<naver.maps.Marker | null>(null);

  // 장소 데이터 상태
  const [totalPlaceData, setTotalPlaceData] = useState<ViewNightSpot[]>([]);
  const [visiblePlacesData, setVisiblePlacesData] = useState<ViewNightSpot[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);

  // 마커 관련 참조
  const markersRef = useRef<MarkerWithData[]>([]);
  const selectedInfoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const selectedMarkerRef = useRef<MarkerWithData | null>(null);

  // UI 상태
  const [selectedPlace, setSelectedPlace] = useState<ViewNightSpot | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isFavoriteMode, setIsFavoriteMode] = useState<boolean>(false);

  // 검색 관련 상태
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);

  // 필터 상태
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // 지도 이동 관련 상태
  const isInitialSearchFit = useRef<boolean>(false);
  const previousZoomRef = useRef<number | null>(null);
  const previousCenterRef = useRef<naver.maps.CoordLiteral | null>(null);

  // 기본 중심 좌표 (서울시청)
  const defaultCenter = useRef<naver.maps.LatLngObjectLiteral>({
    lat: 37.5666103,
    lng: 126.9783882,
  });

  // 네이버 지도 스크립트 로드
  const [isScriptLoading, scriptError] = useScript(
    `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${
      import.meta.env.VITE_NAVER_MAP_API_KEY
    }`,
  );

  // 네이버 객체 초기화
  const { isNaverReady } = useNaverObjInitialization(isScriptLoading, scriptError);

  // 현위치 불러오기
  const { currentLocation } = useCurrentLocation();

  // 전체 장소 정보 가져오기 (API 호출)
  const fetchViewNightSpotData = useCallback(async () => {
    setIsLoadingPlaces(true);

    try {
      const url = `/api/${import.meta.env.VITE_SEOUL_API_KEY}/json/viewNightSpot/1/1000`;
      const result = await axios.get<ApiResponse>(url);

      if (result.data.viewNightSpot.RESULT.CODE === 'INFO-000') {
        const places = result.data.viewNightSpot.row;
        const placesAddIdAndFavorite = places.map((place) => ({
          ...place,
          ID: `${place.LA}_${place.LO}`,
          IS_FAVORITE: (user?.favoritePlaceIds || []).includes(`${place.LA}_${place.LO}`),
        }));

        setTotalPlaceData(placesAddIdAndFavorite);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPlaces(false);
    }
  }, [user]);

  // 마커 아이콘 생성 함수
  const createMarkerIcon = useCallback(
    (place: ViewNightSpot, isSelected: boolean = false) => {
      if (!isNaverReady || !window.naver) return null;

      const { naver } = window;
      const { IS_FAVORITE: isFavoritePlace, SUBJECT_CD: subject } = place;

      const getMarkerStyle = () => {
        switch (subject) {
          case '문화/체육':
            return { bgColor: 'bg-purple-800' };
          case '공원/광장':
            return { bgColor: 'bg-green-800' };
          case '공공시설':
            return { bgColor: 'bg-blue-800' };
          case '가로/마을':
            return {
              bgColor: 'bg-amber-700',
              iconStyle: `${isSelected ? 'h-7 w-7' : 'h-5 w-5'} invert-[1]`,
            };
          case '기타':
            return { bgColor: 'bg-sky-800' };
          default:
            return { bgColor: '' };
        }
      };

      const currentSubjectForMarker = {
        ...SUBJECTS.find((ele) => ele.id === subject),
        ...getMarkerStyle(),
      };

      const size = isSelected ? 'h-10 w-10' : 'h-7 w-7';
      const iconSize = isSelected ? 'text-[30px]' : 'text-[20px]';
      const selectedBorder = isSelected ? 'ring-2 ring-white' : '';

      const subjectIcon = renderToString(
        <div
          className={`flex ${size} ${selectedBorder} ${currentSubjectForMarker.bgColor} items-center justify-center rounded-full border border-neutral-300 shadow-lg`}
        >
          <span
            className={`${iconSize} ${subject == '가로/마을' && currentSubjectForMarker.iconStyle} text-white`}
          >
            {currentSubjectForMarker.icon}
          </span>
        </div>,
      );
      const favoriteIcon = renderToString(
        <div
          className={`flex ${size} ${selectedBorder} items-center justify-center rounded-full border border-neutral-300 bg-amber-400 shadow-lg`}
        >
          <HiStar className={`${iconSize} text-white`} />
        </div>,
      );

      return {
        content: isFavoritePlace ? favoriteIcon : subjectIcon,
        anchor: new naver.maps.Point(isSelected ? 24 : 20, isSelected ? 24 : 20),
      };
    },
    [isNaverReady],
  );

  // 통합 필터링 함수 - 검색어와 카테고리 필터 적용
  const filterPlaces = useCallback(() => {
    let filtered = [...totalPlaceData];

    // 카테고리 필터 적용
    filtered = filtered.filter((place) => activeFilters.includes(place.SUBJECT_CD));

    // 검색어 필터 적용
    if (searchKeyword && isSearchMode) {
      filtered = filtered.filter(
        (place) => place.TITLE.includes(searchKeyword) || place.ADDR.includes(searchKeyword),
      );
    }

    return filtered;
  }, [totalPlaceData, activeFilters, searchKeyword, isSearchMode]);

  const fitMapToMarkers = useCallback(
    (places: ViewNightSpot[]) => {
      console.log('fitMapToMarkers', places);

      if (
        !mapInstanceRef.current ||
        !isNaverReady ||
        places.length === 0 ||
        isInitialSearchFit.current
      )
        return;

      const { naver } = window;

      const bounds = new naver.maps.LatLngBounds(
        new naver.maps.LatLng(Number(places[0].LA), Number(places[0].LO)),
        new naver.maps.LatLng(Number(places[0].LA), Number(places[0].LO)),
      );

      places.map((place) => {
        const position = new naver.maps.LatLng(Number(place.LA), Number(place.LO));
        bounds.extend(position);
      });

      console.log('fitMapToMarkers~~~~~~~~~~');

      mapInstanceRef.current.panToBounds(
        bounds,
        { duration: 200, easing: 'easeOutCubic' },
        { top: 100, right: 50, bottom: 100, left: 50 },
      );
      isInitialSearchFit.current = true;
    },
    [isNaverReady],
  );

  const updateVisibleMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady) return;

    const filtered = filterPlaces();
    const visiblePlaces: ViewNightSpot[] = [];

    if (isSearchMode) {
      // 검색 모드일 때는 필터링된 모든 마커 표시
      markersRef.current.forEach(({ marker, placeData }) => {
        const isPassFavorite = isFavoriteMode ? placeData.IS_FAVORITE : true;

        const shouldShow = filtered.some((place) => place.ID === placeData.ID) && isPassFavorite;

        marker.setMap(shouldShow ? mapInstanceRef.current : null);

        if (shouldShow) {
          visiblePlaces.push(placeData);
        }
      });

      // 검색 결과가 보이도록 범위 조정
      if (filtered.length > 0) {
        fitMapToMarkers(filtered);
      }
    } else if (isShowingPath) {
      markersRef.current.forEach(({ marker, placeData }) => {
        const isSelectedMarker = selectedMarkerRef.current?.placeData.ID === placeData.ID;
        marker.setMap(isSelectedMarker ? mapInstanceRef.current : null);

        if (isSelectedMarker) {
          visiblePlaces.push(placeData);
        }
      });
    } else {
      // 일반 모드일 때는 지도 영역 내 마커만 표시
      const mapBounds = mapInstanceRef.current.getBounds();

      markersRef.current.forEach(({ marker, placeData }) => {
        const isInBounds = mapBounds.hasPoint(marker.getPosition());
        const isPassFilter = filtered.some((place) => place.ID === placeData.ID);
        const isPassFavorite = isFavoriteMode ? placeData.IS_FAVORITE : true;

        const shouldShow = isInBounds && isPassFilter && isPassFavorite;
        marker.setMap(shouldShow ? mapInstanceRef.current : null);

        if (shouldShow) {
          visiblePlaces.push(placeData);
        }
      });
    }

    if (selectedMarkerRef.current) {
      const { marker, placeData } = selectedMarkerRef.current;
      if (isFavoriteMode) {
        if (selectedInfoWindowRef.current && !placeData.IS_FAVORITE) {
          selectedInfoWindowRef.current.close();
          selectedInfoWindowRef.current = null;
        }
      } else {
        // 선택된 마커가 있으면 항상 보이게 처리
        marker.setMap(mapInstanceRef.current);

        // 선택된 장소가 목록에 없으면 추가
        if (!visiblePlaces.some((place) => place.ID === placeData.ID)) {
          visiblePlaces.push(placeData);
        }
      }
    }

    setVisiblePlacesData(visiblePlaces);
  }, [isShowingPath, isNaverReady, filterPlaces, isSearchMode, isFavoriteMode, fitMapToMarkers]);

  // 사이드바 열기/닫기 함수
  const openSidebar = useCallback((place: ViewNightSpot | null = null) => {
    setSelectedPlace(place);
    setIsSidebarOpen(true);
  }, []);

  // 선택된 마커와 인포윈도우 초기화
  const resetSelectedMarkerAndInfoWindow = useCallback(() => {
    // 인포윈도우 닫기
    if (selectedInfoWindowRef.current) {
      selectedInfoWindowRef.current.close();
      selectedInfoWindowRef.current = null;
    }

    // 선택된 마커 스타일 초기화
    if (selectedMarkerRef.current) {
      const { marker, placeData } = selectedMarkerRef.current;
      const iconConfig = createMarkerIcon(placeData, false);
      if (iconConfig) {
        marker.setIcon(iconConfig);
      }
      marker.setZIndex(50);

      selectedMarkerRef.current = null;
    }
    setSelectedPlace(null);
  }, [createMarkerIcon]);

  // 선택된 장소에 해당하는 인포윈도우 열기
  const openInfoWindowForPlace = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady || !selectedMarkerRef.current || !window.naver)
      return;

    const { naver } = window;
    const { placeData, marker } = selectedMarkerRef.current;

    // 인포윈도우 내용 생성
    const infoWindowContent = `
      <div id="infoWindow" class="p-2.5 max-w-[250px] text-zinc-900 border-zinc-900 border-1 rounded shadow cursor-pointer">
        <h4 class="font-bold text-sm">${placeData.TITLE}</h4>
      </div>`;

    const infoWindow = new naver.maps.InfoWindow({
      content: infoWindowContent,
      borderWidth: 0,
      disableAnchor: true,
      disableAutoPan: true,
    });

    // 인포윈도우 클릭 이벤트 추가
    setTimeout(() => {
      const infoWindowElement = document.getElementById('infoWindow');
      if (infoWindowElement) {
        infoWindowElement.addEventListener('click', () => handlePlaceSelect(placeData));
      }
    }, 100);

    infoWindow.open(mapInstanceRef.current, marker);
    selectedInfoWindowRef.current = infoWindow;
  }, [isNaverReady]);

  // 선택된 장소로 지도 중심 이동
  const moveMapToPlace = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady || !selectedMarkerRef.current || !window.naver)
      return;

    const { naver } = window;
    const { placeData } = selectedMarkerRef.current;
    const placePosition = new naver.maps.LatLng(Number(placeData.LA), Number(placeData.LO));

    // 현재 중심/줌 저장
    if (!previousZoomRef.current && !previousCenterRef.current) {
      previousZoomRef.current = mapInstanceRef.current.getZoom();
      previousCenterRef.current = mapInstanceRef.current.getCenter();
    }

    mapInstanceRef.current.morph(placePosition, 15, { duration: 200, easing: 'easeOutCubic' });
  }, [isNaverReady]);

  // 장소 선택 핸들러
  const handlePlaceSelect = useCallback(
    (place: ViewNightSpot | null) => {
      if (!mapInstanceRef.current || !isNaverReady) return;

      // 기존 선택 초기화
      resetSelectedMarkerAndInfoWindow();
      setSelectedPlace(place);

      if (place) {
        // 해당 장소의 마커 찾기
        const markerPair = markersRef.current.find((pair) => pair.placeData.ID === place.ID);

        if (markerPair) {
          selectedMarkerRef.current = markerPair;

          // 마커 스타일 업데이트
          const iconConfig = createMarkerIcon(markerPair.placeData, true);
          if (iconConfig) {
            markerPair.marker.setIcon(iconConfig);
          }
          markerPair.marker.setZIndex(1000);

          setStartEndPoint({
            start: currentLocation || defaultCenter.current,
            end: { lat: Number(place.LA), lng: Number(place.LO) },
          });

          // 지도 중심 이동 및 사이드바 열기
          moveMapToPlace();
          openSidebar(place);

          // 인포윈도우 열기
          openInfoWindowForPlace();
        }
      } else {
        // 장소 선택 해제 시 이전 위치로 복귀
        if (previousCenterRef.current && previousZoomRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.morph(previousCenterRef.current, previousZoomRef.current, {
            duration: 200,
            easing: 'easeOutCubic',
          });

          previousCenterRef.current = null;
          previousZoomRef.current = null;
        }
      }
    },
    [
      isNaverReady,
      resetSelectedMarkerAndInfoWindow,
      createMarkerIcon,
      moveMapToPlace,
      openSidebar,
      openInfoWindowForPlace,
      currentLocation,
      setStartEndPoint,
    ],
  );

  // 사용자 정보가 변경될 때 즐겨찾기 상태 업데이트
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setIsFavoriteMode(false);
      return;
    }

    setTotalPlaceData((prevData: ViewNightSpot[]) =>
      prevData.map((place) => ({
        ...place,
        IS_FAVORITE: (user.favoritePlaceIds || []).includes(place.ID),
      })),
    );
  }, [user, authLoading]);

  useEffect(() => {
    // 인증 로딩이 완료된 경우에만 데이터 로드
    if (!authLoading) {
      fetchViewNightSpotData();
    }
  }, [authLoading, fetchViewNightSpotData]);

  const value = {
    mapInstanceRef,
    currentMarkerRef,
    totalPlaceData,
		visiblePlacesData,
    isLoadingPlaces,
    isFavoriteMode,
		setIsFavoriteMode,
    createMarkerIcon,
    isNaverReady,
    isScriptLoading,
    scriptError,
    updateVisibleMarkers,
    searchKeyword,
    setSearchKeyword,
    isSearchMode,
    setIsSearchMode,
    activeFilters,
    setActiveFilters,
    markersRef,
    selectedMarkerRef,
    resetSelectedMarkerAndInfoWindow,
    openInfoWindowForPlace,
    handlePlaceSelect,
    isSidebarOpen,
    setIsSidebarOpen,
    selectedPlace,
    setSelectedPlace,
    currentLocation,
    defaultCenter,
    isInitialSearchFit,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};
