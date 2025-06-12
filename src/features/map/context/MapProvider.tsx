import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { MapContext, useMapDirectionContext } from '@/features/map/context';
import {
  ApiResponse,
  MarkerWithData,
  ViewNightSpot,
  clusteredPlace,
} from '@/features/map/types/mapTypes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNaverObjInitialization } from '@features/map/hooks/useNaverObjInitialization';
import { renderToString } from 'react-dom/server';
import { HiStar } from 'react-icons/hi2';
import { SUBJECTS } from '@/features/map/constants/subjects';
import { useScript } from '@/hooks/useScript';
import { useCurrentLocation } from '@/features/map/hooks/useCurrentLocation';
import { CreatePlaceInfo } from '@/features/map/components/EditPlaceModal';

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
  const backupGroupMarkerRef = useRef<MarkerWithData | null>(null);

  // UI 상태
  const [selectedPlace, setSelectedPlace] = useState<ViewNightSpot | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isFavoriteMode, setIsFavoriteMode] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [createPlaceInfo, setCreatePlaceInfo] = useState<CreatePlaceInfo | null>(null);

  // 검색 관련 상태
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);

  // 필터 상태
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // 지도 이동 관련 상태
  const isInitialSearchFitRef = useRef<boolean>(false);
  const previousZoomRef = useRef<number | null>(null);
  const previousCenterRef = useRef<naver.maps.CoordLiteral | null>(null);

  // 기본 중심 좌표 (서울시청)
  const defaultCenterRef = useRef<naver.maps.LatLngObjectLiteral>({
    lat: 37.5666103,
    lng: 126.9783882,
  });

  // 네이버 지도 스크립트 로드
  const [isScriptLoading, scriptError] = useScript(
    `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${
      import.meta.env.VITE_NAVER_MAP_API_KEY
    }&submodules=geocoder`,
  );

  // 네이버 객체 초기화
  const { isNaverReady } = useNaverObjInitialization(isScriptLoading, scriptError);

  // 현위치 불러오기
  const { isLocating, getCurrentLocation, currentLocation } = useCurrentLocation();

  // 전체 장소 정보 가져오기 (API 호출)
  const fetchViewNightSpotData = useCallback(async () => {
    setIsLoadingPlaces(true);

    try {
      const url = `/api/${import.meta.env.VITE_SEOUL_API_KEY}/json/viewNightSpot/1/1000`;
      const result = await axios.get<ApiResponse>(url);

      if (result.data.viewNightSpot.RESULT.CODE === 'INFO-000') {
        const places = result.data.viewNightSpot.row;
        const placesAddIdAndFavorite: ViewNightSpot[] = places.map((place) => ({
          ...place,
          ID: `${place.LA}_${place.LO}_${place.NUM}`,
          IS_FAVORITE: (user?.favoritePlaceIds || []).includes(
            `${place.LA}_${place.LO}_${place.NUM}`,
          ),
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

  // 중복 위치 그룹화 (마커 표시용)
  const groupPlaceByLocation = useCallback((places: ViewNightSpot[]) => {
    const locationGroups: {
      [key: string]: clusteredPlace;
    } = {};
    const tolerance = 0.0001; // 위치 허용 오차

    places.forEach((place) => {
      // 위도경도를 허용단위만큼 반올림한 값으로 키 설정
      const key = `${Math.round(Number(place.LA) / tolerance) * tolerance}_${Math.round(Number(place.LO) / tolerance) * tolerance}`;

      if (!locationGroups[key]) {
        locationGroups[key] = {
          representativeLat: place.LA,
          representativeLng: place.LO,
          places: [],
          count: 0,
        };
      }

      locationGroups[key].places.push(place);
      locationGroups[key].count++;
    });

    return Object.values(locationGroups);
  }, []);

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
      if (
        !mapInstanceRef.current ||
        !isNaverReady ||
        places.length === 0 ||
        isInitialSearchFitRef.current
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

      mapInstanceRef.current.panToBounds(
        bounds,
        { duration: 200, easing: 'easeOutCubic' },
        { top: 100, right: 50, bottom: 100, left: 50 },
      );
      isInitialSearchFitRef.current = true;
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
      // 그룹에서 온 개별 선택인지 확인
      if (backupGroupMarkerRef.current) {
        selectedMarkerRef.current.marker.setMap(null);
        backupGroupMarkerRef.current.marker.setMap(mapInstanceRef.current);

        // markersRef에서 해당 마커 교체
        const markerIndex = markersRef.current.findIndex(
          (m) =>
            m.placesGroup &&
            m.placesGroup.representativeLat ===
              backupGroupMarkerRef.current!.placesGroup!.representativeLat &&
            m.placesGroup.representativeLng ===
              backupGroupMarkerRef.current!.placesGroup!.representativeLng,
        );

        if (markerIndex !== -1) {
          markersRef.current[markerIndex] = backupGroupMarkerRef.current;
        }

        // 원본 그룹 정보 초기화
        backupGroupMarkerRef.current = null;
        selectedMarkerRef.current = null;
      } else {
        const { marker, placeData, placesGroup } = selectedMarkerRef.current;
        if (placesGroup.count === 1) {
          const iconConfig = createMarkerIcon(placeData, false);

          if (iconConfig) {
            marker.setIcon(iconConfig);
          }
          marker.setZIndex(50);
        }
        selectedMarkerRef.current = null;
      }
    }
    setSelectedPlace(null);
  }, [createMarkerIcon]);

  // 선택된 장소에 해당하는 인포윈도우 열기
  const openInfoWindowForPlace = useCallback(() => {
    if (!mapInstanceRef.current || !isNaverReady || !selectedMarkerRef.current || !window.naver)
      return;

    const { naver } = window;
    const { placeData, marker, placesGroup } = selectedMarkerRef.current;

    // 그룹 데이터가 있는지 확인
    const isGrouped = placesGroup.count > 1;

    let infoWindowContent = '';

    if (isGrouped) {
      // 여러 장소인 경우 목록으로 표시
      const placesListHtml = placesGroup.places
        .map((place: ViewNightSpot) => {
          const iconContent = createMarkerIcon(place, false)?.content;
          return `
          <div 
            id="place-${place.ID}" 
            class="flex items-center gap-1 p-2 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
            data-place-id="${place.ID}"
          >
            ${iconContent}
            <div class="font-bold text-sm text-zinc-900">${place.TITLE}</div>
          </div>
        `;
        })
        .join('');

      infoWindowContent = `
      <div id="infoWindow" class="max-w-[280px] text-zinc-900 border-zinc-900 border-1 rounded shadow">
        <div class="max-h-[200px] overflow-y-auto">
          ${placesListHtml}
        </div>
      </div>`;
    } else {
      // 단일 장소인 경우 기존 방식
      infoWindowContent = `
      <div id="infoWindow" class="p-2.5 max-w-[250px] text-zinc-900 border-zinc-900 border-1 rounded shadow cursor-pointer">
        <h4 class="font-bold text-sm">${placeData.TITLE}</h4>
      </div>`;
    }

    const infoWindow = new naver.maps.InfoWindow({
      content: infoWindowContent,
      borderWidth: 0,
      disableAnchor: true,
      disableAutoPan: true,
    });

    // 인포윈도우 클릭 이벤트 추가
    setTimeout(() => {
      if (isGrouped) {
        // 그룹화된 경우 각 장소별 클릭 이벤트 추가
        placesGroup.places.forEach((place: ViewNightSpot) => {
          const placeElement = document.getElementById(`place-${place.ID}`);
          if (placeElement) {
            placeElement.addEventListener('click', (e) => {
              e.stopPropagation();
              handlePlaceSelect(place);
            });
          }
        });
      } else {
        // 단일 장소인 경우 기존 방식
        const infoWindowElement = document.getElementById('infoWindow');
        if (infoWindowElement) {
          infoWindowElement.addEventListener('click', () => handlePlaceSelect(placeData));
        }
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

      if (place) {
        // 선택된 마커가 그룹 마커인지 확인
        if (
          selectedMarkerRef.current?.placesGroup?.count &&
          selectedMarkerRef.current.placesGroup.count > 1
        ) {
          // 현재 선택된 그룹 마커 정보를 originGroupMarkerRef에 저장
          backupGroupMarkerRef.current = {
            marker: selectedMarkerRef.current.marker,
            placeData: selectedMarkerRef.current.placeData,
            placesGroup: selectedMarkerRef.current.placesGroup,
          };

          // 그룹 마커 숨기기
          selectedMarkerRef.current.marker.setMap(null);

          // 기존 인포윈도우 닫기
          if (selectedInfoWindowRef.current) {
            selectedInfoWindowRef.current.close();
            selectedInfoWindowRef.current = null;
          }

          // 선택된 장소의 개별 마커 생성
          const { naver } = window;
          const individualMarker = new naver.maps.Marker({
            position: new naver.maps.LatLng(Number(place.LA), Number(place.LO)),
            map: mapInstanceRef.current,
            icon: createMarkerIcon(place, true)!,
            zIndex: 1000,
          });

          // selectedMarkerRef를 개별 마커로 업데이트
          selectedMarkerRef.current = {
            marker: individualMarker,
            placeData: place,
            placesGroup: {
              representativeLat: place.LA,
              representativeLng: place.LO,
              places: [place],
              count: 1,
            },
          };

          // 인포윈도우 표시
          openInfoWindowForPlace();
        } else {
          // 일반적인 장소 선택 (기존 로직)
          resetSelectedMarkerAndInfoWindow();

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

            // 인포윈도우 표시
            openInfoWindowForPlace();
          }
        }

        // 공통 로직
        setSelectedPlace(place);
        setStartEndPoint({
          start: currentLocation || defaultCenterRef.current,
          end: { lat: Number(place.LA), lng: Number(place.LO) },
        });
        moveMapToPlace();
        openSidebar(place);
      } else {
        // 장소 선택 해제
        resetSelectedMarkerAndInfoWindow();
        setSelectedPlace(place);

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
      currentLocation,
      setStartEndPoint,
      openInfoWindowForPlace, // 의존성 배열에 추가
    ],
  );

  // 사용자 장소 데이터 추가
  // useEffect(() => {
  //   console.log('사용자 장소 데이터 추가 useEffect');
  //   console.log('totalPlaceData.length', totalPlaceData.length);

  //   if (!user || !totalPlaceData.length) return;

  //   const customPlaces = user.customPlaces || [];

  //   // 중복 방지를 위해 ID 체크
  //   const existingIds = new Set(totalPlaceData.map((place) => place.ID));

  //   const newCustomPlaces = customPlaces.filter((place) => !existingIds.has(place.ID));

  //   if (newCustomPlaces.length > 0) {
  //     setTotalPlaceData((prev) => [...prev, ...customPlaces]);
  //   }
  // }, [user, totalPlaceData]);

  useEffect(() => {
    // 인증 로딩이 완료된 경우에만 데이터 로드
    if (authLoading) {
      return;
    }

    // 초기 api 데이터 로드
    if (totalPlaceData.length === 0) {
      fetchViewNightSpotData();

      // 사용자 장소 데이터 추가
    } else {
      if (!user) return;

      const customPlaces = (user.customPlaces || []).map((place) => ({
        ...place,
        IS_FAVORITE: (user?.favoritePlaceIds || []).includes(`my_${place.LA}_${place.LO}`),
      }));

      const seoulApiPlaces = totalPlaceData.filter((place) => {
        if (!place.ID.startsWith('my_')) {
          return true;
        }
      });

      const newTotalPlaceData = [...seoulApiPlaces, ...customPlaces];

      const isCustomPlacesChanged =
        newTotalPlaceData.length !== totalPlaceData.length ||
        customPlaces.some((newplace) => {
          const originPlace = totalPlaceData.find((originPlace) => originPlace.ID === newplace.ID);

          return !originPlace || newplace.MOD_DATE !== originPlace.MOD_DATE;
        });

      if (isCustomPlacesChanged) {
        setTotalPlaceData(newTotalPlaceData);
      }
    }
  }, [authLoading, fetchViewNightSpotData, totalPlaceData, user]);

  const value = {
    mapInstanceRef,
    currentMarkerRef,
    totalPlaceData,
    setTotalPlaceData,
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
    selectedInfoWindowRef,
    resetSelectedMarkerAndInfoWindow,
    openInfoWindowForPlace,
    handlePlaceSelect,
    isSidebarOpen,
    setIsSidebarOpen,
    selectedPlace,
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
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};
