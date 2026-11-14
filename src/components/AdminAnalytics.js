import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const headers = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/admin/analytics`, { headers });
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { padding: '0' },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      background: '#111',
      border: '1px solid #2a2a2a',
      borderRadius: '12px',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    },
    statIcon: {
      fontSize: '28px',
      marginBottom: '8px',
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#fff',
      marginBottom: '4px',
    },
    statLabel: {
      fontSize: '12px',
      color: '#808080',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    statAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '4px',
      height: '100%',
    },
    section: {
      background: '#111',
      border: '1px solid #2a2a2a',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#D4AF37',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    dailyRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #1a1a1a',
      fontSize: '13px',
    },
    dailyDate: { color: '#e0e0e0' },
    dailyOrders: { color: '#808080' },
    dailyRevenue: { color: '#D4AF37', fontWeight: '600' },
    topItemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      background: '#1a1a1a',
      borderRadius: '6px',
      marginBottom: '6px',
    },
    topItemRank: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: '#D4AF37',
      color: '#111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '700',
      marginRight: '12px',
    },
    topItemName: { flex: 1, fontSize: '13px', color: '#e0e0e0' },
    topItemCount: { fontSize: '13px', fontWeight: '600', color: '#D4AF37' },
    ratingCard: {
      background: '#1a1a1a',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '8px',
    },
    ratingStars: {
      fontSize: '14px',
      marginBottom: '4px',
    },
    ratingReview: {
      fontSize: '12px',
      color: '#b0b0b0',
      fontStyle: 'italic',
    },
    ratingMeta: {
      fontSize: '10px',
      color: '#606060',
      marginTop: '4px',
    },
    gridTwo: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '20px',
    },
    supportInfo: {
      marginTop: '20px',
      padding: '16px',
      background: '#111',
      border: '1px solid #2a2a2a',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#808080',
      textAlign: 'center',
    },
    barContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
    },
    barLabel: {
      width: '80px',
      fontSize: '11px',
      color: '#808080',
      textAlign: 'right',
    },
    barBg: {
      flex: 1,
      height: '20px',
      background: '#1a1a1a',
      borderRadius: '4px',
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: '4px',
      transition: 'width 1s ease',
    },
    barValue: {
      width: '40px',
      fontSize: '11px',
      color: '#e0e0e0',
      fontWeight: '600',
    },
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#808080' }}>Loading analytics...</div>;
  }

  if (!analytics) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#808080' }}>Failed to load analytics</div>;
  }

  const { summary, dailyStats, topItems, recentRatings } = analytics;
  const maxItemCount = topItems.length > 0 ? topItems[0].count : 1;

  return (
    <div style={styles.container}>
      {/* Summary Stats */}
      <div style={styles.statsGrid}>
        {[
          { icon: '📦', value: summary.todayOrders || 0, label: "Today's Orders", color: '#007bff' },
          { icon: '📋', value: summary.totalOrders || 0, label: 'Total Orders', color: '#28a745' },
          { icon: '💰', value: `₹${Math.round(summary.totalRevenue) || 0}`, label: 'Total Revenue', color: '#D4AF37' },
          { icon: '📈', value: `₹${Math.round(summary.avgOrderValue) || 0}`, label: 'Avg Order Value', color: '#17a2b8' },
          { icon: '⏳', value: summary.pendingOrders || 0, label: 'Pending Orders', color: '#dc3545' },
          { icon: '📅', value: `₹${Math.round(summary.todayRevenue) || 0}`, label: "Today's Revenue", color: '#ffc107' },
          { icon: '⭐', value: summary.avgRating > 0 ? summary.avgRating.toFixed(1) : 'N/A', label: 'Avg Rating', color: '#ff6b6b' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            style={styles.statCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div style={{ ...styles.statAccent, backgroundColor: stat.color }} />
            <div style={styles.statIcon}>{stat.icon}</div>
            <div style={styles.statValue}>{stat.value}</div>
            <div style={styles.statLabel}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={styles.gridTwo}>
        {/* Top Selling Items */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🏆 Top Selling Items</h3>
          {topItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#808080', padding: '20px', fontSize: '13px' }}>
              No sales data yet
            </div>
          ) : (
            topItems.map((item, index) => (
              <div key={item.name} style={styles.barContainer}>
                <div style={styles.barLabel}>{item.name.substring(0, 12)}</div>
                <div style={styles.barBg}>
                  <motion.div
                    style={{
                      ...styles.barFill,
                      backgroundColor: index === 0 ? '#D4AF37' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#2a2a2a',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / maxItemCount) * 100}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </div>
                <div style={styles.barValue}>{item.count}</div>
              </div>
            ))
          )}
        </div>

        {/* Daily Stats */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📊 Last 7 Days</h3>
          {dailyStats.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#808080', padding: '20px', fontSize: '13px' }}>
              No data for the last 7 days
            </div>
          ) : (
            dailyStats.map((day) => (
              <div key={day.date} style={styles.dailyRow}>
                <span style={styles.dailyDate}>{new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' })}</span>
                <span style={styles.dailyOrders}>{day.orders} orders</span>
                <span style={styles.dailyRevenue}>₹{Math.round(day.revenue)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Ratings */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>⭐ Recent Customer Ratings</h3>
        {recentRatings.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#808080', padding: '20px', fontSize: '13px' }}>
            No ratings yet
          </div>
        ) : (
          recentRatings.map((r) => (
            <div key={r.id} style={styles.ratingCard}>
              <div style={styles.ratingStars}>
                {'⭐'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
              </div>
              {r.review && <div style={styles.ratingReview}>"{r.review}"</div>}
              <div style={styles.ratingMeta}>
                Order: #{r.orderId} • {new Date(r.createdAt).toLocaleDateString('en-IN')}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default AdminAnalytics;
