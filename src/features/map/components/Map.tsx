import { useEffect, useRef, useState, useCallback } from 'react';
import { MarkerWithData, ViewNightSpot, ClusteredPlace } from '@features/map/types/mapTypes';
import { useMapContext, useMapDirectionContext } from '@/features/map/context';

import { MdOutlineMyLocation } from 'react-icons/md';
import { ImSpinner2 } from 'react-icons/im';
import { renderToString } from 'react-dom/server';
import { MapSideBar } from '@/features/map/components/MapSideBar';
import { SUBJECTS } from '@/features/map/constants/subjects';
import { MapControls } from '@/features/map/components/MapControls';
import { FavoriteViewBtn } from '@/features/map/components/FavoriteViewBtn';
import { ListViewBtn } from '@/features/map/components/ListViewBtn';
import { SearchFilterContainer } from '@/features/map/components/SearchFilterContainer';
import { SearchBar } from '@/features/map/components/SearchBar';
import { FilterBar } from '@/features/map/components/FilterBar';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { EditPlaceModal } from '@/features/map/components/EditPlaceModal';

export const Map = () => {
  const { user } = useAuth();

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const polylineRef = useRef<naver.maps.Polyline | null>(null);

  const { directionResult, isShowingPath, clearPath, pathPointIndex } = useMapDirectionContext();
  const {
    mapInstanceRef,
    currentMarkerRef,
    totalPlaceData,
    isLoadingPlaces,
    isFavoriteMode,
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
    selectedPlace,
    selectedMarkerRef,
    resetSelectedMarkerAndInfoWindow,
    openInfoWindowForPlace,
    handlePlaceSelect,
    setIsSidebarOpen,
    setSelectedPlace,
    isLocating,
    getCurrentLocation,
    currentLocation,
    defaultCenterRef,
    isInitialSearchFitRef,
    modalOpen,
    setModalOpen,
    modalMode,
    setModalMode,
    createPlaceInfo,
    setCreatePlaceInfo,
    groupPlaceByLocation,
    backupGroupMarkerRef
  } = useMapContext();

  // 검색 관련 상태
  const [autoCompleteItems, setAutoCompleteItems] = useState<ViewNightSpot[]>([]);
  const [isAutoCompleteVisible, setIsAutoCompleteVisible] = useState<boolean>(false);

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
    }
  }, [isNaverReady, directionResult]);

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

  // 마커 생성 함수
  const createSingleMarker = useCallback(
    (place: ViewNightSpot) => {
      if (!mapInstanceRef.current || !isNaverReady || !place.LA || !place.LO || !window.naver)
        return null;

      const { naver } = window;

      const isSelectedPlace = selectedMarkerRef.current && selectedMarkerRef.current.type==='single'
        ? selectedMarkerRef.current.pdata.ID === place.ID
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
      const markerWithData: MarkerWithData = {
        marker,
        lat: Number(place.LA),
        lng: Number(place.LO),
        type: 'single',
        pdata: place,
      };

      if (isSelectedPlace) {
        selectedMarkerRef.current = markerWithData;
        setSelectedPlace(place);
      }

      // 마커 클릭 이벤트
      marker.addListener('click', () => {
        if (backupGroupMarkerRef.current) {
          backupGroupMarkerRef.current = null;
        }
        handlePlaceSelect(place);
      });

      // 마우스 오버 이벤트
      marker.addListener('mouseover', () => {
        marker.setZIndex(1001);
      });

      // 마우스 아웃 이벤트
      marker.addListener('mouseout', () => {
        if (selectedMarkerRef.current?.marker !== marker) {
          marker.setZIndex(defaultZIndex);
        } 
      });

      return markerWithData;
    },
    [isNaverReady, createMarkerIcon, handlePlaceSelect, setSelectedPlace],
  );

  // 그룹 마커 생성 함수
  const createGroupMarker = useCallback(
    (group: ClusteredPlace) => {
      if (!isNaverReady || !window.naver) return null;

      const { naver } = window;
      const defaultZIndex = 50;

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(group.representativeLat, group.representativeLng),
        map: undefined,
        icon: {
          content: renderToString(
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-pink-800 shadow-lg">
              <span className="text-white">{group.count}</span>
            </div>,
          ),
          anchor: new naver.maps.Point(20, 20),
        },
        zIndex: defaultZIndex,
      });

      // 마커 데이터 쌍 생성
      const markerWithData: MarkerWithData = {
        marker,
        lat: group.representativeLat,
        lng: group.representativeLng,
        type: 'group',
        pdataList: group.places,
      };

      // 마커 클릭 이벤트
      naver.maps.Event.addListener(marker, 'click', () => {
        // 기존 선택 초기화
        resetSelectedMarkerAndInfoWindow();
        
        
        // 해당 장소의 그룹마커 찾기
        const markerPair = markersRef.current.find(
          (pair) => pair.lat === group.representativeLat && pair.lng === group.representativeLng
        );
        
        if (markerPair && markerPair.type === 'group') {
          backupGroupMarkerRef.current = { ...markerPair };
          selectedMarkerRef.current = { ...markerPair };
          
          markerPair.marker.setZIndex(1000);
          
          // 인포윈도우 열기
          openInfoWindowForPlace();
        }

        

        

        
      });

      // 마우스 오버 이벤트
      marker.addListener('mouseover', () => {
        marker.setZIndex(1001);
      });

      // 마우스 아웃 이벤트
      marker.addListener('mouseout', () => {
        if (selectedMarkerRef.current?.marker !== marker) {
          marker.setZIndex(defaultZIndex);
        }
      });

      return markerWithData;
    },
    [isNaverReady, createMarkerIcon, resetSelectedMarkerAndInfoWindow, openInfoWindowForPlace],
  );

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
    if (selectedMarkerRef.current && selectedMarkerRef.current.type === 'single') {
      // 선택된 마커가 있으면 인포윈도우 열기
      const { marker, pdata } = selectedMarkerRef.current;

      // 마커 스타일 업데이트
      const iconConfig = createMarkerIcon(pdata, true);
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

  // 검색 핸들러
  const handleSearch = useCallback(() => {
    if (!searchKeyword.trim()) {
      setIsSearchMode(false);
      updateVisibleMarkers();
      return;
    }

    setIsAutoCompleteVisible(false);
    setIsSearchMode(true);
    isInitialSearchFitRef.current = false;

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
        (place: ViewNightSpot) =>
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
    

    const groupedPlaces = groupPlaceByLocation(totalPlaceData);

    groupedPlaces.forEach((placeGroup) => {
      if (placeGroup.count === 1) {
        // 단일 마커 생성 (기존 방식)
        const singleMarker = createSingleMarker(placeGroup.places[0]);
        if (singleMarker) {
          newMarkers.push(singleMarker);
        }
      } else {
        // 그룹 마커 생성
        const groupMarker = createGroupMarker(placeGroup);
        if (groupMarker) {
          newMarkers.push(groupMarker);
        }
      }
    });
    
    if (selectedMarkerRef.current) {
      const newSelectedPlaceData = totalPlaceData.find(
        (place) =>
          Number(place.LA) === selectedMarkerRef.current!.lat &&
          Number(place.LO) === selectedMarkerRef.current!.lng,
      );
      if (newSelectedPlaceData) {
        selectedMarkerRef.current.marker.setMap(null);
        selectedMarkerRef.current = createSingleMarker(newSelectedPlaceData)!;
      }
    }
    
    if (backupGroupMarkerRef.current) {
      // 해당 장소의 마커 찾기
      const markerPair = newMarkers.find(
        (pair) =>
          pair.lat === backupGroupMarkerRef.current!.lat &&
          pair.lng === backupGroupMarkerRef.current!.lng
      );
      if (markerPair && markerPair.type === 'group') {
        backupGroupMarkerRef.current.marker.setMap(null);
        backupGroupMarkerRef.current = markerPair;
      }
    }

    markersRef.current = newMarkers;
    

    // 필터링 및 가시성 업데이트
    updateVisibleMarkers();
  }, [isNaverReady, totalPlaceData, groupPlaceByLocation, createSingleMarker, createGroupMarker, updateVisibleMarkers]);

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
        center: currentLocation ?? defaultCenterRef.current,
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

  // 좌표를 주소로 변환하는 함수
  const getAddressFromLatLng = useCallback(
    (
      coords: naver.maps.CoordLiteral,
      callback: (address: naver.maps.Service.ReverseGeocodeAddress | null) => void,
    ): void => {
      naver.maps.Service.reverseGeocode(
        {
          coords: coords,
          orders: [naver.maps.Service.OrderType.ADDR, naver.maps.Service.OrderType.ROAD_ADDR].join(
            ',',
          ),
        },
        (
          status: naver.maps.Service.Status,
          response: naver.maps.Service.ReverseGeocodeResponse,
        ) => {
          if (status === naver.maps.Service.Status.OK) {
            const result = response.v2;
            const address = result.address;

            callback({
              jibunAddress: address.jibunAddress || '',
              roadAddress: address.roadAddress || '',
            });
          } else {
            callback(null);
          }
        },
      );
    },
    [],
  );

  const handleMapClick = useCallback(
    (e: naver.maps.PointerEvent) => {
      if (!selectedMarkerRef.current) {
        const latlng = e.coord;

        getAddressFromLatLng(latlng, (addr) => {
          if (!mapInstanceRef.current) {
            return;
          }

          if (!addr) {
            console.error('주소를 찾을 수 없습니다.');
            return;
          }

          const content = `
          <div class="p-2.5 pt-1 max-w-[350px] break-keep text-sm text-zinc-900 shadow-lg">
            <div class="text-end"> 
            <button id="closeBtn" class="inline w-6 h-6 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="inline w-5 h-5" fill="none" stroke="currentColor" stroke-width="48">
          <path d="M368 368L144 144M368 144L144 368" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      </div>
            <p>${addr.roadAddress || addr.jibunAddress}</p>
            <div class="text-end"><button id="addPlaceBtn" class="text-xs underline cursor-pointer">내 장소 추가</button></div>
          </div>
        `;

          const infoWindow = new naver.maps.InfoWindow({
            content: content,
            borderWidth: 0,
            disableAnchor: false,
            disableAutoPan: true,
            backgroundColor: '#ffffffe6',
          });

          setTimeout(() => {
            document.getElementById('closeBtn')?.addEventListener('click', () => {
              infoWindow.close();
            });

            const btn = document.getElementById('addPlaceBtn');
            if (btn) {
              btn.onclick = () => {
                if (!user) {
                  alert('로그인이 필요한 기능입니다.');
                  return;
                }
                setModalMode('create');
                setModalOpen(true);
                setCreatePlaceInfo({
                  latlng: latlng,
                  address: addr.roadAddress || addr.jibunAddress,
                });
              };
            }
          }, 100);

          infoWindow.open(mapInstanceRef.current, latlng);
        });
      }

      resetSelectedMarkerAndInfoWindow();
      setIsSidebarOpen(false);
      if (isShowingPath) {
        clearPath();
      }
    },
    [
      clearPath,
      getAddressFromLatLng,
      isShowingPath,
      resetSelectedMarkerAndInfoWindow,
      setIsSidebarOpen,
      handlePlaceSelect,
    ],
  );

  // 이벤트 리스너 설정
  useEffect(() => {
    if (!mapInstanceRef.current || !isNaverReady || !window.naver) return;

    // 기존 리스너 제거
    mapInstanceRef.current.clearListeners('idle');
    mapInstanceRef.current.clearListeners('click');
    mapInstanceRef.current.clearListeners('drag');

    // 새 리스너 추가
    const idleListener = mapInstanceRef.current.addListener('idle', handleMapIdle);
    const clickListener = mapInstanceRef.current.addListener('click', (e) => handleMapClick(e));

    const dragListener = mapInstanceRef.current.addListener('drag', () => {
      setIsSidebarOpen(false);
    });

    return () => {
      if (window.naver) {
        naver.maps.Event.removeListener(idleListener);
        naver.maps.Event.removeListener(clickListener);
        naver.maps.Event.removeListener(dragListener);
      }
    };
  }, [
    isNaverReady,
    handleMapIdle,
    resetSelectedMarkerAndInfoWindow,
    isShowingPath,
    clearPath,
    setIsSidebarOpen,
    handleMapClick,
  ]);

  // 컴포넌트 마운트 시 실행되는 코드들
  useEffect(() => {
    updateCurrentLocationMarker();
  }, [updateCurrentLocationMarker]);

  // 모든 카테고리 필터 활성화 초기화
  useEffect(() => {
    const filterAll = SUBJECTS.map((filter) => filter.id);
    setActiveFilters(filterAll);
  }, [setActiveFilters]);

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
            filterBar={<FilterBar />}
          />
        }
        listViewBtn={<ListViewBtn />}
        favoriteViewBtn={<FavoriteViewBtn />}
      />
      <MapSideBar />
      {modalOpen && (createPlaceInfo || selectedPlace) && (
        <EditPlaceModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          createPlaceInfo={createPlaceInfo || undefined}
          updatePlaceInfo={selectedPlace || undefined}
        />
      )}
    </div>
  );
};
