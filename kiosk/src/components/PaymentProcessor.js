import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { createPaymentIntent } from '../services/api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
if (!stripePromise) {
  throw new Error('Stripe publishable key is not defined');
}
 
const CheckoutForm = ({ amount, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message);
        return;
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (paymentError) {
        setError(paymentError.message);
        navigate('/payment-error', { state: { error: paymentError.message } });
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Navigate to contact form with payment intent
        navigate('/contact-form', { 
          state: { 
            paymentIntent: paymentIntent.id,
            amount: amount 
          }
        });
      }
    } catch (e) {
      setError('An unexpected error occurred.');
      navigate('/payment-error', { state: { error: 'An unexpected error occurred.' } });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <PaymentElement />
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-500 rounded-lg">
          {error}
        </div>
      )}
      <motion.button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`mt-6 w-full bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold
          ${(!stripe || isProcessing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-600'}
          transition-colors duration-200`}
      >
        {isProcessing ? 'Processing...' : `Pay R${amount.toFixed(2)}`}
      </motion.button>
    </form>
  );
};

const PaymentProcessor = () => {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState(null);
  const cart = useSelector((state) => state.cart);
  const cartTotal = cart.total;

  useEffect(() => {
    const initializePayment = async () => {
      try {
        if (!cartTotal) {
          throw new Error('Cart total is required');
        }
        const response = await createPaymentIntent(cartTotal);
        setClientSecret(response.clientSecret);
      } catch (err) {
        setError(err.message);
      }
    };

    initializePayment();
  }, [cartTotal]);

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error: {error}
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
 
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <motion.h2 className="text-2xl font-bold text-gray-800">Checkout</motion.h2>
        <p className="text-gray-600 mt-2">Complete your purchase</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700">Order Summary</h3>
          <motion.p className="text-xl font-bold text-gray-900 mt-2">
            Total: R{cartTotal.toFixed(2)}
          </motion.p>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm amount={cartTotal} clientSecret={clientSecret} />
        </Elements>
      </div>
    </div>
  );
};

export default PaymentProcessor;
