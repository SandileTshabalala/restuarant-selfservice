const API_URL = 'http://localhost:5000/api';

export const createPaymentIntent = async (amount) => {
  const response = await fetch(`${API_URL}/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }
   
  return response.json();
};
 
export const completeOrder = async (orderData) => {
  const response = await fetch(`${API_URL}/complete-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to complete order');
  }
  
  return response.json();
};

export const getOrderStatus = async (orderNumber) => {
  const response = await fetch(`${API_URL}/order-status/${orderNumber}`);
  
  if (!response.ok) {
    throw new Error('Failed to get order status');
  }
  
  return response.json();
};
