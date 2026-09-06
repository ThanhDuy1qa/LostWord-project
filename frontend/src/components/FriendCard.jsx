// src/components/FriendCard.jsx
import { memo } from 'react';
import { getCharacterImageUrl, getRoleIconUrl } from '../utils/characterUtils';

const FriendCard = ({ friend }) => {
  if (!friend) return null;

  let finalImageUrl = getCharacterImageUrl(friend.universe, friend.image_url);
  if (finalImageUrl) {
    finalImageUrl = finalImageUrl.replaceAll('#', '%23').replaceAll('~', '%7E');
  }

  const roleIconUrl = getRoleIconUrl(friend.role);
  const universeText = friend.universe ? String(friend.universe).replace(/\s+/g, '') : "B3";

  return (
    <div
      className="rounded-xl overflow-hidden border-2 border-gray-600 hover:border-blue-400 transition-all duration-300 relative flex flex-col shadow-lg shadow-black/60 bg-[#1a1a20]"
      style={{
        /* Giúp trình duyệt tự bỏ qua render layout khi card nằm ngoài màn hình mà KHÔNG cần JS Observer */
        contentVisibility: 'auto',
        containIntrinsicSize: '1px 220px',
      }}
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-gray-800 flex-grow">
        <img
          src={finalImageUrl}
          alt={friend.name}
          loading="lazy"      /* Trình duyệt tự quản lý lazyload */
          decoding="async"    /* Giải mã ảnh ở luồng phụ, tránh đứng UI */
          className="w-full h-full object-cover block"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x400?text=Error';
          }}
        />

        <div className="absolute top-1 left-1 w-9 h-9 sm:w-11 sm:h-11 z-10 drop-shadow-lg bg-black/40 rounded-full p-1 border border-gray-500/50 flex items-center justify-center">
          <img
            src={roleIconUrl}
            alt={friend.role}
            title={friend.role}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      </div>

      <div className="bg-slate-100 text-slate-800 text-center py-1 border-b border-gray-400 shadow-inner z-10 relative">
        <h3 className="text-[13px] sm:text-sm font-bold truncate font-serif tracking-wide px-1">
          {friend.name}
        </h3>
      </div>

      <div className="bg-[#151515] text-white text-center py-1 sm:py-1.5 z-10 relative">
        <h4 className="text-base sm:text-xl font-bold font-serif tracking-widest drop-shadow-md">
          {universeText}
        </h4>
      </div>
    </div>
  );
};

export default memo(FriendCard);