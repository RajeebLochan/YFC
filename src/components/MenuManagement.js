import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const getAdminHeaders = (isJson = false) => {
  const token = sessionStorage.getItem('admin_token');
  const headers = { Accept: 'application/json' };
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

function MenuManagement() {
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [itemForm, setItemForm] = useState({
    restaurantId: '', name: '', price: '', category: '', description: '', popular: false, image: '', available: true, isVeg: true
  });
  const [restaurantForm, setRestaurantForm] = useState({
    name: '', image: '', cuisine: '', rating: '4.0', deliveryTime: '30-40 min', minOrder: '50', featured: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resRes, itemsRes] = await Promise.all([
        fetch(`${API_BASE}/restaurants`, { headers: { Accept: 'application/json' } }),
        fetch(`${API_BASE}/menu-items`, { headers: getAdminHeaders() })
      ]);
      const resData = await resRes.json();
      const itemsData = await itemsRes.json();
      setRestaurants(resData);
      setMenuItems(itemsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  // ========== RESTAURANT CRUD ==========
  const handleAddRestaurant = async () => {
    if (!restaurantForm.name) { toast.error('Restaurant name is required'); return; }
    try {
      const res = await fetch(`${API_BASE}/restaurants`, {
        method: 'POST',
        headers: getAdminHeaders(true),
        body: JSON.stringify(restaurantForm),
      });
      if (res.ok) {
        toast.success('Restaurant added!');
        setShowAddRestaurant(false);
        setRestaurantForm({ name: '', image: '', cuisine: '', rating: '4.0', deliveryTime: '30-40 min', minOrder: '50', featured: false });
        loadData();
      }
    } catch (error) {
      toast.error('Failed to add restaurant');
    }
  };

  const handleUpdateRestaurant = async () => {
    if (!editingRestaurant) return;
    try {
      const res = await fetch(`${API_BASE}/restaurants/${editingRestaurant.id}`, {
        method: 'PUT',
        headers: getAdminHeaders(true),
        body: JSON.stringify({
          ...restaurantForm,
          rating: parseFloat(restaurantForm.rating) || 4.0,
          minOrder: parseInt(restaurantForm.minOrder) || 50,
          active: true,
        }),
      });
      if (res.ok) {
        toast.success('Restaurant updated!');
        setEditingRestaurant(null);
        loadData();
      }
    } catch (error) {
      toast.error('Failed to update restaurant');
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm('Are you sure? This will hide the restaurant.')) return;
    try {
      const res = await fetch(`${API_BASE}/restaurants/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        toast.success('Restaurant removed!');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to remove restaurant');
    }
  };

  // ========== MENU ITEM CRUD ==========
  const handleAddItem = async () => {
    if (!itemForm.restaurantId || !itemForm.name || !itemForm.price) {
      toast.error('Restaurant, name, and price are required');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/menu-items`, {
        method: 'POST',
        headers: getAdminHeaders(true),
        body: JSON.stringify({
          ...itemForm,
          price: parseFloat(itemForm.price),
        }),
      });
      if (res.ok) {
        toast.success('Menu item added!');
        setShowAddItem(false);
        setItemForm({ restaurantId: '', name: '', price: '', category: '', description: '', popular: false, image: '', available: true, isVeg: true });
        loadData();
      }
    } catch (error) {
      toast.error('Failed to add menu item');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch(`${API_BASE}/menu-items/${editingItem.id}`, {
        method: 'PUT',
        headers: getAdminHeaders(true),
        body: JSON.stringify({
          ...itemForm,
          price: parseFloat(itemForm.price),
        }),
      });
      if (res.ok) {
        toast.success('Menu item updated!');
        setEditingItem(null);
        loadData();
      }
    } catch (error) {
      toast.error('Failed to update menu item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      const res = await fetch(`${API_BASE}/menu-items/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        toast.success('Menu item deleted!');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const startEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      restaurantId: item.restaurantId,
      name: item.name,
      price: item.price.toString(),
      category: item.category || '',
      description: item.description || '',
      popular: !!item.popular,
      image: item.image || '',
      available: item.available !== 0 && item.isAvailable !== false,
      isVeg: item.isVeg !== false && item.isVeg !== 0,
    });
  };

  const startEditRestaurant = (restaurant) => {
    setEditingRestaurant(restaurant);
    setRestaurantForm({
      name: restaurant.name,
      image: restaurant.image || '',
      cuisine: restaurant.cuisine || '',
      rating: (restaurant.rating || 4.0).toString(),
      deliveryTime: restaurant.deliveryTime || '30-40 min',
      minOrder: (restaurant.minOrder || 50).toString(),
      featured: !!restaurant.featured,
    });
  };

  const filteredItems = menuItems.filter(item => {
    const matchesRestaurant = selectedRestaurant === 'all' || item.restaurantId === selectedRestaurant;
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRestaurant && matchesSearch;
  });

  const categories = [...new Set(menuItems.map(item => item.category).filter(Boolean))];

  const styles = {
    container: { padding: '0' },
    section: {
      background: '#111',
      border: '1px solid #2a2a2a',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#D4AF37',
      marginBottom: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    addBtn: {
      padding: '8px 16px',
      backgroundColor: '#D4AF37',
      color: '#111',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600',
    },
    restaurantGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '12px',
    },
    restaurantCard: {
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
    },
    restaurantImg: {
      width: '60px',
      height: '60px',
      borderRadius: '8px',
      objectFit: 'cover',
      border: '1px solid #333',
    },
    restaurantInfo: { flex: 1 },
    restaurantName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#fff',
      marginBottom: '4px',
    },
    restaurantMeta: {
      fontSize: '11px',
      color: '#808080',
    },
    actionBtns: {
      display: 'flex',
      gap: '6px',
    },
    editBtn: {
      padding: '4px 10px',
      fontSize: '11px',
      background: '#2a2a2a',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    deleteBtn: {
      padding: '4px 10px',
      fontSize: '11px',
      background: '#e74c3c',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    filterRow: {
      display: 'flex',
      gap: '10px',
      marginBottom: '16px',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    filterSelect: {
      padding: '8px 12px',
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '12px',
      outline: 'none',
    },
    searchInput: {
      padding: '8px 12px',
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '12px',
      outline: 'none',
      flex: 1,
      minWidth: '200px',
    },
    itemsTable: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 6px',
    },
    tableHeader: {
      fontSize: '11px',
      color: '#808080',
      textAlign: 'left',
      padding: '8px 12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    tableRow: {
      background: '#1a1a1a',
    },
    tableCell: {
      padding: '12px',
      fontSize: '13px',
      color: '#e0e0e0',
      borderTop: '1px solid #2a2a2a',
      borderBottom: '1px solid #2a2a2a',
    },
    tableCellFirst: {
      borderLeft: '1px solid #2a2a2a',
      borderRadius: '6px 0 0 6px',
    },
    tableCellLast: {
      borderRight: '1px solid #2a2a2a',
      borderRadius: '0 6px 6px 0',
    },
    itemImg: {
      width: '40px',
      height: '40px',
      borderRadius: '6px',
      objectFit: 'cover',
    },
    priceBadge: {
      color: '#D4AF37',
      fontWeight: '700',
      fontSize: '14px',
    },
    categoryBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      background: '#2a2a2a',
      color: '#D4AF37',
      textTransform: 'uppercase',
    },
    popularBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      background: '#ff444420',
      color: '#ff4444',
    },
    availableBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px',
    },
    modal: {
      background: '#111',
      border: '1px solid #2a2a2a',
      borderRadius: '12px',
      padding: '24px',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '80vh',
      overflowY: 'auto',
    },
    modalTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#D4AF37',
      marginBottom: '20px',
    },
    formGroup: {
      marginBottom: '14px',
    },
    formLabel: {
      display: 'block',
      fontSize: '12px',
      color: '#808080',
      marginBottom: '6px',
      fontWeight: '500',
    },
    formInput: {
      width: '100%',
      padding: '10px 12px',
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '13px',
      outline: 'none',
      boxSizing: 'border-box',
    },
    formSelect: {
      width: '100%',
      padding: '10px 12px',
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '13px',
      outline: 'none',
      boxSizing: 'border-box',
    },
    formCheckbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      color: '#e0e0e0',
      cursor: 'pointer',
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
    },
    modalButtons: {
      display: 'flex',
      gap: '10px',
      marginTop: '20px',
    },
    saveBtn: {
      flex: 2,
      padding: '10px',
      background: '#D4AF37',
      color: '#111',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '13px',
    },
    cancelBtn: {
      flex: 1,
      padding: '10px',
      background: '#2a2a2a',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
    },
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '12px',
      marginBottom: '20px',
    },
    statCard: {
      background: '#111',
      border: '1px solid #2a2a2a',
      borderRadius: '8px',
      padding: '16px',
      textAlign: 'center',
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#D4AF37',
    },
    statLabel: {
      fontSize: '11px',
      color: '#808080',
      marginTop: '4px',
      textTransform: 'uppercase',
    },
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#808080' }}>Loading menu data...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Quick Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{restaurants.length}</div>
          <div style={styles.statLabel}>Restaurants</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{menuItems.length}</div>
          <div style={styles.statLabel}>Menu Items</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{categories.length}</div>
          <div style={styles.statLabel}>Categories</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{menuItems.filter(i => i.popular).length}</div>
          <div style={styles.statLabel}>Popular Items</div>
        </div>
      </div>

      {/* Restaurants Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span>🏪 Restaurants</span>
          <button style={styles.addBtn} onClick={() => setShowAddRestaurant(true)}>+ Add Restaurant</button>
        </div>
        <div style={styles.restaurantGrid}>
          {restaurants.map(restaurant => (
            <motion.div key={restaurant.id} style={styles.restaurantCard} whileHover={{ borderColor: '#D4AF37' }}>
              <img src={restaurant.image} alt={restaurant.name} style={styles.restaurantImg} 
                onError={(e) => { e.target.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=500'; }} />
              <div style={styles.restaurantInfo}>
                <div style={styles.restaurantName}>{restaurant.name}</div>
                <div style={styles.restaurantMeta}>
                  {restaurant.cuisine} • ⭐ {restaurant.rating} • {restaurant.deliveryTime}
                </div>
                <div style={styles.restaurantMeta}>
                  Min Order: ₹{restaurant.minOrder} • {restaurant.menu?.length || 0} items
                </div>
              </div>
              <div style={styles.actionBtns}>
                <button style={styles.editBtn} onClick={() => startEditRestaurant(restaurant)}>✏️</button>
                <button style={styles.deleteBtn} onClick={() => handleDeleteRestaurant(restaurant.id)}>🗑️</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Menu Items Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span>🍽️ Menu Items</span>
          <button style={styles.addBtn} onClick={() => { setShowAddItem(true); setItemForm({ ...itemForm, restaurantId: selectedRestaurant !== 'all' ? selectedRestaurant : '' }); }}>+ Add Item</button>
        </div>

        <div style={styles.filterRow}>
          <select
            style={styles.filterSelect}
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
          >
            <option value="all">All Restaurants</option>
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input
            style={styles.searchInput}
            placeholder="🔍 Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span style={{ fontSize: '12px', color: '#808080' }}>
            {filteredItems.length} items
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.itemsTable}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Image</th>
                <th style={styles.tableHeader}>Name</th>
                <th style={styles.tableHeader}>Restaurant</th>
                <th style={styles.tableHeader}>Category</th>
                <th style={styles.tableHeader}>Price</th>
                <th style={styles.tableHeader}>Status</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellFirst }}>
                    <img src={item.image} alt={item.name} style={styles.itemImg}
                      onError={(e) => { e.target.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=500'; }} />
                  </td>
                  <td style={styles.tableCell}>
                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#808080' }}>{item.description}</div>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={{ fontSize: '12px', color: '#b0b0b0' }}>{item.restaurantName}</span>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={styles.categoryBadge}>{item.category}</span>
                    {item.popular ? <span style={{ ...styles.popularBadge, marginLeft: '4px' }}>🔥</span> : null}
                  </td>
                  <td style={styles.tableCell}>
                    <span style={styles.priceBadge}>₹{item.price}</span>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={{
                      ...styles.availableBadge,
                      background: item.available !== 0 && item.isAvailable !== false ? '#2ecc7120' : '#e74c3c20',
                      color: item.available !== 0 && item.isAvailable !== false ? '#2ecc71' : '#e74c3c',
                    }}>
                      {item.available !== 0 && item.isAvailable !== false ? '✅ Available' : '❌ Unavailable'}
                    </span>
                    <span style={{
                      display: 'inline-block',
                      marginLeft: '6px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '600',
                      background: item.isVeg !== false && item.isVeg !== 0 ? '#16a34a20' : '#dc262620',
                      color: item.isVeg !== false && item.isVeg !== 0 ? '#22c55e' : '#ef4444',
                    }}>
                      {item.isVeg !== false && item.isVeg !== 0 ? '🟢 Veg' : '🔴 Non-Veg'}
                    </span>
                  </td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLast }}>
                    <div style={styles.actionBtns}>
                      <button style={styles.editBtn} onClick={() => startEditItem(item)}>✏️ Edit</button>
                      <button style={styles.deleteBtn} onClick={() => handleDeleteItem(item.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#808080', fontSize: '13px' }}>
            No menu items found
          </div>
        )}
      </div>

      {/* ========== ADD/EDIT ITEM MODAL ========== */}
      <AnimatePresence>
        {(showAddItem || editingItem) && (
          <motion.div
            style={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowAddItem(false); setEditingItem(null); }}
          >
            <motion.div
              style={styles.modal}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={styles.modalTitle}>
                {editingItem ? '✏️ Edit Menu Item' : '➕ Add New Menu Item'}
              </h3>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Restaurant *</label>
                <select
                  style={styles.formSelect}
                  value={itemForm.restaurantId}
                  onChange={(e) => setItemForm({ ...itemForm, restaurantId: e.target.value })}
                >
                  <option value="">Select Restaurant</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Item Name *</label>
                <input
                  style={styles.formInput}
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g., MASALA TEA"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Price (₹) *</label>
                  <input
                    type="number"
                    style={styles.formInput}
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    placeholder="e.g., 50"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Category</label>
                  <select
                    style={styles.formSelect}
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    <option value="coffee">Coffee</option>
                    <option value="tea">Tea</option>
                    <option value="rolls">Rolls</option>
                    <option value="bakery">Bakery</option>
                    <option value="sweets">Sweets</option>
                    <option value="snacks">Snacks</option>
                    <option value="momos">Momos</option>
                    <option value="combo">Combo</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description</label>
                <input
                  style={styles.formInput}
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="e.g., Fresh brewed with spices"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Image URL</label>
                <input
                  style={styles.formInput}
                  value={itemForm.image}
                  onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                  placeholder="https://..."
                />
                {itemForm.image && (
                  <img src={itemForm.image} alt="preview" style={{ width: '60px', height: '60px', borderRadius: '6px', marginTop: '8px', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }} />
                )}
              </div>

              <div style={styles.formRow}>
                <label style={styles.formCheckbox}>
                  <input
                    type="checkbox"
                    checked={itemForm.popular}
                    onChange={(e) => setItemForm({ ...itemForm, popular: e.target.checked })}
                  />
                  🔥 Popular Item
                </label>
                <label style={styles.formCheckbox}>
                  <input
                    type="checkbox"
                    checked={itemForm.available}
                    onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })}
                  />
                  ✅ Available
                </label>
              </div>

              <div style={{ ...styles.formRow, marginTop: '10px' }}>
                <label style={styles.formCheckbox}>
                  <input
                    type="checkbox"
                    checked={itemForm.isVeg}
                    onChange={(e) => setItemForm({ ...itemForm, isVeg: e.target.checked })}
                  />
                  🟢 Veg Item
                </label>
                <div style={{ fontSize: '12px', color: '#808080', display: 'flex', alignItems: 'center' }}>
                  {itemForm.isVeg ? '🟢 Marked as Veg' : '🔴 Marked as Non-Veg'}
                </div>
              </div>

              <div style={styles.modalButtons}>
                <button
                  style={styles.cancelBtn}
                  onClick={() => { setShowAddItem(false); setEditingItem(null); }}
                >
                  Cancel
                </button>
                <button
                  style={styles.saveBtn}
                  onClick={editingItem ? handleUpdateItem : handleAddItem}
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== ADD/EDIT RESTAURANT MODAL ========== */}
      <AnimatePresence>
        {(showAddRestaurant || editingRestaurant) && (
          <motion.div
            style={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowAddRestaurant(false); setEditingRestaurant(null); }}
          >
            <motion.div
              style={styles.modal}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={styles.modalTitle}>
                {editingRestaurant ? '✏️ Edit Restaurant' : '➕ Add New Restaurant'}
              </h3>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Restaurant Name *</label>
                <input
                  style={styles.formInput}
                  value={restaurantForm.name}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                  placeholder="e.g., Royal Cafe"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Cuisine Type</label>
                <input
                  style={styles.formInput}
                  value={restaurantForm.cuisine}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, cuisine: e.target.value })}
                  placeholder="e.g., Coffee & Snacks"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Image URL</label>
                <input
                  style={styles.formInput}
                  value={restaurantForm.image}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    style={styles.formInput}
                    value={restaurantForm.rating}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, rating: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Min Order (₹)</label>
                  <input
                    type="number"
                    style={styles.formInput}
                    value={restaurantForm.minOrder}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, minOrder: e.target.value })}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Delivery Time</label>
                <input
                  style={styles.formInput}
                  value={restaurantForm.deliveryTime}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, deliveryTime: e.target.value })}
                  placeholder="e.g., 30-40 min"
                />
              </div>

              <label style={styles.formCheckbox}>
                <input
                  type="checkbox"
                  checked={restaurantForm.featured}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, featured: e.target.checked })}
                />
                ✨ Featured Restaurant
              </label>

              <div style={styles.modalButtons}>
                <button
                  style={styles.cancelBtn}
                  onClick={() => { setShowAddRestaurant(false); setEditingRestaurant(null); }}
                >
                  Cancel
                </button>
                <button
                  style={styles.saveBtn}
                  onClick={editingRestaurant ? handleUpdateRestaurant : handleAddRestaurant}
                >
                  {editingRestaurant ? 'Update Restaurant' : 'Add Restaurant'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MenuManagement;
