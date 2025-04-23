import { FaList } from 'react-icons/fa';
import { MdAltRoute } from 'react-icons/md';
import { useMapContext, useMapDirectionContext } from '@/features/map/context';
import { useCallback } from 'react';

export const ListViewBtn = () => {
	const { isShowingPath } = useMapDirectionContext();
	const { isSidebarOpen, setIsSidebarOpen, selectedPlace, handlePlaceSelect } = useMapContext();
	
	const onHandleListViewBtn = useCallback(() => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      if (!isShowingPath) {
        handlePlaceSelect(null);
      }
    } else {
      if (selectedPlace) {
        if (isShowingPath) {
          setIsSidebarOpen(false);
        } else {
          setIsSidebarOpen(true);
          handlePlaceSelect(null);
        }
      } else {
        setIsSidebarOpen(false);
      }
    }
  }, [handlePlaceSelect, isShowingPath, isSidebarOpen, selectedPlace]);

  return (
    <button
      onClick={onHandleListViewBtn}
      className="btn flex cursor-pointer items-center justify-center rounded-4xl border border-neutral-300 bg-white px-4 py-2 shadow-lg"
    >
      {isShowingPath ? (
        <>
          <MdAltRoute className="h-4 w-4 text-gray-600" />
          <span className="text-[14px] text-gray-600">경로보기</span>
        </>
      ) : (
        <>
          <FaList className="h-4 w-4 text-gray-600" />
          <span className="text-[14px] text-gray-600">목록보기</span>
        </>
      )}
    </button>
  );
};
