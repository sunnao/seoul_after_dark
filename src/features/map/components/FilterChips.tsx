import { HiOutlineBuildingLibrary } from 'react-icons/hi2';
import { CgTrees } from 'react-icons/cg';
import { PiBridgeFill } from 'react-icons/pi';
import { streetLamp } from '@/constants/images';
import React from 'react';
import { BsMoonStarsFill } from 'react-icons/bs';

type SubjectFilter = {
  id: string;
  name: string;
  icon?: React.ReactNode;
};

interface FilterChipsProps {
  onFilterChange: (activeFilters: string[]) => void;
  activeFilters: string[];
}

export const FilterChips = ({ onFilterChange, activeFilters }: FilterChipsProps) => {

  const filters: SubjectFilter[] = [
    {
      id: '전체',
      name: '전체',
    },
    {
      id: '문화/체육',
      name: '문화/체육',
      icon: <HiOutlineBuildingLibrary className="h-5 w-5" />,
    },
    {
      id: '공원/광장',
      name: '공원/광장',
      icon: <CgTrees className="h-5 w-5" />,
    },
    {
      id: '공공시설',
      name: '공공시설',
      icon: <PiBridgeFill className="h-5 w-5" />,
    },
    {
      id: '가로/마을',
      name: '가로/마을',
      icon: <img src={streetLamp} className="h-4 w-4" alt="가로/마을" />,
    },
    {
      id: '기타',
      name: '기타',
      icon: <BsMoonStarsFill className="h-4 w-4" />,
    },
  ];

  const toggleFilter = (filterId: string) => {
    if (filterId === '전체') {
      onFilterChange([]);
      return;
    }

    let newFilters: string[];

    if (activeFilters.includes(filterId)) {
      newFilters = activeFilters.filter((id) => id !== filterId);
    } else {
      newFilters = [...activeFilters, filterId];
    }

    onFilterChange(newFilters);
  };

  return (
    <div className="max-w-full flex flex-wrap items-center justify-center gap-2 rounded-lg bg-white/90 p-3 shadow-md">
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors ${
            filter.id === '전체'
              ? activeFilters.length === 0
                ? 'bg-neutral-800 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              : activeFilters.includes(filter.id)
                ? 'bg-neutral-800 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
          onClick={() => toggleFilter(filter.id)}
        >
          {filter.icon && (
            <span
              className={`flex items-center justify-center ${filter.id === '가로/마을' && (activeFilters.includes(filter.id) ? 'invert-[1]' : 'invert-[0]')}`}
            >
              {filter.icon}
            </span>
          )}
          <span>{filter.name}</span>
        </button>
      ))}
    </div>
  );
};
