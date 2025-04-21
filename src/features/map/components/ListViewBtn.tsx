import { FaList } from 'react-icons/fa';
import { MdAltRoute } from 'react-icons/md';
import { useMapDirectionContext } from '@/features/map/context';

interface ListViewBtnProps {
  onHandleListViewBtn: () => void;
}

export const ListViewBtn = ({ onHandleListViewBtn }: ListViewBtnProps) => {
	const { isShowingPath } = useMapDirectionContext();

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
