import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { LoginPage } from '@/pages/LoginPage';
import { Layout } from '@/components/layouts/Layout';
import { MapPage } from '@/pages/MapPage';
import { MapLayout } from '@/components/layouts/MapLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<MapLayout />}>
          {/* 일반 페이지들 - 스크롤 가능한 콘텐츠 */}
          <Route index element={<MapPage />} />
        </Route>
        <Route path="/" element={<Layout />}>
          <Route path="favorite" element={<MapPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
