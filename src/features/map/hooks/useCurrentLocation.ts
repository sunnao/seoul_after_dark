import { useState, useCallback } from 'react';

export const useCurrentLocation = () => {
  const [currentLocation, setCurrentLocation] = useState<naver.maps.LatLngObjectLiteral | null>(
    null,
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);

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
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        alert('위치 정보를 가져올 수 없습니다.');
      } else if (error.code === error.TIMEOUT) {
        alert('위치 정보 호출 시간이 초과되었습니다.');
      }
    };

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(updateCurrentGeo, errorCurrentGeo, geoOptions);
  }, []);

  return { currentLocation, isLocating, getCurrentLocation };
};
