import { ViewNightSpot } from "@/features/map/types/mapTypes";

interface SimplePlaceProps {
  index: number;
  place: ViewNightSpot;
}

const SimplePlaceCard = ({ index, place }: SimplePlaceProps) => {
  return (
    <li
      key={index}
      className="cursor-pointer rounded-lg border p-3 hover:bg-gray-50 hover:text-zinc-800"
    >
      <h4 className="font-medium">{place.TITLE}</h4>
      <p className="truncate text-sm text-gray-500">{place.ADDR}</p>
    </li>
  );
};

export default SimplePlaceCard;