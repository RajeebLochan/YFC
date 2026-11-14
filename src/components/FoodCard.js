import React from 'react';
import { motion } from 'framer-motion';

// Indian Standard FSSAI Veg/Non-Veg Indicators (SVG icons)
const VegSymbol = ({ size = 22 }) => (
  <img
    src="/veg-icon.svg"
    alt="Vegetarian"
    width={size}
    height={size}
    className="drop-shadow-md"
    style={{ minWidth: size }}
  />
);

const NonVegSymbol = ({ size = 22 }) => (
  <img
    src="/non-veg-icon.svg"
    alt="Non-Vegetarian"
    width={size}
    height={size}
    className="drop-shadow-md"
    style={{ minWidth: size }}
  />
);

function FoodCard({ item, onAddToCart }) {
  const isAvailable = item.isAvailable !== false;
  const isVeg = item.isVeg !== false;

  return (
    <motion.div
      className={`relative bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl overflow-hidden shadow-lg border border-gray-800/80 transition-all duration-300 flex flex-col ${
        isAvailable
          ? 'hover:border-amber-500/60 hover:shadow-amber-500/10 hover:shadow-xl cursor-pointer'
          : 'opacity-80'
      }`}
      whileHover={isAvailable ? { y: -6, scale: 1.02 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isAvailable ? 'group-hover:scale-110' : 'opacity-40 grayscale'
          }`}
          loading="lazy"
          onError={(e) => {
            e.target.src =
              'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=500';
          }}
        />

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />

        {/* Veg/Non-Veg Symbol - Top Left Corner with white bg pill */}
        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm rounded-md p-0.5 shadow-md">
          {isVeg ? <VegSymbol size={20} /> : <NonVegSymbol size={20} />}
        </div>

        {/* Popular Badge */}
        {item.popular && isAvailable && (
          <div className="absolute top-2.5 right-2.5">
            <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-lg animate-pulse">
              🔥 POPULAR
            </span>
          </div>
        )}

        {/* Price tag on image */}
        <div className="absolute bottom-2.5 right-2.5">
          <span className="bg-gray-900/90 backdrop-blur-sm text-amber-400 text-lg sm:text-xl font-bold px-3 py-1 rounded-xl border border-amber-500/30 shadow-lg">
            ₹{item.price}
          </span>
        </div>

        {/* Unavailable Overlay */}
        {!isAvailable && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
            style={{ pointerEvents: 'none' }}
          >
            <span className="bg-red-600/90 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg tracking-wide shadow-lg border border-red-500/30">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className={`p-3 sm:p-4 flex flex-col flex-1 ${!isAvailable ? 'opacity-50' : ''}`}>
        {/* Name */}
        <h3 className="text-white font-semibold text-sm sm:text-base leading-snug line-clamp-2 mb-1">
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-1">
            {item.description}
          </p>
        )}

        {/* Restaurant Name */}
        {item.restaurantName && (
          <p className="text-amber-500/70 text-[10px] sm:text-xs mb-2 sm:mb-3 font-medium flex items-center gap-1">
            <span className="text-amber-500/50">🏪</span>
            {item.restaurantName}
          </p>
        )}

        {/* Add to Cart - pushed to bottom */}
        <div className="mt-auto pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isAvailable && onAddToCart) onAddToCart(item);
            }}
            disabled={!isAvailable}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide transition-all duration-200 ${
              isAvailable
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-900 hover:shadow-lg hover:shadow-amber-500/25 active:scale-95'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
            }`}
            style={!isAvailable ? { pointerEvents: 'none' } : {}}
          >
            {isAvailable ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add to Cart
              </>
            ) : (
              'Unavailable'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export { VegSymbol, NonVegSymbol };
export default FoodCard;
