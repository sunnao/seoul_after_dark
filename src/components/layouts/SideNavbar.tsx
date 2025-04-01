import { GrMapLocation } from 'react-icons/gr';
import { Link } from 'react-router-dom';

export const SideNavbar = () => {
  return (
    <>
      <div className="drawer-side absolute top-0 bottom-0 left-0 h-full">
        <label
          htmlFor="my-drawer-2"
          aria-label="close sidebar"
          className="drawer-overlay opacity-0"
        ></label>
        <ul className="menu h-full w-17 flex-nowrap overflow-y-auto bg-base-200 p-3 text-base-content md:w-70">
          <li>
            <Link to="/">
              <span className="hidden md:block">지도</span>
              <span className="block md:hidden">
                <GrMapLocation className="text-lg" />
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};
