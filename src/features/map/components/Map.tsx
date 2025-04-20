import { useEffect, useRef, useState, useCallback } from 'react';
import { useScript } from '@/hooks/useScript';
import axios from 'axios';
import { useNaverObjInitialization } from '@features/map/hooks/useNaverObjInitialization';
import { useCurrentLocation } from '@features/map/hooks/useCurrentLocation';
import { ApiResponse, MarkerWithData, ViewNightSpot } from '@features/map/types/mapTypes';
import { useMapContext } from '@/features/map/context';

import { MdOutlineMyLocation } from 'react-icons/md';
import { ImSpinner2 } from 'react-icons/im';
import { renderToString } from 'react-dom/server';
import { MapSidebar } from '@/features/map/components/MapSidebar';
import { SUBJECTS } from '@/features/map/constants/subjects';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { HiStar } from 'react-icons/hi2';
import { MapControls } from '@/features/map/components/MapControls';
import { FavoriteViewBtn } from '@/features/map/components/FavoriteViewBtn';
import { ListViewBtn } from '@/features/map/components/ListViewBtn';
import { SearchFilterContainer } from '@/features/map/components/SearchFilterContainer';
import { SearchBar } from '@/features/map/components/SearchBar';
import { FilterBar } from '@/features/map/components/FilterBar';

