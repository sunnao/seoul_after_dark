import { ViewNightSpot } from "@/features/map/types/mapTypes";

interface DetailPlaceProps {
  selectedPlace: ViewNightSpot;
}

const DetailPlaceContext = ({selectedPlace}: DetailPlaceProps) => {
  return (
    <div className="text-start">
      <h4 className="mb-2 text-xl font-bold">{selectedPlace.TITLE}</h4>
      <p className="mb-2 text-gray-400">{selectedPlace.ADDR}</p>
      {selectedPlace.TEL_NO && <p className="mb-2 text-gray-400">전화: {selectedPlace.TEL_NO}</p>}
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
  );
};

export default DetailPlaceContext
