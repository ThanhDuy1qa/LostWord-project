// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import FloatingButtons from './components/FloatingButtons';
import Home from './pages/Home'; // 👈 Import trang Home mới
import FriendList from './pages/FriendList';
import StoryCardList from './pages/StoryCardList';
import AddStoryCard from './pages/AddStoryCard';
import AdminDashboard from './pages/AdminDashboard';
import AddCharacter from './pages/AddCharacter';
import Footer from './components/Footer';
import ManageCharacters from './pages/ManageCharacters';
import EditStoryCard from './pages/EditStoryCard';
import ManageStoryCards from './pages/ManageStoryCards';
import StoryCardDetail from './pages/StoryCardDetail';

import EditCharacter from './pages/EditCharacter';     
import EditFriendDetail from './pages/EditFriendDetail'; 

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#0f0f12]">
        <Navbar />
        <FloatingButtons />

        <main className="flex-grow">
          <Routes>
            {/* 🌟 Thay thế dòng cũ bằng component Home */}
            <Route path="/" element={<Home />} />
            
            <Route path="/characters" element={<FriendList />} />
            <Route path="/storycards" element={<StoryCardList />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} /> 
            <Route path="/add-storycard" element={<AddStoryCard />} />
            <Route path="/add-character" element={<AddCharacter />} />

            {/* Quản lý danh sách nhân vật */}
            <Route path="/manage-characters" element={<ManageCharacters />} />
            <Route path="/manage-friend-details" element={<ManageCharacters />} />

            {/* Chỉnh sửa */}
            <Route path="/edit-character/:id" element={<EditCharacter />} />
            <Route path="/edit-friend-detail/:id" element={<EditFriendDetail />} />

            {/* Story Card Routes */}
            <Route path="/manage-storycards" element={<ManageStoryCards />} />
            <Route path="/edit-storycard/:id" element={<EditStoryCard />} />
            <Route path="/storycard/:id" element={<StoryCardDetail />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;