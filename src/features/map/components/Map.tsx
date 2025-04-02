import { useEffect, useRef, useState, useCallback } from 'react';
import { useScript } from '@/hooks/useScript';
import axios from 'axios';
import { useNaverObjInitialization } from '@features/map/hooks/useNaverObjInitialization';
import { useCurrentLocation } from '@features/map/hooks/useCurrentLocation';
import { ApiResponse, MarkerWithData, ViewNightSpot } from '@features/map/types/mapTypes';

import { MdOutlineMyLocation } from 'react-icons/md';
import { ImSpinner2 } from 'react-icons/im';
import { FaList } from 'react-icons/fa';
import { renderToString } from 'react-dom/server';
import { MapSidebar } from '@/features/map/components/MapSidebar';

export const Map = () => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const currentMarkerRef = useRef<naver.maps.Marker | null>(null);

  const [totalPlaceData, setTotalPlaceData] = useState<ViewNightSpot[]>([]);
  const [visiblePlacesData, setVisiblePlacesData] = useState<ViewNightSpot[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);

  const totalMarkerPlacePairRef = useRef<MarkerWithData[]>([]);
  const seletedInfoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const selectedMarkerPlacePairRef = useRef<MarkerWithData | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<ViewNightSpot | null>(null);
  const previousZoomRef = useRef<number | null>(null);
  const previousCenterRef = useRef<naver.maps.CoordLiteral | null>(null);

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
    mapInstanceRef.current.morph(placePosition, 17, { duration: 400, easing: 'easeOutCubic' });
  }, [isNaverReady]);
  
  

  // 영역에 따라 마커 표시 여부 결정
  const updateVisibleMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady) return;

    const mapBounds = mapInstanceRef.current.getBounds();
    const visibleData: ViewNightSpot[] = [];

    totalMarkerPlacePairRef.current.forEach(({ marker, placeData }) => {
      const isInBounds = mapBounds.hasPoint(marker.getPosition());
      marker.setMap(isInBounds ? mapInstanceRef.current : null);

      if (isInBounds) {
        visibleData.push(placeData);
      }
    });
    setVisiblePlacesData(visibleData);
    
    previousCenterRef.current = null;
    previousZoomRef.current = null;
  }, [isNaverReady]);

  const openSidebar = useCallback(
    (place: ViewNightSpot | null = null) => {
      console.log('open');
      setSelectedPlace(place);
      if (!isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    },
    [isSidebarOpen],
  );

  const closeSidebar = useCallback(() => {
    console.log('ekegla')
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isSidebarOpen]);

  const handlePlaceSelect = useCallback(
    (place: ViewNightSpot | null) => {
      console.log('click', place);
      setSelectedPlace(place);
      if (!mapInstanceRef.current) return;

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
        selectedMarkerPlacePairRef.current = null;

        if (seletedInfoWindowRef.current) {
          seletedInfoWindowRef.current.close();
          seletedInfoWindowRef.current = null;
        }
        if (previousCenterRef.current && previousZoomRef.current) {
          mapInstanceRef.current.morph(previousCenterRef.current, previousZoomRef.current, {
            duration: 400,
            easing: 'easeOutCubic',
          });
        }
      }
    },
    [moveMapToPlace],
  );

  const createMarker = useCallback(
    (place: ViewNightSpot) => {
      if (!mapInstanceRef.current || !isNaverReady || !place.LA || !place.LO) return null;

      const { naver } = window;

      try {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(Number(place.LA), Number(place.LO)),
          map: undefined,
          zIndex: 50,
        });

        // 마커 클릭 이벤트
        marker.addListener('click', () => {
          handlePlaceSelect(place);
        });

        return { marker, placeData: place };
      } catch (e) {
        console.error('Failed to create marker', e, place);
        return null;
      }
    },
    [isNaverReady, handlePlaceSelect],
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

  // 지도 초기화 함수
  const initMapElements = () => {
    if (!mapInstanceRef.current) return;

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
      <button className="mt-2.5 mr-2.5 flex cursor-pointer items-center justify-center rounded-4xl border border-gray-600 bg-white px-4 py-2 shadow transition-colors duration-150 hover:bg-gray-50 active:border-blue-600 active:bg-blue-500 active:text-white">
        <FaList className="h-4 w-4 text-gray-600 active:text-white" />
        <span className="text-gray-600">목록보기</span>
      </button>,
    );

    const listButton = new naver.maps.CustomControl(listBtnHtml, {
      position: naver.maps.Position.TOP_CENTER,
    });
    naver.maps.Event.addDOMListener(listButton.getElement(), 'click', () => {
      if (seletedInfoWindowRef.current) {
        seletedInfoWindowRef.current.close();
        seletedInfoWindowRef.current = null;
      }
      if (selectedMarkerPlacePairRef.current) {
        selectedMarkerPlacePairRef.current = null;
      }
      openSidebar(null);
    });
    listButton.setMap(mapInstanceRef.current);

    // 지도 클릭 이벤트 추가
    mapInstanceRef.current.addListener('click', () => {
      if (seletedInfoWindowRef.current) {
        seletedInfoWindowRef.current.close();
        seletedInfoWindowRef.current = null;
      }
      if (selectedMarkerPlacePairRef.current) {
        selectedMarkerPlacePairRef.current = null;
      }
      setSelectedPlace(null);
      closeSidebar();
    });

    // 지도 이동 완료 이벤트 추가
    mapInstanceRef.current.addListener('idle', () => {
      if (selectedMarkerPlacePairRef.current) {
        // 인포윈도우 열기
        openInfoWindowForPlace();
      } else {
        updateVisibleMarkers();
      }
    });
  };

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
      };

      mapInstanceRef.current = new naver.maps.Map(mapDivRef.current, mapOptions);
      mapInstanceRef.current.addListenerOnce('init', () => {
        initMapElements();
        getCurrentLocation();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNaverReady, getCurrentLocation, currentLocation]);

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
