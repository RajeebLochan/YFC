import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function OrderRating({ orderId, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ rating, review }),
      });
      if (res.ok) {
        setSubmitted(true);
        toast.success('Thank you for your feedback!');
        if (onSubmit) onSubmit({ rating, review });
      } else {
        toast.error('Failed to submit rating');
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px',
    },
    modal: {
      background: '#111111',
      border: '1px solid #2a2a2a',
      borderRadius: '16px',
      padding: '32px',
      width: '100%',
      maxWidth: '400px',
      textAlign: 'center',
    },
    title: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#D4AF37',
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '13px',
      color: '#808080',
      marginBottom: '24px',
    },
    stars: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '20px',
    },
    star: {
      fontSize: '40px',
      cursor: 'pointer',
      transition: 'transform 0.2s',
      userSelect: 'none',
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #2a2a2a',
      background: '#1a1a1a',
      color: '#fff',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical',
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
    },
    submitBtn: {
      width: '100%',
      padding: '14px',
      backgroundColor: '#D4AF37',
      color: '#111',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '15px',
      marginTop: '16px',
      transition: 'all 0.2s',
    },
    disabledBtn: {
      backgroundColor: '#333',
      color: '#666',
      cursor: 'not-allowed',
    },
    closeBtn: {
      background: 'transparent',
      border: '1px solid #2a2a2a',
      color: '#808080',
      padding: '10px',
      borderRadius: '8px',
      cursor: 'pointer',
      width: '100%',
      marginTop: '10px',
      fontSize: '13px',
    },
    successMsg: {
      fontSize: '48px',
      marginBottom: '16px',
    },
    ratingLabels: {
      fontSize: '13px',
      color: '#D4AF37',
      marginBottom: '20px',
      minHeight: '20px',
    },
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (submitted) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <motion.div
          style={styles.modal}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div style={styles.successMsg}>🎉</div>
          <h3 style={styles.title}>Thank You!</h3>
          <p style={{ color: '#808080', fontSize: '14px', marginBottom: '20px' }}>
            Your feedback helps us improve our service.
          </p>
          <button style={styles.closeBtn} onClick={onClose}>Close</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <motion.div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h3 style={styles.title}>Rate Your Order</h3>
        <p style={styles.subtitle}>Order #{orderId}</p>

        <div style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.span
              key={star}
              style={styles.star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              {star <= (hoverRating || rating) ? '⭐' : '☆'}
            </motion.span>
          ))}
        </div>

        <div style={styles.ratingLabels}>
          {ratingLabels[hoverRating || rating] || 'Tap a star to rate'}
        </div>

        <textarea
          placeholder="Write a review (optional)..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          style={styles.textarea}
        />

        <button
          onClick={handleSubmit}
          disabled={rating === 0 || loading}
          style={{
            ...styles.submitBtn,
            ...(rating === 0 ? styles.disabledBtn : {}),
          }}
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </button>

        <button style={styles.closeBtn} onClick={onClose}>
          Skip
        </button>
      </motion.div>
    </div>
  );
}

export default OrderRating;
