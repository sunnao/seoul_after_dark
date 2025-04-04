import { SUBJECTS } from '@/features/map/constants/subjects';
import { Subject } from '@/features/map/types/mapTypes';

interface FilterChipsProps {
  onFilterChange: (activeFilters: string[]) => void;
  activeFilters: string[];
}

interface SubjectForFilter extends Subject {
  filterClassName: string;
}

export const FilterChips = ({ onFilterChange, activeFilters }: FilterChipsProps) => {

	const getFilterStyle = (subject: string) => {
    switch (subject) {
      case '문화/체육':
      case '공원/광장':
      case '공공시설':
        return 'h-5 w-5';
      case '가로/마을':
        return `h-4 w-4 ${activeFilters.includes('가로/마을') ? 'invert-[1]' : 'invert-[0]'}`;
      case '기타':
        return 'h-4 w-4';
      default:
        return '';
    }
  };
	
	const filters: SubjectForFilter[] = SUBJECTS.map((subject) => ({
    ...subject,
    filterClassName: getFilterStyle(subject.id),
  }));
	
  const toggleFilter = (filterId: string) => {
    const filterAll = filters.map((filter) => filter.id);

    if (filterId === '전체') {
      if (activeFilters.length === filters.length) {
        return onFilterChange([]);
      } else {
        return onFilterChange(filterAll);
      }
    }

    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter((id) => id !== filterId && id != '전체')
      : [...activeFilters, filterId];

    if (newFilters.length === filters.length - 1) {
      return onFilterChange(filterAll);
    }
    return onFilterChange(newFilters);
  };

  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-lg bg-white/90 p-3 shadow-md">
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors ${
            activeFilters.includes(filter.id)
              ? 'bg-neutral-800 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
          onClick={() => toggleFilter(filter.id)}
        >
          {filter.icon && (
            <span
              className={`flex items-center justify-center ${filter.filterClassName}`}
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