export const Map = () => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const currentMarkerRef = useRef<naver.maps.Marker | null>(null);
  const polylineRef = useRef<naver.maps.Polyline | null>(null);
  const { user, authLoading, logout } = useAuth();

  const { directionResult, isShowingPath, clearPath, setStartEndPoint, pathPointIndex } =
    useMapContext();

  // 장소 데이터 상태
  const [totalPlaceData, setTotalPlaceData] = useState<ViewNightSpot[]>([]);
  const [visiblePlacesData, setVisiblePlacesData] = useState<ViewNightSpot[]>([]); // 지도 영역 내 보이는 데이터
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);

  // 필터 상태
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // 마커 관련 참조
  const markersRef = useRef<MarkerWithData[]>([]);
  const selectedInfoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const selectedMarkerRef = useRef<MarkerWithData | null>(null);

  // UI 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<ViewNightSpot | null>(null);
  const [isFavoriteMode, setIsFavoriteMode] = useState<boolean>(false);

  // 검색 관련 상태
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [autoCompleteItems, setAutoCompleteItems] = useState<ViewNightSpot[]>([]);
  const [isAutoCompleteVisible, setIsAutoCompleteVisible] = useState<boolean>(false);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);

  // 지도 이동 관련 상태
  const isInitialSearchFit = useRef<boolean>(false);
  const previousZoomRef = useRef<number | null>(null);
  const previousCenterRef = useRef<naver.maps.CoordLiteral | null>(null);

  // 네이버 지도 스크립트 로드
  const [isScriptLoading, scriptError] = useScript(
    `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${
      import.meta.env.VITE_NAVER_MAP_API_KEY
    }`,
  );

  // 기본 중심 좌표 (서울시청)
  const defaultCenter = useRef<naver.maps.LatLngObjectLiteral>({ lat: 37.5666103, lng: 126.9783882 });

  // 네이버 객체 초기화
  const { isNaverReady } = useNaverObjInitialization(isScriptLoading, scriptError);

  // 현위치 불러오기
  const { currentLocation, isLocating, getCurrentLocation } = useCurrentLocation();

  // 폴리라인 그리기 함수
  const drawPolyline = useCallback(() => {
    if (!isNaverReady || !mapInstanceRef.current || !directionResult) return;
    // 기존 폴리라인 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const { naver } = window;
    const { path } = directionResult;
    const pathPoints = path.map((point) => new naver.maps.LatLng(point[1], point[0]));

    // 폴리라인 생성
    polylineRef.current = new naver.maps.Polyline({
      path: pathPoints,
      strokeColor: '#5553f9',
      strokeWeight: 8,
      strokeOpacity: 0.7,
      strokeLineJoin: 'round',
      startIcon: 3,
      startIconSize: 12,
      map: mapInstanceRef.current,
    });

    // 경로가 모두 보이도록 지도 범위 조정
    if (pathPoints.length > 0) {
      const bounds = new naver.maps.LatLngBounds(pathPoints[0], pathPoints[0]);
      pathPoints.forEach((point) => bounds.extend(point));
      mapInstanceRef.current.fitBounds(bounds, {
        top: 20,
        right: 50,
        bottom: 100,
        left: 50,
      });
      setIsSidebarOpen(false);
    }
  }, [isNaverReady, directionResult]);

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

  useEffect(() => {
    // 인증 로딩이 완료된 경우에만 데이터 로드
    if (!authLoading) {
      fetchViewNightSpotData();
    }
  }, [authLoading, fetchViewNightSpotData]);

  // 사용자 정보가 변경될 때 즐겨찾기 상태 업데이트
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setIsFavoriteMode(false);
      return;
    }

    setTotalPlaceData((prevData) =>
      prevData.map((place) => ({
        ...place,
        IS_FAVORITE: (user.favoritePlaceIds || []).includes(place.ID),
      })),
    );
  }, [user, authLoading]);

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

  // 사이드바 열기/닫기 함수
  const openSidebar = useCallback(
    (place: ViewNightSpot | null = null) => {
      setSelectedPlace(place);
      if (!isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    },
    [isSidebarOpen],
  );

  const closeSidebar = useCallback(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isSidebarOpen]);

  // 현위치 마커 업데이트
  const updateCurrentLocationMarker = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady || !window.naver) return;

    const { naver } = window;

    // 지도 중심 이동
    if (mapInstanceRef.current && currentLocation) {
      mapInstanceRef.current.setCenter(currentLocation);
    }

    if (currentLocation) {
      // 현위치 마커가 이미 있으면 마커 위치만 재설정
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setPosition(currentLocation);
      } else {
        // 마커가 없으면 현위치 마커 신규 생성
        currentMarkerRef.current = new naver.maps.Marker({
          position: currentLocation,
          map: mapInstanceRef.current,
          icon: {
            content: renderToString(
              <div className="h-[13px] w-[13px] rounded-full bg-violet-600 outline-6 outline-violet-600/25"></div>,
            ),
            anchor: new naver.maps.Point(7.5, 7.5),
          },
          zIndex: 100,
        });
      }
    } else if (currentMarkerRef.current) {
      // 위치 정보가 없는데 마커가 있으면 마커 제거
      currentMarkerRef.current.setMap(null);
      currentMarkerRef.current = null;
    }
  }, [isNaverReady, currentLocation]);

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

  // 지도 중심 이동
  const moveToPathPoint = useCallback(
    (pointIndex: number) => {
      if (!isNaverReady || !mapInstanceRef.current || !directionResult) return;

      const { naver } = window;
      const coordinates = directionResult.path[pointIndex];

      const position = new naver.maps.LatLng(coordinates[1], coordinates[0]);

      // 이동 및 확대
      mapInstanceRef.current.morph(position, 17, {
        duration: 400,
        easing: 'easeOutCubic',
      });
    },
    [isNaverReady, directionResult],
  );

  // pathPointIndex 변경 감지 및 지도 이동
  useEffect(() => {
    if (pathPointIndex !== null && directionResult) {
      moveToPathPoint(pathPointIndex);
    }
  }, [pathPointIndex, directionResult, moveToPathPoint]);

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

  // 마커 생성 함수
  const createMarker = useCallback(
    (place: ViewNightSpot) => {
      if (!mapInstanceRef.current || !isNaverReady || !place.LA || !place.LO || !window.naver)
        return null;

      const { naver } = window;

      try {
        const isSelectedPlace = selectedMarkerRef.current
          ? selectedMarkerRef.current.placeData.ID === place.ID
          : false;
        const defaultZIndex = 50;
        const iconConfig = createMarkerIcon(place, isSelectedPlace);

        if (!iconConfig) return null;

        // 마커 생성 시 처음부터 지도에 표시
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(Number(place.LA), Number(place.LO)),
          map: undefined, // 초기에는 지도에 표시하지 않음
          icon: iconConfig,
          zIndex: isSelectedPlace ? 1000 : defaultZIndex,
        });

        // 마커 데이터 쌍 생성
        const markerWithData = { marker, placeData: place };

        if (isSelectedPlace) {
          selectedMarkerRef.current = markerWithData;
          setSelectedPlace(place);
        }

        // 마커 클릭 이벤트
        marker.addListener('click', () => {
          console.log('마커 클릭 이벤트, handlePlaceSelect');
          handlePlaceSelect(place);
        });

        // 마우스 오버 이벤트
        marker.addListener('mouseover', () => {
          marker.setZIndex(1001);
        });

        // 마우스 아웃 이벤트
        marker.addListener('mouseout', () => {
          if (selectedMarkerRef.current) {
            const { placeData: selectedData } = selectedMarkerRef.current;
            if (selectedData.ID !== place.ID) {
              marker.setZIndex(defaultZIndex);
            }
          } else {
            marker.setZIndex(defaultZIndex);
          }
        });

        return markerWithData;
      } catch (e) {
        console.error('Failed to create marker', e, place);
        return null;
      }
    },
    [isNaverReady, createMarkerIcon, handlePlaceSelect],
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

  // 검색 결과 마커들이 모두 화면에 들어오도록 지도 범위 조정
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

  // 지도 영역 내 보이는 마커 업데이트
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

  // 경로 표시 상태가 변경될 때 폴리라인 업데이트
  useEffect(() => {
    if (isShowingPath) {
      drawPolyline();
    } else if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    updateVisibleMarkers();
  }, [isShowingPath, directionResult, drawPolyline, updateVisibleMarkers]);

  // 지도 이동 완료 후 핸들러
  const handleMapIdle = useCallback(() => {
    console.log('handleMapIdle');

    if (selectedMarkerRef.current) {
      // 선택된 마커가 있으면 인포윈도우 열기
      const { marker, placeData } = selectedMarkerRef.current;

      // 마커 스타일 업데이트
      const iconConfig = createMarkerIcon(placeData, true);
      if (iconConfig) {
        marker.setIcon(iconConfig);
      }
      marker.setZIndex(1000);

      // 인포윈도우 열기
      openInfoWindowForPlace();
    }

    // 보이는 마커 업데이트
    updateVisibleMarkers();
  }, [createMarkerIcon, openInfoWindowForPlace, updateVisibleMarkers]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((filters: string[]) => {
    setActiveFilters(filters);
  }, []);

  // 검색 핸들러
  const handleSearch = useCallback(() => {
    if (!searchKeyword.trim()) {
      setIsSearchMode(false);
      updateVisibleMarkers();
      return;
    }

    setIsAutoCompleteVisible(false);
    setIsSearchMode(true);
    isInitialSearchFit.current = false;

    // 검색 시 선택된 마커 초기화 (범위 자동 조정을 위해)
    if (selectedMarkerRef.current) {
      resetSelectedMarkerAndInfoWindow();
    }

    updateVisibleMarkers();
  }, [searchKeyword, updateVisibleMarkers, resetSelectedMarkerAndInfoWindow]);

  // 검색어 입력 시 자동완성 항목 업데이트
  const updateAutoComplete = useCallback(
    (keyword: string) => {
      if (!keyword.trim() || keyword.length < 2) {
        setAutoCompleteItems([]);
        setIsAutoCompleteVisible(false);
        return;
      }

      // 일치하는 장소 찾기 (제목 또는 주소에 키워드 포함)
      const matchedPlaces = totalPlaceData.filter(
        (place) =>
          (place.TITLE.includes(keyword) || place.ADDR.includes(keyword)) &&
          activeFilters.includes(place.SUBJECT_CD) &&
          (isFavoriteMode ? place.IS_FAVORITE : true),
      );

      setAutoCompleteItems(matchedPlaces);
      setIsAutoCompleteVisible(true);
    },
    [activeFilters, totalPlaceData, isFavoriteMode],
  );

  // 사용자 정의 컨트롤러 초기화 (현위치)
  const initCustomController = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady || !window.naver) return;

    const { naver } = window;

    // 현위치 버튼 추가
    const locationBtnHtml = renderToString(
      <button className="mr-2.5 flex h-8 w-8 cursor-pointer items-center justify-center border border-gray-600 bg-white text-gray-600 shadow transition-colors duration-150 active:bg-neutral-800 active:text-white">
        <MdOutlineMyLocation className="h-5 w-5" />
      </button>,
    );

    const currentLocationButton = new naver.maps.CustomControl(locationBtnHtml, {
      position: naver.maps.Position.RIGHT_CENTER,
    });

    naver.maps.Event.addDOMListener(
      currentLocationButton.getElement(),
      'click',
      getCurrentLocation,
    );
    currentLocationButton.setMap(mapInstanceRef.current);
  }, [isNaverReady, getCurrentLocation]);

  const onHandleFavoriteMode = useCallback(() => {
    if (!user) {
      logout();
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    setIsFavoriteMode(!isFavoriteMode);
  }, [user, isFavoriteMode]);

  const onHandleListViewBtn = useCallback(() => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      if (!isShowingPath) {
        handlePlaceSelect(null);
      }
    } else {
      if (selectedPlace) {
        if (isShowingPath) {
          setIsSidebarOpen(false);
        } else {
          setIsSidebarOpen(true);
          handlePlaceSelect(null);
        }
      } else {
        setIsSidebarOpen(false);
      }
    }
  }, [handlePlaceSelect, isShowingPath, isSidebarOpen, selectedPlace]);

  // 총 장소 데이터가 변경될 때 마커 생성
  useEffect(() => {
    if (!isNaverReady || totalPlaceData.length === 0) return;

    // 기존 마커 제거
    markersRef.current.forEach(({ marker }) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 새 마커 생성
    const newMarkers: MarkerWithData[] = [];

    totalPlaceData.forEach((place) => {
      const markerWithData = createMarker(place);
      if (markerWithData) {
        newMarkers.push(markerWithData);
      }
    });

    markersRef.current = newMarkers;

    // 필터링 및 가시성 업데이트
    updateVisibleMarkers();
  }, [isNaverReady, totalPlaceData, createMarker, updateVisibleMarkers]);

  // 필터 또는 검색어 변경 시 필터링 업데이트
  useEffect(() => {
    if (isNaverReady) {
      updateVisibleMarkers();
    }
  }, [isNaverReady, activeFilters, searchKeyword, isSearchMode, updateVisibleMarkers]);

  // 지도 초기화
  useEffect(() => {
    if (isNaverReady && mapDivRef.current && !mapInstanceRef.current && window.naver) {
      const { naver } = window;

      const mapOptions = {
        center: currentLocation ?? defaultCenter.current,
        mapDataControl: false,
        logoControlOptions: {
          position: naver.maps.Position.LEFT_BOTTOM,
        },
        scaleControlOptions: {
          position: naver.maps.Position.LEFT_BOTTOM,
        },
        zoom: 14,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.LEFT_BOTTOM,
          style: naver.maps.ZoomControlStyle.SMALL,
        },
        padding: { bottom: 50, top: 120, left: 20, right: 20 },
        tileDuration: 200,
      };

      mapInstanceRef.current = new naver.maps.Map(mapDivRef.current, mapOptions);

      // 지도 초기화 후 커스텀 컨트롤러 추가 및 현위치 가져오기
      mapInstanceRef.current.addListenerOnce('init', () => {
        initCustomController();
        getCurrentLocation();
      });
    }
  }, [isNaverReady, getCurrentLocation, currentLocation, initCustomController]);

  // 이벤트 리스너 설정
  useEffect(() => {
    if (!mapInstanceRef.current || !isNaverReady || !window.naver) return;

    // 기존 리스너 제거
    mapInstanceRef.current.clearListeners('idle');
    mapInstanceRef.current.clearListeners('click');
    mapInstanceRef.current.clearListeners('drag');
    // 새 리스너 추가
    const idleListener = mapInstanceRef.current.addListener('idle', handleMapIdle);
    const clickListener = mapInstanceRef.current.addListener('click', () => {
      resetSelectedMarkerAndInfoWindow();
      closeSidebar();
      if (isShowingPath) {
        clearPath();
      }
    });

    const dragListener = mapInstanceRef.current.addListener('drag', () => {
      closeSidebar();
    });

    return () => {
      if (window.naver) {
        naver.maps.Event.removeListener(idleListener);
        naver.maps.Event.removeListener(clickListener);
        naver.maps.Event.removeListener(dragListener);
      }
    };
  }, [isNaverReady, handleMapIdle, resetSelectedMarkerAndInfoWindow, closeSidebar, isShowingPath, clearPath]);

  // 컴포넌트 마운트 시 실행되는 코드들
  useEffect(() => {
    updateCurrentLocationMarker();
  }, [updateCurrentLocationMarker]);

  // 모든 카테고리 필터 활성화 초기화
  useEffect(() => {
    const filterAll = SUBJECTS.map((filter) => filter.id);
    setActiveFilters(filterAll);
  }, []);

  return (
    <div className="map-container relative h-full">
      {isScriptLoading && <div>지도 로딩 중...</div>}
      {scriptError && <div className="error-message">지도 로드 실패</div>}

      <div ref={mapDivRef} className={`h-full w-full ${isNaverReady ? 'block' : 'hidden'}`} />

      {(isLocating || isLoadingPlaces) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex-col justify-center align-middle">
          <ImSpinner2 className="h-10 w-10 animate-spin text-violet-600" />
        </div>
      )}

      <MapControls
        searchAndFilter={
          <SearchFilterContainer
            searchBar={
              <SearchBar
                searchKeyword={searchKeyword}
                setSearchKeyword={setSearchKeyword}
                autoCompleteItems={autoCompleteItems}
                setAutoCompleteItems={setAutoCompleteItems}
                isAutoCompleteVisible={isAutoCompleteVisible}
                setIsAutoCompleteVisible={setIsAutoCompleteVisible}
                setIsSearchMode={setIsSearchMode}
                handlePlaceSelect={handlePlaceSelect}
                handleSearch={handleSearch}
                updateAutoComplete={updateAutoComplete}
                updateVisibleMarkers={updateVisibleMarkers}
                createMarkerIcon={createMarkerIcon}
              />
            }
            filterBar={
              <FilterBar onFilterChange={handleFilterChange} activeFilters={activeFilters} />
            }
          />
        }
        listViewBtn={<ListViewBtn onHandleListViewBtn={onHandleListViewBtn} />}
        favoriteViewBtn={
          <FavoriteViewBtn
            isFavoriteMode={isFavoriteMode}
            onHandleFavoriteMode={onHandleFavoriteMode}
          />
        }
      />
      <MapSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        places={visiblePlacesData}
        selectedPlace={selectedPlace}
        onPlaceSelect={handlePlaceSelect}
      />
    </div>
  );
};
