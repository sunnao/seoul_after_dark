import { useEffect, useRef, useState, useCallback } from 'react';
import { useScript } from '@/hooks/useScript';
import axios from 'axios';
import { useNaverObjInitialization } from '@features/map/hooks/useNaverObjInitialization';
import { useCurrentLocation } from '@features/map/hooks/useCurrentLocation';
import { ApiResponse, ViewNightSpot } from '@features/map/types/mapTypes';

export const Map = () => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const currentMarkerRef = useRef<naver.maps.Marker | null>(null);

  const [totalPlaceData, setTotalPlaceData] = useState<ViewNightSpot[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);
  const placeMarkersRef = useRef<naver.maps.Marker[]>([]);
  const seletedInfoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

  const [isScriptLoading, scriptError] = useScript(
    `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${
      import.meta.env.VITE_NAVER_MAP_API_KEY
    }`,
  );
  // prettier-ignore
  const defaultCenter: naver.maps.LatLngLiteral = { lat: 37.5666103, lng: 126.9783882 }; // 서울시청 기본값

  // 전체 장소 정보 가져오기 (API 호출) 함수 - useCallback으로 메모이제이션
  const fetchViewNightSpotData = useCallback(async () => {
    if (!isLoadingPlaces) setIsLoadingPlaces(true);

    try {
      // prettier-ignore
      const url = `http://openapi.seoul.go.kr:8088/${import.meta.env.VITE_SEOUL_API_KEY}/json/viewNightSpot/1/1000`;
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
            content:
              '<div style="background-color:#5CACF2;width:15px;height:15px;border-radius:50%;border:2px solid white;"></div>',
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

  // 현위치 마커 업데이트
  useEffect(() => {
    updateCurrentLocationMarker();
  }, [updateCurrentLocationMarker]);

  // 영역에 따라 마커 표시 여부 결정
  const updateVisibleMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady) return;

    const mapBounds = mapInstanceRef.current.getBounds();

    placeMarkersRef.current.forEach((marker) => {
      const isInBounds = mapBounds.hasPoint(marker.getPosition());
      marker.setMap(isInBounds ? mapInstanceRef.current : null);
    });
  }, [isNaverReady]);

  const createMarker = useCallback(
    (place: ViewNightSpot) => {
      if (!mapInstanceRef.current || !isNaverReady || !place.LA || !place.LO) return null;

      const { naver } = window;

      try {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(Number(place.LA), Number(place.LO)),
          map: undefined,
          title: place.TITLE,
          zIndex: 50,
        });

        // 마커 클릭 이벤트
        marker.addListener('click', () => {
          const infoWindow = new naver.maps.InfoWindow({
            content: `<div style="padding:5px;min-width:100px;color:black">${place.TITLE}</div>`,
            borderWidth: 1,
            disableAnchor: true,
          });

          infoWindow.open(mapInstanceRef.current!, marker);
          seletedInfoWindowRef.current = infoWindow;
        });

        return marker;
      } catch (e) {
        console.error('Failed to create marker', e, place);
        return null;
      }
    },
    [isNaverReady],
  );

  // totalPlaceData가 변경될 때만 장소 마커 참조 변경
  useEffect(() => {
    if (!mapInstanceRef.current || !isNaverReady) return;

    // 기존 장소 마커 제거
    placeMarkersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    placeMarkersRef.current = [];

    // 새 장소 마커 생성
    totalPlaceData.forEach((place) => {
      const marker = createMarker(place);
      if (marker !== null) {
        placeMarkersRef.current.push(marker);
      }
    });

    updateVisibleMarkers();
  }, [isNaverReady, totalPlaceData, createMarker, updateVisibleMarkers]);

  // 지도 초기화 함수
  const initMapElements = useCallback(() => {
    if (!mapInstanceRef.current) return;

    const { naver } = window;

    // 현위치 버튼 추가
    const locationBtnHtml = `
    <button class="location-btn" style="
      width: 32px; 
      height: 32px; 
      margin-right: 10px;
      background: white; 
      border: 1px solid #ddd; 
      border-radius: 2px; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.3);
      cursor: pointer;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.94 11A8 8 0 0 0 12.62 4.06a8.22 8.22 0 0 0-8.56 7.94"></path>
        <path d="M12 19.96A8.23 8.23 0 0 0 20.25 12"></path>
        <path d="M4.06 12a8.23 8.23 0 0 0 8.19 7.94"></path>
      </svg>
    </button>
  `;
    const currentLocationButton = new naver.maps.CustomControl(locationBtnHtml, {
      position: naver.maps.Position.RIGHT_CENTER,
    });
    naver.maps.Event.addDOMListener(currentLocationButton.getElement(), 'click', () =>
      getCurrentLocation(),
    );
    currentLocationButton.setMap(mapInstanceRef.current);

    // 지도 클릭 이벤트 추가
    mapInstanceRef.current.addListener('click', () => {
      if (seletedInfoWindowRef.current) {
        seletedInfoWindowRef.current.close();
        seletedInfoWindowRef.current = null;
      }
    });

    // 지도 이동 완료 이벤트 추가
    mapInstanceRef.current.addListener('idle', () => {
      updateVisibleMarkers();
    });
  }, [getCurrentLocation, updateVisibleMarkers]);

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
  }, [isNaverReady, getCurrentLocation, initMapElements]);

  return (
    <div className="map-container">
      {isScriptLoading && <div className="loading-indicator">지도 로딩 중...</div>}

      <div ref={mapDivRef} className={`h-[400px] w-full ${isNaverReady ? 'block' : 'hidden'}`} />

      {scriptError && <div className="error-message">지도 로드 실패</div>}

      {isLocating && <div className="locating-indicator">현재 위치 확인 중...</div>}
    </div>
  );
};
