import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
 
const Settings = () => {
  const [settings, setSettings] = useState({
    payment: {
      merchantId: '',
      merchantKey: '',
      passphrase: '',
      testMode: true
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: true,
      emailTemplate: '',
      smsTemplate: ''
    },
    general: {
      restaurantName: '',
      address: '',
      phone: '',
      email: '',
      currency: 'ZAR',
      timezone: 'Africa/Johannesburg',
      logo_url: ''
    },
    admins:{
        name: '',
        surname: '',
        email: '',
        password: '',
        confirmpassword: '',
        role: 'admin',
        is_active: true
    }
  });

  const [activeTab, setActiveTab] = useState('payment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccessMessage('Settings saved successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };
  const handleAddAdmin = () => {}

  const renderPaymentSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Merchant ID</label>
          <input
            type="text"
            value={settings.payment.merchantId}
            onChange={(e) => handleChange('payment', 'merchantId', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Merchant Key</label>
          <input
            type="password"
            value={settings.payment.merchantKey}
            onChange={(e) => handleChange('payment', 'merchantKey', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Passphrase</label>
        <input
          type="password"
          value={settings.payment.passphrase}
          onChange={(e) => handleChange('payment', 'passphrase', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={settings.payment.testMode}
          onChange={(e) => handleChange('payment', 'testMode', e.target.checked)}
          className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">Test Mode</label>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.notifications.emailEnabled}
            onChange={(e) => handleChange('notifications', 'emailEnabled', e.target.checked)}
            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">Enable Email Notifications</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.notifications.smsEnabled}
            onChange={(e) => handleChange('notifications', 'smsEnabled', e.target.checked)}
            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">Enable SMS Notifications</label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email Template</label>
        <textarea
          value={settings.notifications.emailTemplate}
          onChange={(e) => handleChange('notifications', 'emailTemplate', e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">SMS Template</label>
        <textarea
          value={settings.notifications.smsTemplate}
          onChange={(e) => handleChange('notifications', 'smsTemplate', e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
        <input
          type="text"
          value={settings.general.restaurantName}
          onChange={(e) => handleChange('general', 'restaurantName', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <textarea
          value={settings.general.address}
          onChange={(e) => handleChange('general', 'address', e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          type="tel"
          value={settings.general.phone}
          onChange={(e) => handleChange('general', 'phone', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Currency</label>
          <select
            value={settings.general.currency}
            onChange={(e) => handleChange('general', 'currency', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          >
            <option value="ZAR">South African Rand (ZAR)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Timezone</label>
          <select
            value={settings.general.timezone}
            onChange={(e) => handleChange('general', 'timezone', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          >
            <option value="Africa/Johannesburg">Africa/Johannesburg</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>
    </div>
  );
  const manageadminUsers = () => (
    <div className="space-y-4">
        <div>
            <label className="mb-4 block text-sm font-medium text-gray-700">Add Admin User</label>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
                type="text"
                value={settings.general.name}
                onChange={(e) => handleChange('admins', 'name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
            <label className="block text-sm font-medium text-gray-700">Surname</label>
            <input
                type="text"
                value={settings.general.surname}
                onChange={(e) => handleChange('admins', 'surname', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
                type="email"
                value={settings.general.email}
                onChange={(e) => handleChange('admins', 'email', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
                type="password"
                value={settings.general.password}
                onChange={(e) => handleChange('admins', 'password', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
                type = "password"
                value={settings.general.confirmpassword}
                onChange={(e) => handleChange('admins', 'confirmpassword', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"                
            />
            <button
                type="button"
                onClick={handleAddAdmin}
                className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md"
            >
                Add Admin
            </button>
        </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8"
    >
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Settings</h3>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['payment', 'notifications', 'general', 'admins'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    ${activeTab === tab
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize
                  `}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative">
              {successMessage}
            </div>
          )}

          {/* Settings Form */}
          <form onSubmit={handleSubmit}>
            {activeTab === 'payment' && renderPaymentSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'admins' && manageadminUsers()}

            <div className="mt-6 flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`
                  inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                  ${loading ? 'bg-gray-400' : 'bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500'}
                `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;