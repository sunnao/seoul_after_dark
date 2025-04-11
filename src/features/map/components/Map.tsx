import { useEffect, useRef, useState, useCallback } from 'react';
import { useScript } from '@/hooks/useScript';
import axios from 'axios';
import { useNaverObjInitialization } from '@features/map/hooks/useNaverObjInitialization';
import { useCurrentLocation } from '@features/map/hooks/useCurrentLocation';
import { ApiResponse, MarkerWithData, ViewNightSpot } from '@features/map/types/mapTypes';

import { MdOutlineMyLocation } from 'react-icons/md';
import { ImSpinner2 } from 'react-icons/im';
import { FaChevronUp, FaList, FaSearch } from 'react-icons/fa';
import { renderToString } from 'react-dom/server';
import { MapSidebar } from '@/features/map/components/MapSidebar';
import { FilterChips } from '@/features/map/components/FilterChips';
import { FiFilter } from 'react-icons/fi';
import { SUBJECTS } from '@/features/map/constants/subjects';
import parse from 'html-react-parser';
import { TiDelete } from 'react-icons/ti';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { HiStar } from 'react-icons/hi2';
import { HiOutlineStar } from 'react-icons/hi';

export const Map = () => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const currentMarkerRef = useRef<naver.maps.Marker | null>(null);
  const { user, authLoading, logout } = useAuth();

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
  const [activeTab, setActiveTab] = useState<'filter' | 'search'>('filter');
  const [isContainerShow, setIsContainerShow] = useState<boolean>(true);
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

  const prevUpdateCountRef = useRef<unknown | null>({
    isNaverReady: null,
    handleMapIdle: null,
    resetSelectedMarkerAndInfoWindow: null,
    closeSidebar: null,
  });

  const updateVisibleMarkersRef = useRef<unknown | null>({
    isNaverReady: null,
    filterPlaces: null,
    isSearchMode: null,
    fitMapToMarkers: null,
    isFavoriteMode: null,
  });

  // 네이버 지도 스크립트 로드
  const [isScriptLoading, scriptError] = useScript(
    `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${
      import.meta.env.VITE_NAVER_MAP_API_KEY
    }`,
  );

  // 기본 중심 좌표 (서울시청)
  const defaultCenter: naver.maps.LatLngLiteral = { lat: 37.5666103, lng: 126.9783882 };

  // 네이버 객체 초기화
  const { isNaverReady } = useNaverObjInitialization(isScriptLoading, scriptError);

  // 현위치 불러오기
  const { currentLocation, isLocating, getCurrentLocation } = useCurrentLocation();

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

      if (isSearchMode) {
        // marker.setMap(null);
      }
      const iconConfig = createMarkerIcon(placeData, false);
      if (iconConfig) {
        marker.setIcon(iconConfig);
      }
      marker.setZIndex(50);

      selectedMarkerRef.current = null;
    }
    setSelectedPlace(null);
  }, [createMarkerIcon, isSearchMode]);

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

    // 지도 중심/줌 이동
    console.log('moveMapToPlace~~~~~~~~~~');

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

          // 지도 중심 이동 및 사이드바 열기
          moveMapToPlace();
          openSidebar(place);

          // 인포윈도우 열기
          openInfoWindowForPlace();
        }
      } else {
        // 장소 선택 해제 시 이전 위치로 복귀
        if (previousCenterRef.current && previousZoomRef.current && mapInstanceRef.current) {
          console.log('장소 선택 해제 시 이전 위치로 복귀');

          mapInstanceRef.current.morph(previousCenterRef.current, previousZoomRef.current, {
            duration: 200,
            easing: 'easeOutCubic',
          });

          previousCenterRef.current = null;
          previousZoomRef.current = null;
        }

        // closeSidebar();
      }
    },
    [
      isNaverReady,
      resetSelectedMarkerAndInfoWindow,
      createMarkerIcon,
      moveMapToPlace,
      openSidebar,
      openInfoWindowForPlace,
      //   closeSidebar,
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
        places.length === 0
        || isInitialSearchFit.current
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
    console.log('----------------------------------------');
    console.log('<<< updateVisibleMarkers - 지도 영역 내 보이는 마커 업데이트 >>>');
    if (updateVisibleMarkersRef.current.isNaverReady !== isNaverReady) {
      console.log(
        'isNaverReady 가 ',
        updateVisibleMarkersRef.current.isNaverReady,
        '=>',
        isNaverReady,
        '로 변경되었습니다.',
      );
    }

    if (updateVisibleMarkersRef.current.filterPlaces !== handleMapIdle) {
      console.log(
        'filterPlaces 가',
        updateVisibleMarkersRef.current.filterPlaces === null ? 'null에서' : '',
        ' =>',
        ' 변경되었습니다.',
      );
    }

    if (updateVisibleMarkersRef.current.isSearchMode !== resetSelectedMarkerAndInfoWindow) {
      console.log(
        'isSearchMode 가',
        updateVisibleMarkersRef.current.isSearchMode,
        '=>',
        isSearchMode,
        '로 변경되었습니다.',
      );
    }

    if (updateVisibleMarkersRef.current.fitMapToMarkers !== closeSidebar) {
      console.log(
        'fitMapToMarkers 가',
        updateVisibleMarkersRef.current.fitMapToMarkers === null ? 'null에서' : '',
        ' =>',
        ' 변경되었습니다.',
      );
    }

    if (updateVisibleMarkersRef.current.isFavoriteMode !== closeSidebar) {
      console.log(
        'isFavoriteMode 가',
        updateVisibleMarkersRef.current.isFavoriteMode,
        '=>',
        isFavoriteMode,
        '로 변경되었습니다.',
      );
    }
    console.log('----------------------------------------');

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
  }, [isNaverReady, filterPlaces, isSearchMode, fitMapToMarkers, isFavoriteMode]);

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

  // 검색어 변경 핸들러
  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newKeyword = e.target.value;
      setSearchKeyword(newKeyword);
      updateAutoComplete(newKeyword);
    },
    [updateAutoComplete],
  );

  // 자동완성 항목 선택 핸들러
  const handleAutoCompleteSelect = useCallback(
    (place: ViewNightSpot) => {
      setSearchKeyword(place.TITLE);
      setIsAutoCompleteVisible(false);
      setIsSearchMode(true);

      // 해당 장소 선택
      handlePlaceSelect(place);
    },
    [handlePlaceSelect],
  );

  // 검색창 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setIsAutoCompleteVisible(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = useCallback(
    (tab: 'filter' | 'search') => {
      if (activeTab !== tab) {
        setActiveTab(tab);

        if (tab === 'search') {
          setIsAutoCompleteVisible(false);
        }
      }
    },
    [activeTab],
  );

  // 사용자 정의 컨트롤러 초기화 (현위치, 목록보기 버튼)
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

    // 목록보기 버튼 추가
    const listBtnHtml = renderToString(
      <div className="pb-5">
        <button className="btn flex cursor-pointer items-center justify-center rounded-4xl border border-neutral-300 bg-white px-4 py-2 shadow-lg">
          <FaList className="h-4 w-4 text-gray-600" />
          <span className="text-[14px] text-gray-600">목록보기</span>
        </button>
      </div>,
    );

    const listButton = new naver.maps.CustomControl(listBtnHtml, {
      position: naver.maps.Position.BOTTOM_CENTER,
    });

    naver.maps.Event.addDOMListener(listButton.getElement(), 'click', () => {
      openSidebar(null);
      handlePlaceSelect(null);
    });

    listButton.setMap(mapInstanceRef.current);
  }, [isNaverReady, getCurrentLocation, openSidebar, handlePlaceSelect]);

  const onHandleFavoriteMode = useCallback(() => {
    if (!user) {
      logout();
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    setIsFavoriteMode(!isFavoriteMode);
  }, [isFavoriteMode]);

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
        center: currentLocation ?? defaultCenter,
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
    console.log('----------------------------------------');
    console.log('<<< useEffect - 기존 리스너 제거, 재설정 >>>');
    if (prevUpdateCountRef.current.isNaverReady !== isNaverReady) {
      console.log(
        'isNaverReady 가',
        prevUpdateCountRef.current.isNaverReady,
        '=>',
        isNaverReady,
        '로 변경되었습니다.',
      );
    }

    if (prevUpdateCountRef.current.handleMapIdle !== handleMapIdle) {
      console.log(
        'handleMapIdle 가',
        prevUpdateCountRef.current.handleMapIdle === null ? 'null에서' : '',
        ' =>',
        ' 변경되었습니다.',
      );
    }

    if (
      prevUpdateCountRef.current.resetSelectedMarkerAndInfoWindow !==
      resetSelectedMarkerAndInfoWindow
    ) {
      console.log(
        'resetSelectedMarkerAndInfoWindow 가',
        prevUpdateCountRef.current.resetSelectedMarkerAndInfoWindow === null ? 'null에서' : '',
        ' =>',
        ' 변경되었습니다.',
      );
    }

    if (prevUpdateCountRef.current.closeSidebar !== closeSidebar) {
      console.log(
        'closeSidebar 가',
        prevUpdateCountRef.current.closeSidebar === null ? 'null에서' : '',
        ' =>',
        ' 변경되었습니다.',
      );
    }
    console.log('----------------------------------------');
    prevUpdateCountRef.current = {
      isNaverReady,
      handleMapIdle,
      resetSelectedMarkerAndInfoWindow,
      closeSidebar,
    };

    if (!mapInstanceRef.current || !isNaverReady || !window.naver) return;

    // 기존 리스너 제거
    mapInstanceRef.current.clearListeners('idle');
    mapInstanceRef.current.clearListeners('click');

    // 새 리스너 추가
    const idleListener = mapInstanceRef.current.addListener('idle', handleMapIdle);
    const clickListener = mapInstanceRef.current.addListener('click', () => {
      console.log('clickListener');

      resetSelectedMarkerAndInfoWindow();
      closeSidebar();
    });

    return () => {
      if (window.naver) {
        naver.maps.Event.removeListener(idleListener);
        naver.maps.Event.removeListener(clickListener);
      }
    };
  }, [isNaverReady, handleMapIdle, resetSelectedMarkerAndInfoWindow, closeSidebar]);

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

      {isNaverReady && (
        <>
          <div className="absolute top-2 right-0 left-0 z-10 mx-auto flex w-[90%] max-w-[800px] gap-2 md:w-[80%]">
            <div
              onClick={() => setIsContainerShow(!isContainerShow)}
              className="min-w-[20px] self-start rounded-md bg-white/90 p-1 shadow-md"
            >
              <FaChevronUp
                className={`h-full w-full text-neutral-600 transition-all duration-300 ${isContainerShow ? '' : 'rotate-180'}`}
              />
            </div>
            <div className={`${isContainerShow ? 'block' : 'hidden'} flex w-full gap-2`}>
              {/* 검색 영역 */}
              <div
                className={`flex items-center rounded-lg bg-white/90 p-2 shadow-md transition-all duration-300 ease-in-out ${
                  activeTab === 'search' ? 'flex-grow' : 'w-8 md:w-10'
                }`}
                onClick={() => activeTab !== 'search' && setActiveTab('search')}
              >
                {activeTab === 'search' ? (
                  <>
                    {/* 검색창 */}
                    <div className="flex w-full items-center gap-2">
                      <FaSearch
                        className={`h-5 w-5 text-neutral-500 ${activeTab === 'search' && 'ml-1 sm:ml-3'}`}
                      />
                      <div className="flex flex-grow items-center">
                        <input
                          type="text"
                          placeholder="장소명 또는 주소 검색"
                          className="caret-grat-800 w-full border-none bg-transparent text-gray-700 focus:outline-none"
                          value={searchKeyword}
                          onChange={handleSearchInputChange}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTabChange('search');
                            if (searchKeyword.length >= 2) {
                              setIsAutoCompleteVisible(true);
                            }
                          }}
                        />
                        {searchKeyword && (
                          <button
                            className="mr-1 p-1 text-gray-500 hover:text-gray-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchKeyword('');
                              setIsSearchMode(false);
                              setAutoCompleteItems([]);
                              updateVisibleMarkers();
                              // isInitialSearchFit.current = false;
                            }}
                          >
                            <TiDelete className="text-xl" />
                          </button>
                        )}

                        <button
                          className="btn rounded-full bg-neutral-800 px-4 py-2 text-white btn-xs md:btn-sm"
                          onClick={handleSearch}
                        >
                          <FaSearch className="md:h-4 md:w-4" />
                        </button>
                      </div>
                    </div>

                    {/* 자동완성 */}
                    {isAutoCompleteVisible && (
                      <div
                        className="absolute top-full right-0 left-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg bg-white/95 shadow-lg"
                        style={{ width: 'calc(100% - 31px)', marginLeft: '31px' }}
                      >
                        {autoCompleteItems.length > 0 ? (
                          autoCompleteItems.map((place, index) => (
                            <div
                              key={`${place.TITLE}-${index}`}
                              className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAutoCompleteSelect(place);
                              }}
                            >
                              <div>{parse(createMarkerIcon(place, false)?.content || '')}</div>
                              <div>
                                <div className="font-medium text-gray-800">{place.TITLE}</div>
                                <div className="text-sm text-gray-500">{place.ADDR}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">일치하는 장소가 없습니다.</div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <button className="flex h-full w-full items-center justify-center">
                    <FaSearch className="h-5 w-5 text-neutral-500" />
                  </button>
                )}
              </div>

              {/* 필터영역 */}
              <div
                className={`overflow-hidden rounded-lg bg-white/90 shadow-md transition-all duration-300 ease-in-out ${
                  activeTab === 'filter' ? 'flex-grow' : 'w-7 shrink-0 md:w-10'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTabChange('filter');
                }}
              >
                <div className={`${activeTab === 'filter' ? 'block' : 'hidden'}`}>
                  <FilterChips onFilterChange={handleFilterChange} activeFilters={activeFilters} />
                </div>
                <div
                  className={`flex h-full min-h-[50px] items-center justify-center ${activeTab === 'filter' ? 'hidden' : 'block'}`}
                >
                  <FiFilter className="h-5 text-neutral-500 sm:w-5" />
                  {activeFilters.length !== SUBJECTS.length && (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded bg-violet-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 즐겨찾기 모드 버튼 */}
          <div className="absolute right-0 bottom-5 z-10">
            <button
              onClick={onHandleFavoriteMode}
              className="mr-2.5 flex h-8 w-8 cursor-pointer items-center justify-center border border-gray-600 bg-white text-gray-600 shadow transition-colors duration-150 active:bg-neutral-800 active:text-white"
            >
              {isFavoriteMode ? (
                <HiStar className="h-5 w-5 text-violet-600" />
              ) : (
                <HiOutlineStar className="h-5 w-5 text-gray-600 active:text-white" />
              )}
            </button>
          </div>
        </>
      )}

      {(isLocating || isLoadingPlaces) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex-col justify-center align-middle">
          <ImSpinner2 className="h-10 w-10 animate-spin text-violet-600" />
        </div>
      )}

      <MapSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        places={visiblePlacesData}
        selectedPlace={selectedPlace}
        onPlaceSelect={handlePlaceSelect}
      />
    </div>
  );
};
