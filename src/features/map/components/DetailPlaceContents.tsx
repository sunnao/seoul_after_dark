import { ViewNightSpot } from '@/features/map/types/mapTypes';
import parse from 'html-react-parser';
import { HiOutlineStar, HiStar } from 'react-icons/hi2';
import { useAuth } from '@/features/auth/hooks/useAuth';
import axios from 'axios';
import { useMapContext, useMapDirectionContext } from '@/features/map/context';
import { useCallback } from 'react';
import { DirectionPathResponse } from '@/features/map/context/MapDirectionContext';
import { FaRegClock } from 'react-icons/fa';
import { HiOutlinePhone } from 'react-icons/hi';
import { PiLinkSimpleBold } from 'react-icons/pi';
import { MdOutlineDirections } from 'react-icons/md';
import { GrEdit } from 'react-icons/gr';
import { RiDeleteBinLine } from 'react-icons/ri';

// 네이버 API 응답 타입 정의
interface NaverDirectionResponse {
  code: number;
  message: string;
  route: {
    traoptimal?: Array<DirectionPathResponse>;
  };
}

export const DetailPlaceContents = ({ selectedPlace }: { selectedPlace: ViewNightSpot }) => {
  const { user, updateUser, addFavorite, deleteFavorite } = useAuth();
  const { clearPath, showPath, startEndPoint } = useMapDirectionContext();
  const {
    setModalOpen,
    setModalMode,
    setIsSidebarOpen,
    selectedInfoWindowRef,
    selectedMarkerRef,
    setSelectedPlace,
    totalPlaceData,
    setTotalPlaceData,
  } = useMapContext();

  const toogleFavorite = (isAddFavoriteMode: boolean) => {
    if (isAddFavoriteMode) {
      addFavorite(selectedPlace.ID);
    } else {
      deleteFavorite(selectedPlace.ID);
    }
    setTotalPlaceData(
      totalPlaceData.map((place) =>
        place.ID === selectedPlace.ID ? { ...place, IS_FAVORITE: isAddFavoriteMode } : place,
      ),
    );
  };

  const fetchDirectionAPI = useCallback(async () => {
    try {
      // API 요청
      const result = await axios.get<NaverDirectionResponse>('/driving', {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': import.meta.env.VITE_NAVER_MAP_API_KEY,
          'X-NCP-APIGW-API-KEY': import.meta.env.VITE_NAVER_SECRET_KEY,
        },
        params: {
          start: `${startEndPoint?.start.lng},${startEndPoint?.start.lat}`,
          goal: `${startEndPoint?.end.lng},${startEndPoint?.end.lat}`,
        },
      });

      if (result.data.code === 0) {
        showPath(result.data.route.traoptimal?.[0] as DirectionPathResponse);
      } else {
        console.error(result.data);
        alert(result.data.message);
      }
    } catch (e) {
      console.error('Fetch Direction API Error:', e);
      alert('경로를 가져오는 중 오류가 발생했습니다.');
      clearPath();
    }
  }, [startEndPoint]);
  
  const deletePlace = () => {
    if (!user) {
      return;
    }
    
    const checkDelete = confirm('정말 삭제하시겠습니까?');
    if (!checkDelete) {
      return;
    } 
    
    setIsSidebarOpen(false);
    
    const newUserInfo = { ...user };
    newUserInfo.customPlaces = (newUserInfo.customPlaces || []).filter(
      (place) => place.ID !== selectedPlace.ID,
    );

    if (selectedInfoWindowRef.current) {
      selectedInfoWindowRef.current.close();
      selectedInfoWindowRef.current = null;
    }

    if (selectedMarkerRef.current) {
      const { marker } = selectedMarkerRef.current;
      marker.setMap(null);
      selectedMarkerRef.current = null;
    }
    
    setSelectedPlace(null);
    setTimeout(() => updateUser(newUserInfo), 500);
  };

  return (
    <>
      <div className="bg-base-100 text-base-content">
        {/* Top */}
        <div className="border-b-1 border-base-content/10 bg-base-300/80 p-6">
          <div className="flex justify-between">
            <span className="text-sm text-gray-400 dark:text-gray-500">
              업데이트: {selectedPlace.MOD_DATE.slice(0, 16)}
            </span>
            {selectedPlace.ID.startsWith('my_') && (
              <div className="flex">
                <button
                  onClick={() => {
                    setModalMode('update');
                    setModalOpen(true);
                  }}
                  className="flex items-center px-2 text-sm text-gray-400 hover:cursor-pointer hover:underline dark:text-gray-500"
                >
                  <GrEdit className="h-4 w-4" />
                  <span>수정</span>
                </button>
                <button
                  onClick={deletePlace}
                  className="flex items-center pl-2 text-sm text-gray-400 hover:cursor-pointer hover:underline dark:text-gray-500"
                >
                  <RiDeleteBinLine className="h-4 w-4" />
                  <span>삭제</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex items-start justify-between">
            <div className="w-full pr-4">
              <div className="mt-3 flex items-center gap-2">
                <span className="badge text-xs font-medium badge-neutral">
                  {selectedPlace.SUBJECT_CD}
                </span>
              </div>
              <h2 className="mt-1 text-xl leading-snug font-bold break-words">
                {selectedPlace.TITLE}
              </h2>
              <p className="mt-1 break-words text-gray-500 dark:text-gray-400">
                {selectedPlace.ADDR}
              </p>
            </div>

            <button
              onClick={() => toogleFavorite(!selectedPlace.IS_FAVORITE)}
              className="hover:cursor-pointer"
            >
              {selectedPlace.IS_FAVORITE ? (
                <HiStar className="mt-1 h-8 w-8 text-amber-400" />
              ) : (
                <HiOutlineStar className="mt-1 h-8 w-8" />
              )}
            </button>
          </div>
          <button onClick={fetchDirectionAPI} className="btn mt-4 pl-2 btn-outline btn-sm">
            <MdOutlineDirections className="h-4 w-4" />
            길찾기
          </button>
        </div>

        {/* Middle */}
        {(selectedPlace.OPERATING_TIME || selectedPlace.TEL_NO || selectedPlace.URL) && (
          <div className="p-6">
            <div className="space-y-2">
              {selectedPlace.OPERATING_TIME && (
                <div className="flex gap-2">
                  <FaRegClock className="w-5 flex-shrink-0 text-[27px]" />
                  <span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {selectedPlace.OPERATING_TIME}
                    </span>
                  </span>
                </div>
              )}

              {selectedPlace.TEL_NO && (
                <div className="flex gap-2">
                  <HiOutlinePhone className="w-5 flex-shrink-0 text-[27px]" />
                  <span className="text-gray-500 dark:text-gray-400">{selectedPlace.TEL_NO}</span>
                </div>
              )}

              {selectedPlace.URL && (
                <div className="flex gap-2">
                  <PiLinkSimpleBold className="w-5 flex-shrink-0 text-[27px]" />
                  <a
                    href={selectedPlace.URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {selectedPlace.URL}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom */}
        {selectedPlace.CONTENTS && (
          <div className="border-t-1 border-base-content/10 p-6">
            <div className="[&_*]:!text-base [&_*]:text-gray-500 dark:[&_*]:!text-gray-400">
              {parse(selectedPlace.CONTENTS)}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
