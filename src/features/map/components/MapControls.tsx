
import { FaChevronUp } from 'react-icons/fa';
import { useState } from 'react';

interface MapControlsProps {
  searchAndFilter: React.ReactNode;
  listViewBtn: React.ReactNode;
  favoriteViewBtn: React.ReactNode;
}

export const MapControls = ({ searchAndFilter, listViewBtn, favoriteViewBtn }: MapControlsProps) => {
	const [isContainerShow, setIsContainerShow] = useState<boolean>(true);
	
  return (
    <>
      {/* 검색 & 필터 영역 */}
      <div className="absolute top-2 right-0 left-0 z-10 mx-auto flex w-[90%] max-w-[800px] gap-2 md:w-[80%]">
        <div
          onClick={() => setIsContainerShow(!isContainerShow)}
          className="min-w-[20px] self-start rounded-md bg-white/90 p-1 shadow-md"
        >
          <FaChevronUp
            className={`h-full w-full text-neutral-600 transition-all duration-300 ${isContainerShow ? '' : 'rotate-180'}`}
          />
        </div>
				
				<div className={`${isContainerShow ? 'block' : 'hidden'} flex w-full gap-2`}>
					{searchAndFilter}
				</div>
      </div>

      {/* 목록보기 버튼 */}
      <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">{listViewBtn}</div>

      {/* 즐겨찾기 모드 버튼 */}
      <div className="absolute right-0 bottom-5 z-10">{favoriteViewBtn}</div>
    </>
  );
};
