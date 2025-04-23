import { DetailPlaceContents } from '@/features/map/components/DetailPlaceContents';
import SimplePlaceCard from '@/features/map/components/SimplePlaceCard';
import { useMapDirectionContext } from '@/features/map/context';
import { useRef } from 'react';
import { FaList } from 'react-icons/fa6';
import { IoClose } from 'react-icons/io5';
import { DirectionContents } from '@/features/map/components/DirectionContents';
import { useMapContext } from '@/features/map/context';

export const MapSidebar = () => {
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const { isShowingPath } = useMapDirectionContext();
  const { visiblePlacesData, isSidebarOpen, setIsSidebarOpen, selectedPlace, handlePlaceSelect } = useMapContext();
  
  // 애니메이션 종료 후 hidden 클래스 적용
  const handleTransitionEnd = () => {
    if (!isSidebarOpen && sidebarRef.current) {
      sidebarRef.current.classList.add('hidden');
    }
  };

  return (
    <>
      <div
        ref={sidebarRef}
        className={`fixed right-0 bottom-0 left-0 z-100 max-h-full w-full overflow-y-auto rounded-t-xl bg-base-100 shadow-lg transition-transform duration-300 ease-in-out md:top-0 md:right-auto md:left-0 md:w-[400px] md:overflow-y-visible ${
          isSidebarOpen
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-x-[-400px] md:translate-y-0'
        }`}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* 사이드바 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-base-200 p-4">
          {!isShowingPath ? (
            <h3 className="text-lg font-semibold">
              {selectedPlace ? (
                <div onClick={() => handlePlaceSelect(null)}>
                  <FaList className="ml-2 h-4 w-4" />
                </div>
              ) : (
                `장소 목록 (${visiblePlacesData.length}건)`
              )}
            </h3>
          ) : (
            <span />
          )}
          <button onClick={() => setIsSidebarOpen(false)} className="p-2">
            <IoClose className="h-5 w-5" />
          </button>
        </div>

        {/* 사이드바 내용 */}
        <div className="h-[calc(100%-60px)] overflow-y-auto">
          {selectedPlace ? (
            isShowingPath ? (
              <DirectionContents selectedPlace={selectedPlace} />
            ) : (
              <DetailPlaceContents selectedPlace={selectedPlace} />
            )
          ) : (
            <ul className="space-y-3 px-4 py-5">
              {visiblePlacesData.map((place, index) => (
                <div key={index} onClick={() => handlePlaceSelect(place)}>
                  <SimplePlaceCard place={place} />
                </div>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};
