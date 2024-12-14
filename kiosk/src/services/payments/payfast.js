import CryptoJS from 'crypto-js';
  
// Replace with your PayFast merchant details
const PAYFAST_MERCHANT_ID = process.env.REACT_APP_PAYFAST_MERCHANT_ID;
const PAYFAST_MERCHANT_KEY = process.env.REACT_APP_PAYFAST_MERCHANT_KEY;
const PAYFAST_PASSPHRASE = 'your_passphrase';
const PAYFAST_URL = process.env.NODE_ENV === 'production' 
  ? 'https://www.payfast.co.za/eng/process'
  : 'https://sandbox.payfast.co.za/eng/process';

export const generatePayfastForm = (order) => {
  const data = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: `${window.location.origin}/payment-success`,
    cancel_url: `${window.location.origin}/payment-cancelled`,
    notify_url: `${window.location.origin}/api/payfast-notify`,
    amount: order.total.toFixed(2),
    item_name: `Order #${order.id}`,
    email_address: 'customer@kiosk.local', // For kiosk, we use a default email
    cell_number: '', // Optional for SMS notifications
    payment_method: '', // Leave empty for all payment methods
  };

  // Generate signature
  const signature = generateSignature(data);
  return {
    url: PAYFAST_URL,
    data: { ...data, signature },
  };
};

const generateSignature = (data) => {
  // Sort the object by key
  const sortedData = Object.keys(data)
    .sort()
    .reduce((acc, key) => {
      acc[key] = data[key];
      return acc;
    }, {});

  // Create the query string
  const queryString = Object.entries(sortedData)
    .map(([key, value]) => `${key}=${encodeURIComponent(value.trim())}`)
    .join('&');

  // Generate signature using MD5
  return CryptoJS.MD5(queryString + PAYFAST_PASSPHRASE).toString();
};
