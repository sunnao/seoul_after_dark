import DetailPlaceContext from '@/features/map/components/DetailPlaceContext';
import SimplePlaceCard from '@/features/map/components/SimplePlaceCard';
import { ViewNightSpot } from '@/features/map/types/mapTypes';
import { useEffect, useRef } from 'react';

import { IoClose } from 'react-icons/io5';
import { IoChevronBackOutline } from 'react-icons/io5';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  places: ViewNightSpot[];
  selectedPlace: ViewNightSpot | null;
  onPlaceSelect: (place: ViewNightSpot | null) => void;
}

const Sidebar = ({ isOpen, onClose, places, selectedPlace, onPlaceSelect }: SidebarProps) => {
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  // 사이드바 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 애니메이션 종료 후 hidden 클래스 적용
  const handleTransitionEnd = () => {
    if (!isOpen && sidebarRef.current) {
      sidebarRef.current.classList.add('hidden');
    }
  };

  return (
    <>
      <div
        ref={sidebarRef}
        className={`fixed right-0 bottom-0 left-0 z-100 max-h-full w-full overflow-y-auto rounded-t-xl bg-base-200 shadow-lg transition-transform duration-300 ease-in-out md:top-0 md:right-auto md:left-0 md:w-[400px] md:overflow-y-visible ${
          isOpen
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-x-[-400px] md:translate-y-0'
        }`}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* 사이드바 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-base-200 p-4">
          <h3 className="text-lg font-semibold">
            {selectedPlace ? (
              <div onClick={() => onPlaceSelect(null)}>
                <IoChevronBackOutline />
              </div>
            ) : (
              '장소 목록'
            )}
          </h3>
          <button onClick={onClose} className="p-2">
            <IoClose className="h-5 w-5" />
          </button>
        </div>

        {/* 사이드바 내용 */}
        <div className="h-[calc(100%-60px)] overflow-y-auto p-4">
          {selectedPlace ? (
            <DetailPlaceContext selectedPlace={selectedPlace} />
          ) : (
            <ul className="space-y-2">
              {places.map((place, index) => (
                <div onClick={() => onPlaceSelect(place)}>
                  <SimplePlaceCard key={index} place={place} />
                </div>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
