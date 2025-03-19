import { Link } from "react-router-dom";

export const SideNavbar = () => {
  return (
    <>
      <div className="drawer-side absolute top-0 bottom-0 left-0 h-full">
        <label
          htmlFor="my-drawer-2"
          aria-label="close sidebar"
          className="drawer-overlay opacity-0"
        ></label>
        <ul className="menu h-full w-70 flex-nowrap overflow-y-auto bg-base-200 p-4 text-base-content">
          <li>
            <Link to="/">지도</Link>
          </li>
        </ul>
      </div>
    </>
  );
};
