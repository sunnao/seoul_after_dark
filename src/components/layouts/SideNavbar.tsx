import { GrMapLocation } from 'react-icons/gr';
import { Link } from 'react-router-dom';

export const SideNavbar = () => {
  return (
    <>
      <ul className="menu hidden h-full w-15 flex-nowrap overflow-y-auto bg-base-200 px-2 py-6 text-base-content md:block">
        <li>
          <Link to="/">
            <GrMapLocation className="text-lg" />
          </Link>
        </li>
      </ul>
      <div className="drawer-side absolute top-0 bottom-0 left-0 h-full transition-transform">
        <label
          htmlFor="my-drawer-2"
          aria-label="close sidebar"
          className="drawer-overlay opacity-0"
        ></label>
        <ul className="menu h-full w-15 flex-nowrap overflow-y-auto bg-base-200 px-2 py-6 text-base-content md:w-50">
          <li>
            <Link to="/">
              <GrMapLocation className="mr-2 text-lg" />
              <span className="hidden md:block">지도</span>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};
