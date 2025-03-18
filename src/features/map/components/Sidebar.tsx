import { ViewNightSpot } from '@/features/map/types/mapTypes';
import { useEffect, useRef } from 'react';

import { IoClose } from 'react-icons/io5';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  places: ViewNightSpot[];
  selectedPlace: ViewNightSpot | null;
}

const Sidebar = ({ isOpen, onClose, places, selectedPlace }: SidebarProps) => {
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

  return (
    <>
      <div
        ref={sidebarRef}
        className={`fixed right-0 bottom-0 left-0 z-100 max-h-full w-full overflow-y-auto rounded-t-xl bg-zinc-800 shadow-lg transition-transform duration-300 ease-in-out md:top-0 md:right-auto md:left-0 md:w-[400px] md:overflow-y-visible ${
          isOpen
            ? 'translate-y-0 md:translate-x-0 md:translate-y-0'
            : 'translate-y-full md:translate-x-[-400px] md:translate-y-0'
        }`}
      >
        {/* 사이드바 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-zinc-800 p-4">
          <h3 className="text-lg font-semibold">
            {selectedPlace ? selectedPlace.TITLE : '장소 목록'}
          </h3>
          <button onClick={onClose} className="p-2">
            <IoClose className="h-5 w-5 hover:text-violet-600" />
          </button>
        </div>

        {/* 사이드바 내용 */}
        <div className="h-[calc(100%-60px)] overflow-y-auto p-4">
          {selectedPlace ? (
            // 선택된 장소 상세 정보
            <div>
              <h4 className="mb-2 text-xl font-bold">{selectedPlace.TITLE}</h4>
              <p className="mb-2 text-gray-400">{selectedPlace.ADDR}</p>
              {selectedPlace.TEL_NO && (
                <p className="mb-2 text-gray-400">전화: {selectedPlace.TEL_NO}</p>
              )}
              {selectedPlace.URL && (
                <p className="mb-2 truncate text-blue-500">
                  <span className="mb-2 text-gray-400">홈페이지: </span>
                  <a href={selectedPlace.URL} target="_blank" rel="noopener noreferrer">
                    {selectedPlace.URL}
                  </a>
                </p>
              )}
              {/* <p className="mt-4 text-gray-700">{selectedPlace.CONTENTS}</p> */}
            </div>
          ) : (
            // 장소 목록
            <ul className="space-y-2">
              {places.map((place, index) => (
                <li
                  key={index}
                  className="cursor-pointer rounded-lg border p-3 hover:bg-gray-50 hover:text-zinc-800"
                >
                  <h4 className="font-medium">{place.TITLE}</h4>
                  <p className="truncate text-sm text-gray-500">{place.ADDR}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
