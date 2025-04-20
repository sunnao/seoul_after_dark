import { HiStar, HiOutlineStar } from 'react-icons/hi';

interface FavoriteViewBtnProps {
	isFavoriteMode: boolean;
	onHandleFavoriteMode: () => void;
}

export const FavoriteViewBtn = ({
	isFavoriteMode,
	onHandleFavoriteMode,
}: FavoriteViewBtnProps) => {
  return (
    <button
      onClick={onHandleFavoriteMode}
      className="mr-2.5 flex h-8 w-8 cursor-pointer items-center justify-center border border-gray-600 bg-white text-gray-600 shadow transition-colors duration-150 active:bg-neutral-800 active:text-white"
    >
      {isFavoriteMode ? (
        <HiStar className="h-5 w-5 text-amber-400" />
      ) : (
        <HiOutlineStar className="h-5 w-5 text-gray-600 active:text-white" />
      )}
    </button>
  );
}
