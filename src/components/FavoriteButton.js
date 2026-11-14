import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function FavoriteButton({ itemId, itemName, size = 24 }) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.some((fav) => fav.id === itemId));
  }, [itemId]);

  const toggleFavorite = (e) => {
    e.stopPropagation();
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      favorites = favorites.filter((fav) => fav.id !== itemId);
    } else {
      favorites.push({ id: itemId, name: itemName, addedAt: new Date().toISOString() });
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };

  return (
    <motion.button
      onClick={toggleFavorite}
      style={{
        background: 'none',
        border: 'none',
        fontSize: `${size}px`,
        cursor: 'pointer',
        padding: '4px',
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      whileTap={{ scale: 1.4 }}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorite ? '❤️' : '🤍'}
    </motion.button>
  );
}

export default FavoriteButton;
