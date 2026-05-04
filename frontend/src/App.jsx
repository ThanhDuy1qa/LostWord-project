import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import FloatingButtons from './components/FloatingButtons'; // 1. Import nút trôi nổi
import FriendList from './pages/FriendList';
import StoryCardList from './pages/StoryCardList';
import AddStoryCard from './pages/AddStoryCard';
import AdminDashboard from './pages/AdminDashboard'; // 2. Import trang Menu
import AddCharacter from './pages/AddCharacter';
import Footer from './components/Footer';
import EditCharacter from './pages/EditCharacter';
import ManageCharacters from './pages/ManageCharacters';
import EditStoryCard from './pages/EditStoryCard';
import ManageStoryCards from './pages/ManageStoryCards';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#0f0f12]">
        
        {/* Navbar nằm ngang */}
        <Navbar />

        {/* 3. Đặt Nút Trôi Nổi ở đây để nó hiện trên MỌI TRANG */}
        <FloatingButtons />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<h1 className="text-white text-center mt-20 text-2xl font-serif">Trang Chủ (Home)</h1>} />
            <Route path="/characters" element={<FriendList />} />
            <Route path="/storycards" element={<StoryCardList />} />
            
            {/* Các trang quản trị (Admin) */}
            <Route path="/admin" element={<AdminDashboard />} /> 
            <Route path="/add-storycard" element={<AddStoryCard />} />
            <Route path="/add-character" element={<AddCharacter />} />
            <Route path="/manage-characters" element={<ManageCharacters />} />
            <Route path="/edit-character/:id" element={<EditCharacter />} />
            <Route path="/manage-storycards" element={<ManageStoryCards />} />
            <Route path="/edit-storycard/:id" element={<EditStoryCard />} />
            {/* ... các trang khác ... */}
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;