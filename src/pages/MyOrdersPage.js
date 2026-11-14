import React from 'react';
import OrderTracking from '../components/OrderTracking';

function MyOrdersPage() {
  return <OrderTracking onClose={() => window.history.back()} />;
}

export default MyOrdersPage;
