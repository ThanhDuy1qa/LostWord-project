import { memo } from 'react';
import { Link } from 'react-router-dom'; // 🌟 1. Import thẻ Link từ react-router-dom
import { getStoryCardImageUrl } from '../utils/storyCardUtils';

const StoryCardItem = ({ card }) => {
  if (!card) return null;

  const finalImageUrl = getStoryCardImageUrl(card.image_url);
  const typeImagePath = card.type ? encodeURI(`/image/type/${card.type.trim()}.png`) : "";
  const stars = Array(card.rarity || 0).fill('★').join('');

  return (
    /* 🌟 2. Thay <div> ngoài cùng thành thẻ <Link> hướng đến /storycard/:id */
    <Link 
      to={`/storycard/${card.storycard_id}`} 
      className="rounded-xl overflow-hidden border-2 border-gray-600 hover:border-yellow-500 transition-all duration-300 relative flex flex-col shadow-lg shadow-black/60 group block cursor-pointer"
    >
      {/* Vùng 1: Ảnh Story Card */}
      <div className="aspect-[3/2] relative overflow-hidden bg-black flex-grow"> 
        <img 
          src={finalImageUrl} 
          alt={card.name}
          className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          onError={(e) => { 
            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; 
          }}
        />
        
        {/* Icon Type */}
        {typeImagePath && (
          <div className="absolute top-2 left-2 w-8 h-8 sm:w-10 sm:h-10 z-10 drop-shadow-lg bg-black/40 rounded-full p-1 border border-gray-500/50">
            <img 
              src={typeImagePath} 
              alt={card.type}
              title={card.type}
              className="w-full h-full object-contain"
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
          </div>
        )}
      </div>

      {/* Vùng 2: Số Sao (Rarity) */}
      <div className="bg-[#1a1a20] text-center pt-1.5 pb-0.5 z-10 relative">
        <div className="text-yellow-400 text-sm tracking-widest drop-shadow-md">
          {stars}
        </div>
      </div>

      {/* Vùng 3: Tên Story Card */}
      <div className="bg-[#1a1a20] text-gray-100 text-center pb-2 px-1 border-t border-gray-800 z-10 relative flex-grow flex items-center justify-center">
        <h3 className="text-[12px] sm:text-[13px] font-bold line-clamp-2 leading-tight">
          {card.name}
        </h3>
      </div>
    </Link>
  );
};

export default memo(StoryCardItem);