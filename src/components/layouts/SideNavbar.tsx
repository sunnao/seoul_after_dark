import { Link } from 'react-router-dom';
import { menuItems } from '@/constants/menu';
import React from 'react';
export const SideNavbar = () => {
  return (
    <>
      <ul className="menu hidden h-full w-15 flex-nowrap overflow-y-auto bg-base-100 px-2 py-6 text-base-content md:block">
        {menuItems.map((item) => (
          <li key={item.id}>
            <Link to={item.path} className="flex h-12 items-center">
              <span className="text-lg">{React.createElement(item.icon)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="drawer-side absolute top-0 bottom-0 left-0 h-full transition-transform">
        <label
          htmlFor="my-drawer-2"
          aria-label="close sidebar"
          className="drawer-overlay opacity-0"
        ></label>
        <ul className="menu z-100 h-full w-15 flex-nowrap overflow-y-auto bg-base-100 px-2 py-6 text-base-content md:w-50">
          {menuItems.map((item) => (
            <li key={item.id}>
              <Link to={item.path} className="flex h-12 items-center">
                <span className="mr-2 text-lg">{React.createElement(item.icon)}</span>
                <span className="hidden md:block">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
