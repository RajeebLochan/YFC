// App.js - Food Ordering Application
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import RestaurantPage from './pages/RestaurantPage';
import MyOrdersPage from './pages/MyOrdersPage';
import { LocationProvider } from './context/LocationContext';
import './App.css';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <LocationProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #D4AF37',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
          </Routes>
        </div>
      </Router>
    </LocationProvider>
  );
}

export default App;
