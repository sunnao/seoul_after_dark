import { useEffect, useRef, useState, useCallback } from 'react';
import { useScript } from '@/hooks/useScript';
import axios from 'axios';
import { useNaverObjInitialization } from '@features/map/hooks/useNaverObjInitialization';
import { useCurrentLocation } from '@features/map/hooks/useCurrentLocation';
import { ApiResponse, MarkerWithData, ViewNightSpot } from '@features/map/types/mapTypes';

import { MdOutlineMyLocation } from 'react-icons/md';
import { ImSpinner2 } from 'react-icons/im';
import { FaList, FaSearch } from 'react-icons/fa';
import { renderToString } from 'react-dom/server';
import { MapSidebar } from '@/features/map/components/MapSidebar';
import { FilterChips } from '@/features/map/components/FilterChips';
import { FiFilter } from 'react-icons/fi';
import { SUBJECTS } from '@/features/map/constants/subjects';
import parse from 'html-react-parser';

export const Map = () => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const currentMarkerRef = useRef<naver.maps.Marker | null>(null);

  const [totalPlaceData, setTotalPlaceData] = useState<ViewNightSpot[]>([]);
  const [visiblePlacesData, setVisiblePlacesData] = useState<ViewNightSpot[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const totalMarkerPlacePairRef = useRef<MarkerWithData[]>([]);
  const seletedInfoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const selectedMarkerPlacePairRef = useRef<MarkerWithData | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<ViewNightSpot | null>(null);
  const previousZoomRef = useRef<number | null>(null);
  const previousCenterRef = useRef<naver.maps.CoordLiteral | null>(null);

  const [activeTab, setActiveTab] = useState<'filter' | 'search'>('filter');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [autoCompleteItems, setAutoCompleteItems] = useState<ViewNightSpot[]>([]);
  const [isAutoCompleteVisible, setIsAutoCompleteVisible] = useState<boolean>(false);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);

  const [isScriptLoading, scriptError] = useScript(
    `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${
      import.meta.env.VITE_NAVER_MAP_API_KEY
    }`,
  );
  // prettier-ignore
  const defaultCenter: naver.maps.LatLngLiteral = { lat: 37.5666103, lng: 126.9783882 }; // 서울시청 기본값

  // 전체 장소 정보 가져오기 (API 호출) 함수 - useCallback으로 메모이제이션
  const fetchViewNightSpotData = useCallback(async () => {
    setIsLoadingPlaces(true);

    try {
      // prettier-ignore
      const url = `/api/${import.meta.env.VITE_SEOUL_API_KEY}/json/viewNightSpot/1/1000`;
      const result = await axios.get<ApiResponse>(url);

      if (result.data.viewNightSpot.RESULT.CODE === 'INFO-000') {
        const places = result.data.viewNightSpot.row;
        setTotalPlaceData(places);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPlaces(false);
    }
  }, []);

  useEffect(() => {
    fetchViewNightSpotData();
  }, [fetchViewNightSpotData]);

  // 네이버 객체 초기화
  const { isNaverReady } = useNaverObjInitialization(isScriptLoading, scriptError);

  // 현위치 불러오기
  const { currentLocation, isLocating, getCurrentLocation } = useCurrentLocation();

  // 현위치 마커 업데이트 함수 - useCallback으로 메모이제이션
  const updateCurrentLocationMarker = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady) return;

    const { naver } = window;

    // 지도 중심 이동
    mapInstanceRef.current.setCenter(currentLocation ?? defaultCenter);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNaverReady, currentLocation]);

  // 현위치 마커 업데이트
  useEffect(() => {
    updateCurrentLocationMarker();
  }, [updateCurrentLocationMarker]);

  // 선택된 장소로 지도 중심 이동 및 확대
  const moveMapToPlace = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady || !selectedMarkerPlacePairRef.current) return;

    const { naver } = window;
    const { placeData } = selectedMarkerPlacePairRef.current;
    const placePosition = new naver.maps.LatLng(Number(placeData.LA), Number(placeData.LO));

    // 현재 중심/줌 확인
    if (!previousZoomRef.current && !previousCenterRef.current) {
      previousZoomRef.current = mapInstanceRef.current.getZoom();
      previousCenterRef.current = mapInstanceRef.current.getCenter();
    }

    // 지도 중앙 이동
    mapInstanceRef.current.morph(placePosition, 15, { duration: 200, easing: 'easeOutCubic' });
  }, [isNaverReady]);

  useEffect(() => {
    const filterAll = SUBJECTS.map((filter) => filter.id);
    setActiveFilters(filterAll);
  }, []);

  // 마커 표시 여부 결정 (필터, 영역 내 위치)
  const updateVisibleMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady) return;

    if (isSearchMode) {
      return;
    }

    const mapBounds = mapInstanceRef.current.getBounds();
    const visibleData: ViewNightSpot[] = [];

    totalMarkerPlacePairRef.current.forEach(({ marker, placeData }) => {
      const isInBounds = mapBounds.hasPoint(marker.getPosition());
      const isPassFilter = activeFilters.includes(placeData.SUBJECT_CD);
      const shouldShow = isInBounds && isPassFilter;

      marker.setMap(shouldShow ? mapInstanceRef.current : null);

      if (shouldShow) {
        visibleData.push(placeData);
      }
    });
    setVisiblePlacesData(visibleData);

    previousCenterRef.current = null;
    previousZoomRef.current = null;
  }, [isNaverReady, activeFilters, isSearchMode]);

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

  const createMarkerIcon = useCallback((subject: string, isSelected: boolean = false) => {
    const { naver } = window;

    const getMarkerStyle = () => {
      switch (subject) {
        case '문화/체육':
          return {
            bgColor: 'bg-purple-800',
          };
        case '공원/광장':
          return {
            bgColor: 'bg-green-800',
          };
        case '공공시설':
          return {
            bgColor: 'bg-blue-800',
          };
        case '가로/마을':
          return {
            bgColor: 'bg-amber-700',
            iconStyle: `${isSelected ? 'h-7 w-7' : 'h-5 w-5'} invert-[1]`,
          };
        case '기타':
          return {
            bgColor: 'bg-sky-800',
          };
        default:
          return {
            bgColor: '',
          };
      }
    };

    const currentSubjectForMarker = {
      ...SUBJECTS.find((ele) => ele.id === subject),
      ...getMarkerStyle(),
    };

    const size = isSelected ? 'h-10 w-10' : 'h-7 w-7';
    const iconSize = isSelected ? 'text-[30px]' : 'text-[20px]';
    const selectedBorder = isSelected ? 'ring-2 ring-white' : '';

    return {
      content: renderToString(
        <div
          className={`flex ${size} ${selectedBorder} ${currentSubjectForMarker.bgColor} items-center justify-center rounded-full border border-neutral-300 shadow-lg`}
        >
          <span
            className={`${iconSize} ${subject == '가로/마을' && currentSubjectForMarker.iconStyle} text-white`}
          >
            {currentSubjectForMarker.icon}
          </span>
        </div>,
      ),
      anchor: new naver.maps.Point(isSelected ? 24 : 20, isSelected ? 24 : 20),
    };
  }, []);

  // 선택된 마커와 인포윈도우 초기화
  const resetSelectedMarkerAndInfoWindow = useCallback(() => {
    // 인포윈도우 닫기
    if (seletedInfoWindowRef.current) {
      seletedInfoWindowRef.current.close();
      seletedInfoWindowRef.current = null;
    }

    // 선택된 마커 스타일 초기화
    if (selectedMarkerPlacePairRef.current) {
      const { marker, placeData } = selectedMarkerPlacePairRef.current;
      marker.setIcon(createMarkerIcon(placeData.SUBJECT_CD, false));
      marker.setZIndex(50);

      selectedMarkerPlacePairRef.current = null;
    }
  }, [createMarkerIcon]);

  const handlePlaceSelect = useCallback(
    (place: ViewNightSpot | null) => {
      if (!mapInstanceRef.current) return;
      // 기존 선택 초기화
      resetSelectedMarkerAndInfoWindow();

      setSelectedPlace(place);

      if (place) {
        const markerPair = totalMarkerPlacePairRef.current.find(
          (pair) => pair.placeData.TITLE === place.TITLE && pair.placeData.ADDR === place.ADDR,
        );
        if (markerPair) {
          selectedMarkerPlacePairRef.current = markerPair;

          moveMapToPlace();
          setIsSidebarOpen(true);
        }
      } else {
        if (previousCenterRef.current && previousZoomRef.current) {
          mapInstanceRef.current.morph(previousCenterRef.current, previousZoomRef.current, {
            duration: 400,
            easing: 'easeOutCubic',
          });
        }
      }
    },
    [moveMapToPlace, resetSelectedMarkerAndInfoWindow],
  );

  const createMarker = useCallback(
    (place: ViewNightSpot) => {
      if (!mapInstanceRef.current || !isNaverReady || !place.LA || !place.LO) return null;

      const { naver } = window;

      try {
        // 기본 z-index 값 설정 (모든 마커에 공통으로 적용될 값)
        const defaultZIndex = 50;

        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(Number(place.LA), Number(place.LO)),
          map: undefined,
          icon: createMarkerIcon(place.SUBJECT_CD, false),
        });

        // 마커 클릭 이벤트
        marker.addListener('click', () => {
          handlePlaceSelect(place);
        });

        // 마우스 오버 이벤트
        marker.addListener('mouseover', () => {
          marker.setZIndex(1001);
        });

        // 마우스 아웃 이벤트
        marker.addListener('mouseout', () => {
          if (selectedMarkerPlacePairRef.current) {
            const { placeData } = selectedMarkerPlacePairRef.current;
            if (placeData.TITLE !== place.TITLE && placeData.ADDR !== place.ADDR) {
              marker.setZIndex(defaultZIndex);
            }
          } else {
            marker.setZIndex(defaultZIndex);
          }
        });

        return { marker, placeData: place };
      } catch (e) {
        console.error('Failed to create marker', e, place);
        return null;
      }
    },
    [isNaverReady, handlePlaceSelect, createMarkerIcon],
  );

  // 선택된 장소에 해당하는 인포윈도우 열기
  const openInfoWindowForPlace = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady || !selectedMarkerPlacePairRef.current) return;

    const { naver } = window;
    const { placeData, marker } = selectedMarkerPlacePairRef.current;

    // 인포윈도우 내용 생성
    const infoWindowContent = `
            <div id="infoWindow" class="p-2.5 max-w-[250px] text-zinc-900 border-zinc-900 border-1 rounded shadow cursor-pointer">
              <h4 class="font-bold text-sm">${placeData.TITLE}</h4>
            </div>`;

    const infoWindow = new naver.maps.InfoWindow({
      content: infoWindowContent,
      borderWidth: 0,
      disableAnchor: true,
    });

    setTimeout(() => {
      const infoWindow = document.getElementById('infoWindow');
      if (infoWindow) {
        infoWindow.addEventListener('click', () => handlePlaceSelect(placeData));
      }
    }, 100);

    if (mapInstanceRef.current) {
      infoWindow.open(mapInstanceRef.current, marker);
      seletedInfoWindowRef.current = infoWindow;
    }
  }, [isNaverReady, handlePlaceSelect]);

  // totalPlaceData가 변경될 때만 장소 마커 참조 변경
  useEffect(() => {
    if (!mapInstanceRef.current || !isNaverReady) return;

    // 기존 장소 마커 제거
    totalMarkerPlacePairRef.current.forEach(({ marker }) => {
      marker.setMap(null);
    });
    totalMarkerPlacePairRef.current = [];

    // 새 장소 마커 생성
    totalPlaceData.forEach((place) => {
      const markerWithData = createMarker(place);
      if (markerWithData !== null) {
        totalMarkerPlacePairRef.current.push(markerWithData);
      }
    });

    updateVisibleMarkers();
  }, [isNaverReady, totalPlaceData, createMarker, updateVisibleMarkers]);

  const handleFilterChange = useCallback(
    (filters: string[]) => {
      setActiveFilters(filters);
      updateVisibleMarkers();
    },
    [updateVisibleMarkers],
  );

  const handleMapIdle = useCallback(() => {
    if (selectedMarkerPlacePairRef.current) {
      const { marker, placeData } = selectedMarkerPlacePairRef.current;

      // 마커 스타일 업데이트
      marker.setIcon(createMarkerIcon(placeData.SUBJECT_CD, true));
      marker.setZIndex(1000);

      // 인포윈도우 열기
      openInfoWindowForPlace();
    } else {
      updateVisibleMarkers();
    }
  }, [createMarkerIcon, openInfoWindowForPlace, updateVisibleMarkers]);

  // 동적으로 변하는 이벤트 리스너는 useEffect로 관리
  useEffect(() => {
    if (!mapInstanceRef.current || !isNaverReady) return;

    // 기존 리스너 제거
    mapInstanceRef.current.clearListeners('idle');
    mapInstanceRef.current.clearListeners('click');

    // 새 리스너 추가
    const idleListener = mapInstanceRef.current.addListener('idle', handleMapIdle);
    const clickListener = mapInstanceRef.current.addListener('click', () => {
      resetSelectedMarkerAndInfoWindow();
      setSelectedPlace(null);
      closeSidebar();
    });

    // 클린업 함수
    return () => {
      naver.maps.Event.removeListener(idleListener);
      naver.maps.Event.removeListener(clickListener);
    };
  }, [isNaverReady, handleMapIdle, resetSelectedMarkerAndInfoWindow, closeSidebar]);

  const initCustomController = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady) return;

    const { naver } = window;

    // 현위치 버튼 추가
    const locationBtnHtml = renderToString(
      <button className="mr-2.5 flex h-8 w-8 cursor-pointer items-center justify-center border border-gray-600 bg-white shadow transition-colors duration-150 hover:bg-gray-50 active:border-blue-600 active:bg-blue-500 active:text-white">
        <MdOutlineMyLocation className="h-5 w-5 text-gray-600 active:text-white" />
      </button>,
    );

    const currentLocationButton = new naver.maps.CustomControl(locationBtnHtml, {
      position: naver.maps.Position.RIGHT_CENTER,
    });
    naver.maps.Event.addDOMListener(currentLocationButton.getElement(), 'click', () =>
      getCurrentLocation(),
    );
    currentLocationButton.setMap(mapInstanceRef.current);

    // 목록보기 버튼 추가
    const listBtnHtml = renderToString(
      <div className="pb-5">
        <button className="btn flex cursor-pointer items-center justify-center rounded-4xl border border-neutral-300 bg-neutral-100 px-4 py-2 shadow-lg">
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
      if (seletedInfoWindowRef.current) {
        seletedInfoWindowRef.current.close();
        seletedInfoWindowRef.current = null;
      }
      if (selectedMarkerPlacePairRef.current) {
        selectedMarkerPlacePairRef.current = null;
      }
    });
    listButton.setMap(mapInstanceRef.current);

    mapInstanceRef.current.addListener('idle', handleMapIdle);
    mapInstanceRef.current.addListener('click', () => {
      resetSelectedMarkerAndInfoWindow();
      setSelectedPlace(null);
      closeSidebar();
    });
  }, [isNaverReady, handleMapIdle, getCurrentLocation, openSidebar, handlePlaceSelect, resetSelectedMarkerAndInfoWindow, closeSidebar]);

  // 지도 초기화 실행
  useEffect(() => {
    if (isNaverReady && mapDivRef.current && !mapInstanceRef.current) {
      const { naver } = window;

      const mapOptions = {
        center: currentLocation ?? defaultCenter,
        mapDataControl: false,
        zoom: 14,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.RIGHT_TOP,
          style: naver.maps.ZoomControlStyle.SMALL,
        },
        padding: { bottom: 50, top: 120, left: 20, right: 20 },
      };

      mapInstanceRef.current = new naver.maps.Map(mapDivRef.current, mapOptions);
      mapInstanceRef.current.addListenerOnce('init', () => {
        initCustomController();
        getCurrentLocation();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNaverReady, getCurrentLocation, currentLocation]);

  // 검색 핸들러
  const handleSearch = useCallback(() => {
    if (!searchKeyword.trim()) {
      setIsSearchMode(false);
      return;
    }
    setIsAutoCompleteVisible(false);

    // 나머지 검색 로직은 그대로 유지
    const filteredPlaces = totalPlaceData.filter(
      (place) => place.TITLE.includes(searchKeyword) || place.ADDR.includes(searchKeyword),
    );

    totalMarkerPlacePairRef.current.forEach(({ marker, placeData }) => {
      const isMatch =
        placeData.TITLE.includes(searchKeyword) || placeData.ADDR.includes(searchKeyword);

      marker.setMap(isMatch ? mapInstanceRef.current : null);
    });

    setVisiblePlacesData(filteredPlaces);
    setIsSearchMode(true);
  }, [searchKeyword, totalPlaceData]);

  // 검색어 입력 시 자동완성 항목 업데이트
  const updateAutoComplete = useCallback(
    (keyword: string) => {
      if (!keyword.trim() || keyword.length < 2) {
        setAutoCompleteItems([]);
        setIsAutoCompleteVisible(false);
        return;
      }

      // 일치하는 장소 찾기 (제목 또는 주소에 키워드 포함)
      const matchedPlaces = visiblePlacesData
        .filter((place) => place.TITLE.includes(keyword) || place.ADDR.includes(keyword))
        .slice(0, 5); // 최대 5개까지만 표시

      setAutoCompleteItems(matchedPlaces);
      setIsAutoCompleteVisible(matchedPlaces.length > 0);
    },
    [visiblePlacesData],
  );

  // 검색어 변경 핸들러
  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newKeyword = e.target.value;
      setSearchKeyword(newKeyword);
      updateAutoComplete(newKeyword);
      if (newKeyword.length === 0) {
        setIsSearchMode(false);
      }
    },
    [updateAutoComplete],
  );

  // 자동완성 항목 선택 핸들러
  const handleAutoCompleteSelect = useCallback(
    (place: ViewNightSpot) => {
      setSearchKeyword(place.TITLE);
      setIsAutoCompleteVisible(false);

      // 해당 장소로 지도 이동 및 마커 표시
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

  return (
    <div className="map-container relative h-full">
      {isScriptLoading && <div>지도 로딩 중...</div>}
      {scriptError && <div className="error-message">지도 로드 실패</div>}

      <div ref={mapDivRef} className={`h-full w-full ${isNaverReady ? 'block' : 'hidden'}`} />

      {isNaverReady && (
        <div className="absolute top-2 right-0 left-0 z-10 mx-auto flex w-[80%] max-w-[800px] gap-2">
          {/* 검색 영역 */}
          <div
            className={`flex items-center rounded-lg bg-white/90 p-2 shadow-md transition-all duration-300 ease-in-out ${
              activeTab === 'search' ? 'flex-grow' : 'w-10'
            }`}
            onClick={() => activeTab !== 'search' && setActiveTab('search')}
          >
            {activeTab === 'search' ? (
              <>
                {/* 검색창 */}
                <div className="flex w-full items-center gap-2">
                  <FaSearch
                    className={`h-5 w-5 text-neutral-500 ${activeTab === 'search' && 'ml-3'}`}
                  />
                  <div className="relative w-full">
                    <input
                      type="search"
                      placeholder="장소명 또는 주소 검색"
                      className="w-full border-none bg-transparent focus:outline-none"
                      value={searchKeyword}
                      onChange={handleSearchInputChange}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAutoCompleteVisible(true)
                        handleTabChange('search');
                      }} // 이벤트 버블링 방지
                    />
                  </div>

                  <button
                    className="rounded-full bg-neutral-800 px-4 py-2 text-white"
                    onClick={handleSearch}
                  >
                    <FaSearch className="h-4 w-4" />
                  </button>
                </div>

                {/* 자동완성 */}
                {isAutoCompleteVisible && autoCompleteItems.length > 0 && (
                  <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg bg-white/95 shadow-lg">
                    {autoCompleteItems.map((place, index) => (
                      <div
                        key={`${place.TITLE}-${index}`}
                        className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAutoCompleteSelect(place);
                        }}
                      >
                        <div>{parse(createMarkerIcon(place.SUBJECT_CD, false).content)}</div>
                        <div>
                          <div className="font-medium">{place.TITLE}</div>
                          <div className="text-sm text-gray-500">{place.ADDR}</div>
                        </div>
                      </div>
                    ))}
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
              activeTab === 'filter' ? 'flex-grow' : 'w-10'
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
              className={`flex h-full min-h-[50px] items-center justify-center p-2 ${activeTab === 'filter' ? 'hidden' : 'block'}`}
            >
              <FiFilter className="h-5 w-5 text-neutral-500" />
            </div>
          </div>
        </div>
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
