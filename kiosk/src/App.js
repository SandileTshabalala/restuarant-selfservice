import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/header';
import MainPage from './components/MainPage';
import Burgers from './components/Burgers';
import Drinks from './components/Drinks';
import Sides from './components/Sides';
import Breakfasts from './components/Breakfasts';
import Cart from './components/cart';
import ContactForm from './components/ContactForm';
import OrderSuccess from './components/OrderSuccess';
import PaymentProcessor from './components/PaymentProcessor';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentError from './components/PaymentError';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import DynamicCategory from './components/DynamicCategory';
import PayFast from './components/PayFast';
import PaymentResult from './components/PaymentResult';

// Admin route protection
const ProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Customer routes */}
        <Route
          path="/*"
          element={
            <>
              <Header />
              <main className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="max-w-full mx-auto">
                  <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/burgers" element={<Burgers />} />
                    <Route path="/drinks" element={<Drinks />} />
                    <Route path="/sides" element={<Sides />} />
                    <Route path="/breakfast" element={<Breakfasts />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/contact-form" element={<ContactForm />} />
                    <Route path="/order-success" element={<OrderSuccess />} />
                    {/* payfast */}
                    <Route path="/payment" element={<PayFast />} />
                    <Route path="/payment/success" element={<PaymentResult />} />
                    <Route path="/payment/cancel" element={<PaymentResult />} />
                    {/* stripe */}
                    <Route path="/payment-processor" element={<PaymentProcessor />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    <Route path="/payment-error" element={<PaymentError />} />
                    <Route path="/category/:categoryId" element={<DynamicCategory />} />
                  </Routes>
                </div>
              </main>
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default App;