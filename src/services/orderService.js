// API-based order service - all orders stored in SQLite via Express server
const API_BASE = process.env.REACT_APP_API_URL || '/api';

const getAdminToken = () => sessionStorage.getItem('admin_token');

const withAuthHeaders = (isJson = false) => {
  const headers = { Accept: 'application/json' };
  const token = getAdminToken();
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const orderService = {
  // Get all orders from SQLite
  async getAllOrders() {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: withAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const orders = await res.json();
      console.log('✅ Orders loaded from server:', orders.length);
      return orders;
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  },

  // Add new order to SQLite
  async addOrder(orderData) {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) throw new Error('Failed to add order');
      const result = await res.json();
      console.log('✅ Order saved to server:', result);
      return result;
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  },

  // Update order status in SQLite
  async updateStatus(id, status) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/status`, {
        method: 'PUT',
        headers: withAuthHeaders(true),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return await res.json();
    } catch (error) {
      console.error('Error updating status:', error);
      return { success: false };
    }
  },

  // Delete order from SQLite
  async deleteOrder(id) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: 'DELETE',
        headers: withAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete order');
      return await res.json();
    } catch (error) {
      console.error('Error deleting order:', error);
      return { success: false };
    }
  },

  // Get statistics from SQLite
  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`, {
        headers: withAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return await res.json();
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        total: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
        totalEarnings: 0,
        todayEarnings: 0
      };
    }
  },

  // Search orders by phone (fetches all, filters client-side)
  async searchByPhone(phone) {
    try {
      const normalizedPhone = String(phone || '').replace(/\D/g, '').slice(-10);
      const res = await fetch(`${API_BASE}/orders/track?phone=${encodeURIComponent(normalizedPhone)}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to search orders');
      return await res.json();
    } catch (error) {
      console.error('Error searching orders:', error);
      return [];
    }
  },

  // Admin login
  async adminLogin(username, password) {
    try {
      const normalizedUsername = String(username || '').trim();
      const normalizedPassword = String(password || '').trim();
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ username: normalizedUsername, password: normalizedPassword }),
      });
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { error: raw || 'Login failed' };
      }
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (data.token) {
        sessionStorage.setItem('admin_token', data.token);
      }
      return data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Submit order rating
  async submitRating(orderId, rating, review) {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ rating, review }),
      });
      if (!res.ok) throw new Error('Failed to submit rating');
      return await res.json();
    } catch (error) {
      console.error('Error submitting rating:', error);
      return { success: false };
    }
  },

  // Get restaurants with menus from server
  async getRestaurants() {
    try {
      const res = await fetch(`${API_BASE}/restaurants`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      return await res.json();
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
  },

  // Get analytics
  async getAnalytics() {
    try {
      const res = await fetch(`${API_BASE}/admin/analytics`, {
        headers: withAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return await res.json();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  },

  async adminLogout() {
    try {
      await fetch(`${API_BASE}/admin/logout`, {
        method: 'POST',
        headers: withAuthHeaders(),
      });
    } finally {
      sessionStorage.removeItem('admin_token');
    }
  }
};
