import { ViewNightSpot } from '@/features/map/types/mapTypes';
import parse from 'html-react-parser';

interface DetailPlaceProps {
  selectedPlace: ViewNightSpot;
}

const DetailPlaceContext = ({ selectedPlace }: DetailPlaceProps) => {
  return (
    <>
      <div className="text-end">
        <p className="mb-2 text-xs text-gray-400">
          업데이트: {selectedPlace.MOD_DATE.slice(0, 16)}
        </p>
      </div>
      <div className="text-start">
        <span className="mb-1 badge badge-neutral">{selectedPlace.SUBJECT_CD}</span>
        <div className="flex items-center">
          <h4 className="mb-2 text-xl font-bold">{selectedPlace.TITLE}</h4>
        </div>
        <p className="mb-2 text-gray-400">{selectedPlace.ADDR}</p>
        {selectedPlace.OPERATING_TIME && (
          <p className="mb-2 hover:text-base-content">
            운영시간: <span className="mb-2 text-gray-400">{selectedPlace.OPERATING_TIME}</span>
          </p>
        )}
        {selectedPlace.TEL_NO && (
          <p className="mb-2 hover:text-base-content">
            전화: <span className="mb-2 text-gray-400">{selectedPlace.TEL_NO}</span>
          </p>
        )}
        {selectedPlace.URL && (
          <p className="mb-2 hover:text-base-content">
            홈페이지:{' '}
            <a
              className="break-all text-blue-500"
              href={selectedPlace.URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {selectedPlace.URL}
            </a>
          </p>
        )}
        {selectedPlace.CONTENTS && (
          <div className="mt-4 text-gray-400">{parse(selectedPlace.CONTENTS)}</div>
        )}
      </div>
    </>
  );
};

export default DetailPlaceContext;
