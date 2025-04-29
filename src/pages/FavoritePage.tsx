import { useAuth } from '@/features/auth/hooks/useAuth';
import { ApiResponse, ViewNightSpot } from '@/features/map/types/mapTypes';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { SUBJECTS } from '@/features/map/constants/subjects';
import { RiDeleteBinLine } from 'react-icons/ri';
import { ImSpinner2 } from 'react-icons/im';
export const FavoritePage = () => {
  const { user, authLoading, deleteFavorite } = useAuth();
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [totalFavoritePlaces, setTotalFavoritePlaces] = useState<ViewNightSpot[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<ViewNightSpot[]>([]);

  const fetchViewNightSpotData = useCallback(async () => {
    if (authLoading) return;
    setIsLoadingPlaces(true);

    try {
      const url = `/api/${import.meta.env.VITE_SEOUL_API_KEY}/json/viewNightSpot/1/1000`;
      const result = await axios.get<ApiResponse>(url);

      if (result.data.viewNightSpot.RESULT.CODE === 'INFO-000') {
        const places = result.data.viewNightSpot.row;
        const placesAddIdAndFavorite: ViewNightSpot[] = places.map((place) => ({
          ...place,
          ID: `${place.LA}_${place.LO}`,
          IS_FAVORITE: (user?.favoritePlaceIds || []).includes(`${place.LA}_${place.LO}`),
        }));
        
        setTotalFavoritePlaces(placesAddIdAndFavorite);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPlaces(false);
    }
  }, [authLoading]);

  const handleDeleteFavorite = (id: string) => {
    deleteFavorite(id);
  };

  useEffect(() => {
    fetchViewNightSpotData();
  }, [fetchViewNightSpotData]);
  
  useEffect(() => {
    
    const placesAddIdAndFavorite = totalFavoritePlaces.map((place) => ({
      ...place,
      ID: `${place.LA}_${place.LO}`,
      IS_FAVORITE: (user?.favoritePlaceIds || []).includes(`${place.LA}_${place.LO}`),
    }));

    setFavoritePlaces(placesAddIdAndFavorite.filter((place) => place.IS_FAVORITE));
  }, [totalFavoritePlaces, user?.favoritePlaceIds]);

  return (
    <div className="h-full w-full">
      {isLoadingPlaces && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex-col justify-center align-middle">
          <ImSpinner2 className="h-10 w-10 animate-spin text-violet-600" />
        </div>
      )}
      <div className="p-10">
        <ul className="list rounded-box bg-base-100 shadow-md">
          <li className="p-4 pb-2 text-xs tracking-wide opacity-60">즐겨찾기 목록</li>

          {favoritePlaces.map((place) => (
            <li className="list-row hover:bg-base-300">
              <div>
                <div className="size-10 rounded-box border-2 border-base-content/50 bg-base-200">
                  <span
                    className={`flex size-full items-center justify-center text-2xl ${place.SUBJECT_CD === '가로/마을' && 'p-1 invert-[1]'}`}
                  >
                    {SUBJECTS.find((subject) => subject.id === place.SUBJECT_CD)?.icon}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <span className="text-xs font-semibold opacity-60">{place.SUBJECT_CD}</span>
              </div>

              <div className="list-col-grow">
                <div>{place.TITLE}</div>
                <div className="text-xs font-semibold opacity-60">{place.ADDR}</div>
              </div>

              <button
                onClick={() => handleDeleteFavorite(place.ID)}
                className="btn btn-square btn-ghost"
              >
                <RiDeleteBinLine className="text-xl" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
