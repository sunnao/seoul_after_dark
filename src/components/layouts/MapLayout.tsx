import { Header } from '@/components/layouts/Header';
import { SideNavbar } from '@/components/layouts/SideNavbar';
import { Outlet } from 'react-router-dom';

export const MapLayout = () => {
  return (
    <div className="flex h-screen flex-col border-2 border-pink-300">
      <Header />
      <div className="relative flex flex-1 border-2 border-red-800">
        <div className="drawer h-full w-full">
          <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
          <div className="drawer-content flex flex-col items-center justify-center">
            <Outlet />
          </div>

          <SideNavbar/>
        </div>
      </div>

      {/* <SideNavbar />
      <main className="w-full flex-grow border-2 border-red-300 p-4">
        <Outlet />
      </main> */}
    </div>
  );
};
