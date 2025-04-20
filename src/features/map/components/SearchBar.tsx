import { FaSearch } from 'react-icons/fa';
import { TiDelete } from 'react-icons/ti';
import parse from 'html-react-parser';
import { ViewNightSpot } from '@/features/map/types/mapTypes';
import { useEffect, useCallback } from 'react';

interface SearchBarProps {
  searchKeyword: string;
  setSearchKeyword: (searchKeyword: string) => void;
  autoCompleteItems: ViewNightSpot[];
  setAutoCompleteItems: (items: ViewNightSpot[]) => void;
	isAutoCompleteVisible: boolean;
	setIsAutoCompleteVisible: (isAutoCompleteVisible: boolean) => void;
  setIsSearchMode: (isSearchMode: boolean) => void;
  handlePlaceSelect: (place: ViewNightSpot) => void;
  handleSearch: () => void;
  updateAutoComplete: (keyword: string) => void;
  updateVisibleMarkers: () => void;
  createMarkerIcon: (
    place: ViewNightSpot,
    isSelected?: boolean,
  ) => {
    content: string;
    anchor: naver.maps.Point;
  } | null;
}
export const SearchBar = ({
  searchKeyword,
  setSearchKeyword,
  autoCompleteItems,
  setAutoCompleteItems,
	isAutoCompleteVisible,
	setIsAutoCompleteVisible,
  setIsSearchMode,
  handlePlaceSelect,
  handleSearch,
  updateAutoComplete,
  updateVisibleMarkers,
  createMarkerIcon,
}: SearchBarProps) => {

  // 검색어 변경 핸들러
  const handleSearchInputChange = useCallback(
    (newKeyword: string) => {
      setSearchKeyword(newKeyword);
      updateAutoComplete(newKeyword);
    },
    [setSearchKeyword, updateAutoComplete],
  );

  // 자동완성 항목 선택 핸들러
  const handleAutoCompleteSelect = useCallback(
    (place: ViewNightSpot) => {
      setSearchKeyword(place.TITLE);
      setIsAutoCompleteVisible(false);

      // 해당 장소 선택
      handlePlaceSelect(place);
    },
    [handlePlaceSelect, setIsAutoCompleteVisible, setSearchKeyword],
  );

  // 검색창 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = () => {
			
      setIsAutoCompleteVisible(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [setIsAutoCompleteVisible]);

  return (
    <>
      {/* 검색창 */}
      <div className="flex w-full items-center gap-2">
        <FaSearch className={'ml-1 h-5 w-5 text-neutral-500 sm:ml-3'} />
        <div className="flex flex-grow items-center">
          <input
            type="text"
            placeholder="장소명 또는 주소 검색"
            className="caret-grat-800 w-full border-none bg-transparent text-gray-700 focus:outline-none"
            value={searchKeyword}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onClick={(e) => {
              e.stopPropagation();
              if (searchKeyword.length >= 2) {
                setIsAutoCompleteVisible(true);
                handleSearchInputChange(searchKeyword);
              }
            }}
          />
          {searchKeyword && (
            <button
              className="mr-1 p-1 text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                setSearchKeyword('');
                setIsSearchMode(false);
                setAutoCompleteItems([]);
                updateVisibleMarkers();
              }}
            >
              <TiDelete className="text-xl" />
            </button>
          )}

          <button
            className="btn rounded-full bg-neutral-800 px-4 py-2 text-white btn-xs md:btn-sm"
            onClick={handleSearch}
          >
            <FaSearch className="md:h-4 md:w-4" />
          </button>
        </div>
      </div>

      {/* 자동완성 */}
      {isAutoCompleteVisible && (
        <div
          className="absolute top-full right-0 left-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg bg-white/95 shadow-lg"
          style={{ width: 'calc(100% - 31px)', marginLeft: '31px' }}
        >
          {autoCompleteItems.length > 0 ? (
            autoCompleteItems.map((place, index) => (
              <div
                key={`${place.TITLE}-${index}`}
                className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAutoCompleteSelect(place);
                }}
              >
                <div>{parse(createMarkerIcon(place, false)?.content || '')}</div>
                <div>
                  <div className="font-medium text-gray-800">{place.TITLE}</div>
                  <div className="text-sm text-gray-500">{place.ADDR}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">일치하는 장소가 없습니다.</div>
          )}
        </div>
      )}
    </>
  );
};
