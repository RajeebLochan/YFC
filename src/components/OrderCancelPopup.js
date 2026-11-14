import React from 'react';

function OrderCancelPopup({ onConfirm, onClose }) {
  if (!onConfirm || !onClose) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      <div style={{
        background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px',
        padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
        <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Cancel Order?</h3>
        <p style={{ color: '#808080', fontSize: '13px', marginBottom: '24px' }}>
          Are you sure you want to cancel this order?
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: '6px', border: '1px solid #2a2a2a',
              background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '13px'
            }}
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px', borderRadius: '6px', border: 'none',
              background: '#e74c3c', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
            }}
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderCancelPopup;
