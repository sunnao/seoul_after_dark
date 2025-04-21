import { useMapDirectionContext } from '@/features/map/context';
import { ViewNightSpot } from '@/features/map/types/mapTypes';

export const DirectionContents = ({ selectedPlace }: { selectedPlace: ViewNightSpot }) => {
  const { directionResult, startEndPoint, setPathPointIndex } = useMapDirectionContext();

  function formatDistance(meters: number): string {
    if (meters >= 1000) {
      const km = (meters / 1000).toFixed(1);
      return `${km.toLocaleString()}km`;
    }
    return `${meters.toLocaleString()}m`;
  }

  function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (minutes > 0) {
      return `${minutes}분`;
    } else {
      return `${seconds}초`;
    }
  }

  return (
    <>
    <div className="bg-base-100 text-base-content">
      {/* 경로 요약 정보 */}
        <div className="border-b-1 border-base-content/10 bg-base-300/80 p-6">
        <div className="flex items-center">
        <h4 className="mb-2 text-xl font-bold">
          {startEndPoint?.start?.lat === 37.5666103 && startEndPoint?.start?.lng === 126.9783882
            ? '서울시청'
            : '내위치'}
        </h4>
        <span className="ml-2">에서</span>
      </div>
      <div className="flex items-center">
        <h4 className="mb-2 text-xl font-bold">{selectedPlace.TITLE}</h4>
        <span className="ml-2">까지</span>
      </div>
      <div className="flex items-center">
        <p className="text-xl">{formatDistance(directionResult!.summary.distance)}</p>
        <p className="ml-2">
          약 {formatDuration(directionResult!.summary.duration)} 소요
          <span className="ml-1 text-gray-500">
            ({directionResult!.summary.departureTime.slice(11, 16)} 도착)
          </span>
        </p>
      </div>
        </div>
        
        {/* 경로 상세 목록 */}
      <div className="p-6">
        <div className="ml-1">상세경로</div>
      <ul className="relative mt-2 flex flex-col">
        {directionResult?.guide.map((guide, index) => (
          <li
            onClick={() => setPathPointIndex(guide.pointIndex)}
            key={index}
            className="relative flex cursor-pointer hover:bg-base-content/10 pt-2 px-2"
          >
            {/* Step Circle */}
            <div className="relative flex w-8 min-w-8 flex-col items-center">
              <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-white">
                {index + 1}
              </div>
            </div>
            
            {/* Step Line */}
            {index !== directionResult.guide.length - 1 && (
              <div className="absolute top-8 -bottom-8 left-6 z-1 w-1.5 -translate-x-1/2 bg-primary" />
            )}

            {/* Contents */}
            <div className="mb-3 ml-4">
              <p className="text-start">{guide.instructions}</p>
              <span className="text-sm text-gray-500">{formatDistance(guide.distance)}</span>
            </div>
          </li>
        ))}
      </ul>
        
      </div>
      
      
    </div>
      
    </>
  );
};
