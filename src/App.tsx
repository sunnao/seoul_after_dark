import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { LoginPage } from '@/pages/LoginPage';
// import { Layout } from '@/components/layouts/Layout';
import { MapPage } from '@/pages/MapPage';
import { MapLayout } from '@/components/layouts/MapLayout';
import { JoinPage } from '@/pages/JoinPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/" element={<MapLayout />}>
          <Route index element={<MapPage />} />
        </Route>
        {/* <Route path="/" element={<Layout />}>
          <Route path="favorite" element={<MapPage />} />
        </Route> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
