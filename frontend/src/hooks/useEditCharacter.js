import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export const useEditCharacter = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '', rarity_code: '', universe: '', role: '', image_url: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [allFriendsList, setAllFriendsList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [l1Names, setL1Names] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [saveAction, setSaveAction] = useState('next'); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/friends'); 
        const allFriends = response.data;
        setAllFriendsList(allFriends);

        const l1Chars = allFriends.filter(f => f.universe === 'L1').map(f => f.name);
        setL1Names([...new Set(l1Chars)]);

        const index = allFriends.findIndex(f => String(f.friend_id) === String(id));
        setCurrentIndex(index);

        if (index !== -1) {
          const charToEdit = allFriends[index];
          setFormData({
            name: charToEdit.name, rarity_code: charToEdit.rarity_code,
            universe: charToEdit.universe, role: charToEdit.role, image_url: charToEdit.image_url
          });
          setOriginalImageUrl(charToEdit.image_url);
        } else {
          setMessage('❌ Không tìm thấy nhân vật.');
        }
      } catch (error) {
        setMessage('❌ Lỗi kết nối đến máy chủ.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleNavigate = (direction) => {
    setMessage('');
    if (currentIndex === -1) return; 
    
    if (direction === 'prev' && currentIndex > 0) {
      navigate(`/edit-character/${allFriendsList[currentIndex - 1].friend_id}`);
    } else if (direction === 'next' && currentIndex < allFriendsList.length - 1) {
      navigate(`/edit-character/${allFriendsList[currentIndex + 1].friend_id}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (name === 'name' || name === 'universe') {
        const cleanName = (name === 'name' ? value : prev.name).trim().replace(/\s+/g, '_');
        const cleanUniverse = (name === 'universe' ? value : prev.universe).trim().replace(/\s+/g, '_');

        if (cleanName && cleanUniverse) {
          updated.image_url = `/image/friend/${cleanName}_${cleanUniverse}`;
        } else if (cleanName) {
          updated.image_url = `/image/friend/${cleanName}`;
        }
      }
      return updated;
    });

    if (name === 'name') setShowSuggestions(true);
  };

  // 🌟 2. Cập nhật handleSelectName khi click chọn gợi ý tên
  const handleSelectName = (selectedName) => {
    setFormData(prev => {
      const cleanName = selectedName.trim().replace(/\s+/g, '_');
      const cleanUniverse = prev.universe ? prev.universe.trim().replace(/\s+/g, '_') : '';
      const newImageUrl = cleanUniverse ? `/image/friend/${cleanName}_${cleanUniverse}` : `/image/friend/${cleanName}`;

      return {
        ...prev,
        name: selectedName,
        image_url: newImageUrl
      };
    });
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/friends/${id}`, formData);
      setOriginalImageUrl(formData.image_url); 

      if (saveAction === 'next') {
        setMessage('✅ Lưu thành công! Đang qua nhân vật kế tiếp...');
        setTimeout(() => {
          if (currentIndex !== -1 && currentIndex < allFriendsList.length - 1) {
            navigate(`/edit-character/${allFriendsList[currentIndex + 1].friend_id}`);
          } else {
            navigate('/manage-characters');
          }
        }, 1000);
      } else {
        setMessage('✅ Lưu thành công! Đang về trang quản lý...');
        setTimeout(() => navigate('/manage-characters'), 1000);
      }
    } catch (error) {
      setMessage('❌ Có lỗi xảy ra khi lưu.');
    }
  };

  const filteredNames = l1Names.filter(name => name.toLowerCase().includes(formData.name.toLowerCase()));

  return {
    formData, message, loading, currentIndex, allFriendsList, showSuggestions,
    originalImageUrl, saveAction, filteredNames, 
    setSaveAction, setShowSuggestions, handleNavigate, handleChange, handleSelectName, handleSubmit, navigate
  };
};