import { Subject } from '@/features/map/types/mapTypes';
import { HiOutlineBuildingLibrary } from 'react-icons/hi2';
import { CgTrees } from 'react-icons/cg';
import { PiBridgeFill } from 'react-icons/pi';
import { BsMoonStarsFill } from 'react-icons/bs';
import { streetLamp } from '@/constants/images';

export const SUBJECTS: Subject[] = [
  {
    id: '전체',
    name: '전체',
  },
  {
    id: '문화/체육',
    name: '문화/체육',
    icon: <HiOutlineBuildingLibrary />,
  },
  {
    id: '공원/광장',
    name: '공원/광장',
    icon: <CgTrees />,
  },
  {
    id: '공공시설',
    name: '공공시설',
    icon: <PiBridgeFill />,
  },
  {
    id: '가로/마을',
    name: '가로/마을',
    icon: <img src={streetLamp} />,
  },
  {
    id: '기타',
    name: '기타',
    icon: <BsMoonStarsFill />,
  },
];
