import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Set up polling for new orders
    const interval = setInterval(fetchOrders, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderNumber, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderNumber}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Orders</h2>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <motion.div
            key={order.order_number}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.order_number}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Contact:</span>
                  <div className="text-right">
                    {order.email && <div>{order.email}</div>}
                    {order.phone && <div>{order.phone}</div>}
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span>Total Amount:</span>
                  <span className="font-semibold">R{order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="mt-4 text-sm text-yellow-600 hover:text-yellow-700"
              >
                {expandedOrder === order.id ? 'Hide Details' : 'Show Details'}
              </button>

              {expandedOrder === order.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 border-t pt-4"
                >
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items:</h4>
                  <ul className="space-y-2">
                    {order.items.map((item, index) => (
                      <li
                        key={index}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span>
                          {item.item_name} x {item.quantity}
                          {item.extras && (() => {
                            try {
                              const extras = JSON.parse(item.extras.replace(/'/g, '"'));
                              if (extras && extras.length > 0) {
                                return (
                                  <div className="ml-4 text-sm text-gray-600">
                                    <p>Extras: {extras.map(extra => 
                                      `${extra.name} (+R${extra.price.toFixed(2)})`
                                    ).join(', ')}</p>
                                  </div>
                                );
                              }
                            } catch (e) {
                              return null;
                            }
                          })()}
                          {item.size && (() => {
                            try {
                              const size = JSON.parse(item.size.replace(/'/g, '"'));
                              if (size && size.name) {
                                return (
                                  <div className="ml-4 text-sm text-gray-600">
                                    <p>Size: {size.name} {size.price > 0 ? `(+R${size.price.toFixed(2)})` : ''}</p>
                                  </div>
                                );
                              }
                            } catch (e) {
                              return null;
                            }
                          })()}
                          {item.piece_option && (() => {
                            try {
                              const option = JSON.parse(item.piece_option.replace(/'/g, '"'));
                              if (option && option.quantity) {
                                return (
                                  <div className="ml-4 text-sm text-gray-600">
                                    <p>{item.piece_option && item.piece_option.length > 0} pieces(R{parseFloat(option.price).toFixed(2)})</p>
                                  </div>
                                );
                              }
                            } catch (e) {
                              return null;
                            }
                          })()}
                        </span>
                        <span>R{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              <div className="mt-4 flex justify-end space-x-2">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.order_number, e.target.value)}
                  className="text-sm rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </motion.div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No orders found
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
