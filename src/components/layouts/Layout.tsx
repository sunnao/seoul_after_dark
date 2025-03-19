import { Header } from '@/components/layouts/Header';
import { Outlet } from 'react-router-dom';

export const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col border-2 border-pink-300">
      <Header />
    </div>
  );
};
