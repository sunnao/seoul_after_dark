import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { FiFilter } from 'react-icons/fi';

interface SearchFilterContainerProps {
  searchBar: React.ReactNode;
  filterBar: React.ReactNode;
}

export const SearchFilterContainer = ({ searchBar, filterBar }: SearchFilterContainerProps) => {
  const [activeTab, setActiveTab] = useState<'search' | 'filter'>('search');

  return (
    <>
      {/* 검색 영역 */}
      <div
        className={`flex items-center rounded-lg bg-white/90 p-2 shadow-md transition-all duration-300 ease-in-out ${
          activeTab === 'search' ? 'flex-grow' : 'w-8 md:w-10'
        }`}
        onClick={() => setActiveTab('search')}
      >
        {activeTab === 'search' ? (
          searchBar
        ) : (
          <button className="flex h-full w-full items-center justify-center">
            <FaSearch className="h-5 w-5 text-neutral-500" />
          </button>
        )}
      </div>

      {/* 필터영역 */}
      <div
        className={`overflow-hidden rounded-lg bg-white/90 shadow-md transition-all duration-300 ease-in-out ${
          activeTab === 'filter' ? 'flex-grow' : 'w-7 shrink-0 md:w-10'
        }`}
        onClick={() => setActiveTab('filter')}
      >
        {activeTab === 'filter' ? (
          filterBar
        ) : (
          <div className="flex h-full min-h-[50px] items-center justify-center">
            <FiFilter className="h-5 text-neutral-500 sm:w-5" />
            {/* {activeFilters.length !== SUBJECTS.length && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded bg-violet-600" />
              )} */}
          </div>
        )}
      </div>
    </>
  );
};
