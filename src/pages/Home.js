import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import FoodCard, { VegSymbol, NonVegSymbol } from '../components/FoodCard';
import OrderTracking from '../components/OrderTracking';
import { useLocation } from '../context/LocationContext';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function HomePage() {
  const location = useLocation();
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [vegFilter, setVegFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showTracking, setShowTracking] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch all items from backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`${API_BASE}/all-items`, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          setAllItems(data);
          setFilteredItems(data);
        } else {
          const resR = await fetch(`${API_BASE}/restaurants`, { headers: { Accept: 'application/json' } });
          if (resR.ok) {
            const restaurants = await resR.json();
            const items = [];
            restaurants.forEach((r) => {
              r.menu.forEach((item) => {
                items.push({ ...item, restaurantName: r.name, restaurantId: r.id });
              });
            });
            setAllItems(items);
            setFilteredItems(items);
          }
        }
      } catch (err) {
        console.error('Failed to load items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Apply filters
  useEffect(() => {
    let items = [...allItems];
    if (vegFilter === 'veg') {
      items = items.filter((i) => i.isVeg === true);
    } else if (vegFilter === 'nonveg') {
      items = items.filter((i) => i.isVeg === false);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(term) ||
          i.description?.toLowerCase().includes(term) ||
          i.category?.toLowerCase().includes(term) ||
          i.restaurantName?.toLowerCase().includes(term)
      );
    }
    setFilteredItems(items);
  }, [allItems, vegFilter, searchTerm]);

  // Cart functions
  const addToCart = useCallback((item) => {
    setCart((prev) => [...prev, { ...item, cartId: Date.now() + Math.random() }]);
    toast.success(`${item.name} added to cart`, {
      icon: '🛒',
      style: { background: '#1a1a1a', color: '#fff', border: '1px solid #D4AF37' },
    });
  }, []);

  const removeFromCart = (cartId) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price, 0);

  const placeOrder = async () => {
    if (!customerName || !customerPhone || !address) {
      toast.error('Please fill all details');
      return;
    }
    if (customerPhone.length !== 10) {
      toast.error('Enter valid 10-digit phone number');
      return;
    }

    // Use pre-detected location or request fresh
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

        setCart([]);
        setShowCart(false);
        setShowCheckout(false);
        setCustomerName('');
        setCustomerPhone('');
        setAddress('');
      }
    } catch {
      toast.error('Failed to place order');
    }
  };

  const filterButtons = [
    { key: 'all', label: 'All', icon: '🍽️', activeColor: 'from-amber-500 to-amber-400' },
    { key: 'veg', label: 'Veg', iconComponent: <VegSymbol size={16} />, activeColor: 'from-green-500 to-green-400' },
    { key: 'nonveg', label: 'Non-Veg', iconComponent: <NonVegSymbol size={16} />, activeColor: 'from-red-500 to-red-400' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
          <p className="text-gray-400 text-sm">Loading delicious items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Location Banner */}
      <motion.div
        className="bg-gradient-to-r from-gray-900 via-gray-900 to-gray-900 border-b border-gray-800/50 px-3 sm:px-4 py-2 sm:py-2.5"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-amber-400 text-sm sm:text-base flex-shrink-0">
              {location?.loading ? '⏳' : location?.granted ? '📍' : '📍'}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">Delivering to</p>
              <p className="text-xs sm:text-sm text-white font-medium truncate max-w-[180px] sm:max-w-xs">
                {location?.loading
                  ? 'Detecting location...'
                  : location?.address || 'Your delivery area'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              className="text-amber-400 text-[10px] sm:text-xs font-medium hover:text-amber-300 transition-colors hidden sm:block"
              onClick={() => setShowTracking(true)}
            >
              📦 Track Order
            </button>
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?w=1600")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/90 via-gray-950/80 to-gray-950" />

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4 pt-12 sm:pt-16 md:pt-24 pb-10 sm:pb-14 md:pb-20">
          {/* Brand */}
          <motion.div
            className="mb-2 sm:mb-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 tracking-wider"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                textShadow: '0 0 60px rgba(212,175,55,0.3)',
              }}
            >
              YFC
            </h1>
          </motion.div>

          <motion.p
            className="text-gray-400 text-sm sm:text-base md:text-xl mb-6 sm:mb-8 md:mb-10 font-light tracking-widest uppercase"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Your Favourite Coffee & More
          </motion.p>

          {/* Search Bar */}
          <motion.div
            className="max-w-xl mx-auto relative mb-5 sm:mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div
              className={`relative transition-all duration-300 ${
                isSearchFocused ? 'transform scale-[1.02]' : ''
              }`}
            >
              <input
                type="text"
                className="w-full py-3 sm:py-4 pl-5 sm:pl-6 pr-12 sm:pr-14 text-sm sm:text-base bg-gray-900/80 backdrop-blur-xl border-2 border-gray-700/60 rounded-2xl text-white placeholder-gray-500 outline-none focus:border-amber-500/80 focus:shadow-lg focus:shadow-amber-500/10 transition-all"
                placeholder="Search for dishes, cuisines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6 absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 text-amber-400/90 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium">
              ☕ {allItems.length}+ Items
            </span>
            <span className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 text-amber-400/90 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium">
              🚚 Free Delivery
            </span>
            <button
              className="bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold hover:bg-amber-500/20 transition-colors"
              onClick={() => setShowTracking(true)}
            >
              📦 Track Order
            </button>
          </motion.div>
        </div>
      </div>

      {/* Filter Tabs - Sticky */}
      <div className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800/50 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {filterButtons.map((btn) => (
              <motion.button
                key={btn.key}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
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
      </div>

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-1 sm:pb-2">
        <p className="text-gray-500 text-xs sm:text-sm">
          Showing{' '}
          <span className="text-amber-400 font-semibold">{filteredItems.length}</span> items
          {searchTerm && (
            <>
              {' '}
              for &quot;<span className="text-gray-300">{searchTerm}</span>&quot;
            </>
          )}
          {vegFilter !== 'all' && (
            <span className="ml-1">
              &bull;{' '}
              <span className={vegFilter === 'veg' ? 'text-green-400' : 'text-red-400'}>
                {vegFilter === 'veg' ? 'Veg Only' : 'Non-Veg Only'}
              </span>
            </span>
          )}
        </p>
      </div>

      {/* Food Items Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-28 sm:pb-32">
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <motion.div
              className="text-center py-16 sm:py-20 bg-gray-900/50 rounded-2xl mt-4 sm:mt-6 border border-gray-800/50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key="empty"
            >
              <p className="text-4xl sm:text-5xl mb-4">🍽️</p>
              <h3 className="text-gray-300 text-base sm:text-lg font-semibold mb-2">
                No items found
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm">
                Try adjusting your search or filters
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key="grid"
            >
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.5) }}
                >
                  <FoodCard item={item} onAddToCart={addToCart} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50"
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 20 }}
            transition={{ type: 'spring', damping: 15 }}
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

            {/* Cart total pill */}
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
              {/* Cart Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800/50 bg-gray-900/50">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold">Your Cart</h3>
                  <p className="text-xs text-gray-500">{cart.length} items</p>
                </div>
                <button
                  className="text-gray-400 hover:text-white transition-colors p-1 bg-gray-800 rounded-lg"
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

              {/* Cart Items */}
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
                        <p className="text-amber-400 text-xs sm:text-sm font-bold">₹{item.price}</p>
                      </div>
                    </div>
                    <button
                      className="text-red-400 hover:text-red-300 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg flex-shrink-0 ml-2"
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

              {/* Cart Footer */}
              <div className="p-4 sm:p-5 border-t border-gray-800/50 bg-gray-900/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 font-medium text-sm">Total Amount</span>
                  <span className="text-amber-400 text-xl sm:text-2xl font-bold">₹{cartTotal}</span>
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
              {/* Handle bar for mobile */}
              <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />

              <h3 className="text-amber-400 text-lg sm:text-xl font-bold mb-4 sm:mb-5">
                Delivery Details
              </h3>

              {/* Location indicator */}
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

              {/* Order Summary */}
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

      {/* Order Tracking Modal */}
      <AnimatePresence>
        {showTracking && <OrderTracking onClose={() => setShowTracking(false)} />}
      </AnimatePresence>

      {/* Footer */}
      <div className="bg-gray-900/50 border-t border-gray-800/50 py-6 sm:py-8 px-4 text-center">
        <p className="text-gray-600 text-[10px] sm:text-xs">
          Fresh food, delivered simply.
        </p>
        <p className="text-gray-700 text-[10px] sm:text-xs mt-1 sm:mt-2">
          © 2026 YFC - Your Favourite Coffee. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default HomePage;
