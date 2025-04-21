import { HiStar, HiOutlineStar } from 'react-icons/hi';
import { useMapContext } from '@/features/map/context';
import { useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const FavoriteViewBtn = () => {
	const { isFavoriteMode, setIsFavoriteMode } = useMapContext();
	const { user, logout } = useAuth();
	
	const onHandleFavoriteMode = useCallback(() => {
    if (!user) {
      logout();
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    setIsFavoriteMode(!isFavoriteMode);
  }, [user, setIsFavoriteMode, isFavoriteMode, logout]);

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
