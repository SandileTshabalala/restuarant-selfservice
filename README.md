# Project Title: Kiosk Application

## Description
The Kiosk Application is a full-stack solution designed for managing orders and payments in a kiosk setting. It features a backend built with Flask and a frontend developed using React, providing a seamless user experience for both customers and administrators.

## Features
- User authentication and role management (Admin)
- Order management with real-time updates
- Payment processing through Stripe and PayFast
- SMS and email notifications using Twilio and SendGrid
- Dynamic menu management with categories, items, and extras
- Business intelligence analytics for order tracking

## Installation Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/kiosk.git
   cd kiosk
   ```

2. Set up the backend:
   - Navigate to the `backend` directory:
     ```bash
     cd backend
     ```
   - Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```

3. Set up the frontend:
   - Navigate to the `kiosk` directory:
     ```bash
     cd ../kiosk
     ```
   - Install dependencies:
     ```bash
     npm install
     ```

4. Create a `.env` file in both `backend` and `kiosk` directories and configure your environment variables as needed.

5. Run the backend server:
   ```bash
   python app.py
   ```

6. Run the frontend application:
   ```bash
   npm start
   ```

## Usage
- Access the application via your web browser at `http://localhost:3000`.
- Admins can log in to manage orders and menu items.

## Contribution Guidelines
Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License
This project is licensed under the MIT License.
