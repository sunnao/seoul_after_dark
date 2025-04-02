import { ViewNightSpot } from '@/features/map/types/mapTypes';

interface SimplePlaceProps {
  place: ViewNightSpot;
}

const SimplePlaceCard = ({ place }: SimplePlaceProps) => {
  return (
    <li className="cursor-pointer rounded-lg border p-3 hover:bg-base-content hover:text-base-100">
      <h4 className="font-medium">{place.TITLE}</h4>
      <p className="truncate text-sm text-gray-500">{place.ADDR}</p>
    </li>
  );
};

export default SimplePlaceCard;
