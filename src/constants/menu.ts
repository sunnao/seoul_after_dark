
import { GoStar } from 'react-icons/go';
import { GrMapLocation } from 'react-icons/gr';
import { IconType } from 'react-icons/lib';

interface MenuItem {
  id: number;
  label: string;
  icon: IconType;
  path: string;
}

export const menuItems: MenuItem[] = [
  {
		id: 0,
    label: '지도',
    icon: GrMapLocation,
    path: '/',
  },
  {
		id: 1,
    label: '즐겨찾기',
    icon: GoStar,
    path: '/favorite',
  },
];
