import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { LoginPage } from '@/pages/LoginPage';
import { Layout } from '@/components/layouts/Layout';
import { MapPage } from '@/pages/MapPage';
import { MapLayout } from '@/components/layouts/MapLayout';
import { JoinPage } from '@/pages/JoinPage';
import { MyPage } from '@/pages/MyPage';
import { AuthProvider } from '@/features/auth/contexts';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/" element={<MapLayout />}>
            <Route index element={<MapPage />} />
          </Route>
          <Route path="/" element={<Layout />}>
            <Route path="mypage" element={<MyPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
