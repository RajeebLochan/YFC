import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import FoodCard, { VegSymbol, NonVegSymbol } from '../components/FoodCard';
import OrderRating from '../components/OrderRating';
import { useLocation } from '../context/LocationContext';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const location = useLocation();

  const [restaurant, setRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [vegFilter, setVegFilter] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants`, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const restaurants = await res.json();
          const found = restaurants.find((r) => r.id === id);
          setRestaurant(found);
        }
      } catch {
        const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
        const found = restaurants.find((r) => r.id === id);
        setRestaurant(found);
      }
    };
    fetchRestaurant();
  }, [id]);

  useEffect(() => {
    if (routerLocation.state?.highlightItem) {
      setTimeout(() => {
        const element = document.getElementById(`item-${routerLocation.state.highlightItem}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.border = '2px solid #D4AF37';
          setTimeout(() => (element.style.border = ''), 2000);
        }
      }, 500);
    }
  }, [routerLocation, restaurant]);

  const addToCart = (item) => {
    setCart([...cart, { ...item, cartId: Date.now() + Math.random() }]);
    toast.success(`${item.name} added to cart`, {
      icon: '🛒',
      style: { background: '#1a1a1a', color: '#fff', border: '1px solid #D4AF37' },
    });
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter((item) => item.cartId !== cartId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const placeOrder = async () => {
    if (!customerName || !customerPhone || !address) {
      toast.error('Please fill all details');
      return;
    }
    if (customerPhone.length !== 10) {
      toast.error('Enter valid 10-digit phone number');
      return;
    }

    let google_map_link = '';
    let latitude = location?.latitude || null;
    let longitude = location?.longitude || null;

    if (latitude && longitude) {
      google_map_link = `https://www.google.com/maps?q=${latitude},${longitude}`;
    } else {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
        google_map_link = `https://www.google.com/maps?q=${latitude},${longitude}`;
      } catch {
        google_map_link = 'Location not shared by customer';
      }
    }

    const orderData = {
      orderId: `YFC${Date.now().toString().slice(-8)}`,
      customerName,
      customerPhone,
      address,
      items: cart.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: 1,
        total: item.price,
      })),
      total: cartTotal,
      paymentMethod: 'COD',
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      google_map_link,
      latitude,
      longitude,
    };

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(orderData),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(
          <div>
            <strong>Order Placed!</strong>
            <p className="text-xs mt-1">Order ID: {orderData.orderId}</p>
          </div>
        );

        setLastOrderId(orderData.orderId);
        setCart([]);
        setShowCart(false);
        setShowCheckout(false);
        setTimeout(() => setShowRating(true), 1500);
      }
    } catch {
      toast.error('Failed to place order');
    }
  };

  const filteredItems =
    restaurant?.menu?.filter((item) => {
      if (vegFilter === 'veg') return item.isVeg !== false;
      if (vegFilter === 'nonveg') return item.isVeg === false;
      return true;
    }) || [];

  const filterButtons = [
    { key: 'all', label: 'All', icon: '🍽️', activeColor: 'from-amber-500 to-amber-400' },
    { key: 'veg', label: 'Veg', iconComponent: <VegSymbol size={16} />, activeColor: 'from-green-500 to-green-400' },
    { key: 'nonveg', label: 'Non-Veg', iconComponent: <NonVegSymbol size={16} />, activeColor: 'from-red-500 to-red-400' },
  ];

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${restaurant.image}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/70 to-gray-950" />

        {/* Back Button */}
        <button
          className="absolute top-4 sm:top-5 left-4 sm:left-5 z-10 w-9 h-9 sm:w-10 sm:h-10 bg-gray-900/70 backdrop-blur-sm border border-gray-700/50 text-amber-400 rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors"
          onClick={() => navigate('/')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative max-w-3xl mx-auto text-center px-4 py-12 sm:py-16">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 mb-2 sm:mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {restaurant.name}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">{restaurant.cuisine}</p>
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm text-gray-400">
            <span className="bg-gray-900/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-700/30">
              ⭐ {restaurant.rating}
            </span>
            <span className="bg-gray-900/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-700/30">
              🕒 {restaurant.deliveryTime}
            </span>
            <span className="bg-gray-900/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-700/30">
              💰 Min ₹{restaurant.minOrder}
            </span>
          </div>

          {/* Location */}
          {location?.granted && (
            <motion.p
              className="text-gray-500 text-[10px] sm:text-xs mt-3 flex items-center justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              📍 Delivery location confirmed
            </motion.p>
          )}
        </div>
      </div>

      {/* Veg/Non-Veg Filter */}
      <div className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800/50 shadow-lg shadow-black/20">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-3">
          {filterButtons.map((btn) => (
            <motion.button
              key={btn.key}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                vegFilter === btn.key
                  ? `bg-gradient-to-r ${btn.activeColor} text-gray-900 shadow-lg`
                  : 'bg-gray-900 text-gray-400 border border-gray-700/60 hover:border-gray-600 hover:text-gray-300'
              }`}
              onClick={() => setVegFilter(btn.key)}
              whileTap={{ scale: 0.95 }}
            >
              {btn.iconComponent ? (
                <span className="flex-shrink-0">{btn.iconComponent}</span>
              ) : (
                <span>{btn.icon}</span>
              )}
              {btn.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-28 sm:pb-32">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-gray-900/50 rounded-2xl border border-gray-800/50">
            <p className="text-4xl sm:text-5xl mb-4">🍽️</p>
            <h3 className="text-gray-300 text-base sm:text-lg font-semibold mb-2">
              No items found
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm">Try a different filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                id={`item-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
              >
                <FoodCard item={item} onAddToCart={addToCart} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <button
              className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-900 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30 relative transition-all"
              onClick={() => setShowCart(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 sm:h-7 sm:w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-lg">
                {cart.length}
              </span>
            </button>
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full bg-gray-900 border border-amber-500/30 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap hidden sm:block">
              ₹{cartTotal}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
            />
            <motion.div
              className="fixed top-0 right-0 w-full sm:max-w-md h-full bg-gray-950 border-l border-gray-800/50 z-50 flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800/50 bg-gray-900/50">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold">Your Cart</h3>
                  <p className="text-xs text-gray-500">{cart.length} items</p>
                </div>
                <button
                  className="text-gray-400 hover:text-white p-1 bg-gray-800 rounded-lg"
                  onClick={() => setShowCart(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 sm:space-y-3">
                {cart.map((item) => (
                  <motion.div
                    key={item.cartId}
                    className="flex items-center justify-between bg-gray-900 border border-gray-800/50 rounded-xl p-3 sm:p-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {item.isVeg !== false ? (
                          <VegSymbol size={14} />
                        ) : (
                          <NonVegSymbol size={14} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{item.name}</p>
                        <p className="text-amber-400 text-xs sm:text-sm font-bold">
                          ₹{item.price}
                        </p>
                      </div>
                    </div>
                    <button
                      className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg flex-shrink-0 ml-2"
                      onClick={() => removeFromCart(item.cartId)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </div>
              <div className="p-4 sm:p-5 border-t border-gray-800/50 bg-gray-900/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 font-medium text-sm">Total Amount</span>
                  <span className="text-amber-400 text-xl sm:text-2xl font-bold">
                    ₹{cartTotal}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-900 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              className="bg-gray-950 sm:bg-gray-900 border border-gray-800/50 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />

              <h3 className="text-amber-400 text-lg sm:text-xl font-bold mb-4 sm:mb-5">
                Delivery Details
              </h3>

              {location?.granted && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 mb-3 flex items-center gap-2">
                  <span className="text-green-400 text-xs">📍</span>
                  <p className="text-green-400/80 text-xs">
                    Location detected: {location.address}
                  </p>
                </div>
              )}

              <input
                type="text"
                placeholder="Full Name *"
                className="w-full p-3 sm:p-3.5 mb-3 bg-gray-900 sm:bg-gray-800 border border-gray-800 sm:border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-amber-500 transition-colors"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Phone Number (10 digits) *"
                className="w-full p-3 sm:p-3.5 mb-3 bg-gray-900 sm:bg-gray-800 border border-gray-800 sm:border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-amber-500 transition-colors"
                value={customerPhone}
                onChange={(e) =>
                  setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                maxLength="10"
              />
              <textarea
                placeholder="Delivery Address *"
                className="w-full p-3 sm:p-3.5 mb-4 sm:mb-5 bg-gray-900 sm:bg-gray-800 border border-gray-800 sm:border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-amber-500 transition-colors resize-none"
                rows="3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div className="bg-gray-900 sm:bg-gray-800 border border-gray-800/50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 max-h-36 overflow-y-auto">
                <p className="text-gray-500 text-[10px] sm:text-xs font-medium mb-2 uppercase tracking-wider">
                  Order Summary
                </p>
                {cart.map((item) => (
                  <div
                    key={item.cartId}
                    className="flex justify-between text-xs sm:text-sm py-1"
                  >
                    <span className="text-gray-300 flex items-center gap-1.5">
                      {item.isVeg !== false ? (
                        <VegSymbol size={10} />
                      ) : (
                        <NonVegSymbol size={10} />
                      )}
                      {item.name}
                    </span>
                    <span className="text-amber-400 ml-2">₹{item.price}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm sm:text-base font-bold mt-2 pt-2 border-t border-gray-700/50">
                  <span>Total</span>
                  <span className="text-amber-400">₹{cartTotal}</span>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  className="flex-1 py-2.5 sm:py-3 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
                  onClick={() => setShowCheckout(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-900 rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
                  onClick={placeOrder}
                >
                  Place Order (COD)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Rating Modal */}
      {showRating && lastOrderId && (
        <OrderRating
          orderId={lastOrderId}
          onSubmit={() => setShowRating(false)}
          onClose={() => setShowRating(false)}
        />
      )}

      {/* Footer */}
      <div className="bg-gray-900/50 border-t border-gray-800/50 py-5 sm:py-6 px-4 text-center text-xs sm:text-sm text-gray-500">
        Fresh food, delivered simply.
      </div>
    </div>
  );
}

export default RestaurantPage;
