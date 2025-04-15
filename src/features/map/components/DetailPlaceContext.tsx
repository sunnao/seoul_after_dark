import { ViewNightSpot } from '@/features/map/types/mapTypes';
import parse from 'html-react-parser';
import { HiOutlineStar, HiStar } from 'react-icons/hi2';
import { useAuth } from '@/features/auth/hooks/useAuth';
import axios from 'axios';
import { useMapContext } from '@/features/map/context';
import { useCallback } from 'react';
import { DirectionPathResponse } from '@/features/map/context/MapContext';

// 네이버 API 응답 타입 정의
interface NaverDirectionResponse {
  code: number;
  message: string;
  route: {
    traoptimal?: Array<DirectionPathResponse>;
  };
}

const DetailPlaceContext = ({ selectedPlace }: { selectedPlace: ViewNightSpot }) => {
  const { addFavorite, deleteFavorite } = useAuth();
  const { clearPath, showPath, startEndPoint } = useMapContext();

  const toogleFavorite = (isAddFavoriteMode: boolean) => {
    if (isAddFavoriteMode) {
      addFavorite(selectedPlace.ID);
    } else {
      deleteFavorite(selectedPlace.ID);
    }
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
  }, []);

  return (
    <>
      <div className="text-end">
        <p className="mb-2 text-xs text-gray-400">
          업데이트: {selectedPlace.MOD_DATE.slice(0, 16)}
        </p>
      </div>
      <div className="text-start">
        <span className="mb-1 badge badge-neutral">{selectedPlace.SUBJECT_CD}</span>
        <div className="flex">
          <div
            onClick={() => toogleFavorite(!selectedPlace.IS_FAVORITE)}
            className="cursor-pointer pr-1 text-[27px]"
          >
            {selectedPlace.IS_FAVORITE ? <HiStar className="text-amber-400" /> : <HiOutlineStar />}
          </div>

          <h4 className="mb-2 text-xl font-bold">{selectedPlace.TITLE}</h4>
        </div>
        <p className="mb-2 text-gray-400">{selectedPlace.ADDR}</p>
        <button className="btn btn-sm" onClick={fetchDirectionAPI}>
          길찾기
        </button>
        {selectedPlace.OPERATING_TIME && (
          <p className="mb-2 hover:text-base-content">
            운영시간: <span className="mb-2 text-gray-400">{selectedPlace.OPERATING_TIME}</span>
          </p>
        )}
        {selectedPlace.TEL_NO && (
          <p className="mb-2 hover:text-base-content">
            전화: <span className="mb-2 text-gray-400">{selectedPlace.TEL_NO}</span>
          </p>
        )}
        {selectedPlace.URL && (
          <p className="mb-2 hover:text-base-content">
            홈페이지:{' '}
            <a
              className="break-all text-blue-500"
              href={selectedPlace.URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {selectedPlace.URL}
            </a>
          </p>
        )}
        {selectedPlace.CONTENTS && (
          <div className="mt-4 text-gray-400">{parse(selectedPlace.CONTENTS)}</div>
        )}
      </div>
    </>
  );
};

export default DetailPlaceContext;
