import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AddBrit from './pages/AddBrit';
import Calendar from './pages/Calendar';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app" dir="rtl">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<AddBrit />} />
            <Route path="/calendar" element={<Calendar />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
