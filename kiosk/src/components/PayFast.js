import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

const PayFast = () => {
  const navigate = useNavigate();
  const cart = useSelector((state) => state.cart);
  const [error, setError] = useState(null);

  // Extract amount and paymentId from cart
  const amount = cart.total;
   

  const handleSubmit = async () => {
    try {
      const baseUrl = window.location.origin;
      const response = await axios.post("http://localhost:5000/api/payfast-payment", { 
        amount: amount,
        base_url: baseUrl,
      });
  
      const pfData = response.data;
  
      // Ensure response contains all required fields
      if (!pfData || !pfData.m_payment_id || !pfData.signature) {
        throw new Error('Invalid response from server');
      }
  
      // Create a form and auto-submit
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://sandbox.payfast.co.za/eng/process";
  
      Object.entries(pfData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
  
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError("Payment initialization failed. Try again.");
    }
  };
  

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Complete Payment</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-8">
          <p className="text-xl font-semibold text-gray-700">Order Total: R{amount}</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleSubmit}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
          >
            Pay with PayFast
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="w-full py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 font-bold rounded-xl shadow-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-200"
          >
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayFast;
