import { useEffect, useRef, useState, useCallback } from 'react';
import { useScript } from '../hooks/useScript';
import axios from 'axios';

// API 응답 타입 정의
interface ViewNightSpotResult {
  RESULT: {
    CODE: string;
    MESSAGE: string;
  };
  row: ViewNightSpot[];
}

interface ViewNightSpot {
  SUBJECT_CD: string;
  TITLE: string;
  ADDR: string;
  LA: string;
  LO: string;
  TEL_NO: string;
  URL: string;
  OPERATING_TIME: string;
  FREE_YN: string;
  ENTR_FEE: string;
  CONTENTS: string;
  SUBWAY: string;
  BUS: string;
  PARKING_INFO: string;
  REG_DATE: string;
  MOD_DATE: string;
}

interface ApiResponse {
  viewNightSpot: ViewNightSpotResult;
}

export const Map = () => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const currentMarkerRef = useRef<naver.maps.Marker | null>(null);

  const [isNaverReady, setNaverReady] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<naver.maps.CoordLiteral | null>(null);

  const [totalPlaceData, setTotalPlaceData] = useState<ViewNightSpot[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);
  const [placeMarkers, setPlaceMarkers] = useState<naver.maps.Marker[]>([]);
  const seletedInfoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

  const [isScriptLoading, scriptError] = useScript(
    `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${
      import.meta.env.VITE_NAVER_MAP_API_KEY
    }`
  );
  const defaultCenter: naver.maps.LatLngLiteral = { lat: 37.5666103, lng: 126.9783882 }; // 서울시청 기본값

  // 전체 장소 정보 가져오기 (API 호출) 함수 - useCallback으로 메모이제이션
  const fetchViewNightSpotData = useCallback(async () => {

    if (!isLoadingPlaces) setIsLoadingPlaces(true);

    try {
      // prettier-ignoer
      const url = `http://openapi.seoul.go.kr:8088/${
        import.meta.env.VITE_SEOUL_API_KEY
      }/json/viewNightSpot/1/1000`;
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

  // 네이버 객체 준비 확인 - useCallback으로 메모이제이션
  const checkNaverAvailability = useCallback(() => {
    if (window.naver && window.naver.maps) {
      setNaverReady(true);
      return true;
    } else {
      setNaverReady(false);
      return false;
    }
  }, []);

  // 스크립트 로딩 완료 후 naver 객체 유무 확인
  useEffect(() => {
    if (scriptError) return;

    if (!isScriptLoading) {
      // naver 객체 즉시 확인 될 때
      if (checkNaverAvailability()) return;

      // naver 객체 로드 지연 시 반복 확인
      const checkNaver = setInterval(() => {
        if (checkNaverAvailability()) {
          clearInterval(checkNaver);
        }
      }, 500);

      // 5초 후 타임아웃 처리
      const timeoutId = setTimeout(() => {
        clearInterval(checkNaver);
        if (!checkNaverAvailability()) {
          console.error('Naver Maps API failed to initialize');
        }
      }, 5000);

      return () => {
        clearInterval(checkNaver);
        clearTimeout(timeoutId);
      };
    }
  }, [isScriptLoading, scriptError, checkNaverAvailability]);

  // 현재 위치 가져오기 함수 - useCallback으로 메모이제이션
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);

    const updateCurrentGeo = (position: GeolocationPosition) => {
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setIsLocating(false);
    };

    const errorCurrentGeo = (error: GeolocationPositionError) => {
      console.error('Error getting current location:', error);
      setCurrentLocation(null);
      setIsLocating(false);

      if (error.code === error.PERMISSION_DENIED) {
        alert(
          '위치 정보 제공이 거부되었습니다.\n브라우저 설정에서 위치 정보 제공을 허용해 주세요.'
        );
      }
    };

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(updateCurrentGeo, errorCurrentGeo, geoOptions);
  }, []);

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

  // 장소 마커 업데이트 함수 - useCallback으로 메모이제이션
  const updatePlaceMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady) return;

    const { naver } = window;

    // 기존 장소 마커 제거
    if (placeMarkers.length > 0) {

      placeMarkers.forEach((marker) => {
        marker.setMap(null);
      });
      setPlaceMarkers([]);
    }

    // 새 장소 마커 생성
    const newPlaceMarkerList: naver.maps.Marker[] = [];
    totalPlaceData.forEach((place) => {
      if (!place.LA || !place.LO) return;

      try {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(Number(place.LA), Number(place.LO)),
          map: mapInstanceRef.current!,
          title: place.TITLE,
          // icon: {
          //   content: `<div style="background-color:#FF6B6B;width:10px;height:10px;border-radius:50%;border:1px solid white;"></div>`,
          //   anchor: new naver.maps.Point(5, 5),
          // },
          zIndex: 50,
        });

        // 마커 클릭 이벤트
        naver.maps.Event.addListener(marker, 'click', () => {
          const infoWindow = new naver.maps.InfoWindow({
            content: `<div style="padding:5px;min-width:100px;color:black">${place.TITLE}</div>`,
            borderWidth: 1,
            disableAnchor: true,
          });

          infoWindow.open(mapInstanceRef.current!, marker);
          seletedInfoWindowRef.current = infoWindow;
        });

        newPlaceMarkerList.push(marker);
      } catch (e) {
        console.error('마커 생성 실패', e, place);
      }
    });
    setPlaceMarkers(newPlaceMarkerList);
  }, [isNaverReady, totalPlaceData]);

  useEffect(() => {
    updatePlaceMarkers();
  }, [updatePlaceMarkers]);

  // 지도 초기화 및 이벤트 설정
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

      // 현위치 버튼 추가
      naver.maps.Event.once(mapInstanceRef.current, 'init', () => {
        const locationBtnHtml = `
          <button class="location-btn" style="
            width: 34px; 
            height: 34px; 
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

        currentLocationButton.setMap(mapInstanceRef.current);

        naver.maps.Event.addDOMListener(currentLocationButton.getElement(), 'click', (e) => {
          e.preventDefault(); // 링크 기본 동작 방지
          getCurrentLocation();
        });

        // 지도 클릭 이벤트 추가
        naver.maps.Event.addListener(mapInstanceRef.current, 'click', () => {
          if (seletedInfoWindowRef.current) {
            seletedInfoWindowRef.current.close();
            seletedInfoWindowRef.current = null;
          }
        });

        getCurrentLocation();
      });
    }
  }, [isNaverReady, getCurrentLocation]);

  return (
    (
      <div className="map-container">
        {isScriptLoading && <div className="loading-indicator">지도 로딩 중...</div>}

        <div
          ref={mapDivRef}
          style={{
            width: '100%',
            height: '400px',
            display: isNaverReady ? 'block' : 'none',
          }}
        />

        {scriptError && <div className="error-message">지도 로드 실패</div>}

        {isLocating && <div className="locating-indicator">현재 위치 확인 중...</div>}
      </div>
    )
  );
};
