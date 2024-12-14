from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
import os
import stripe
from twilio.rest import Client
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import random
import string
from dotenv import load_dotenv
from functools import wraps
import jwt
import bcrypt
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash
from sqlalchemy import Text
import hashlib
import time
from flask_caching import Cache

load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Configure CORS
app.config['CORS_HEADERS'] = 'Content-Type'

# Database configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Initialize Flask-Migrate
migrate = Migrate(app, db)

# Stripe configuration
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

#payfast configuration
PAYFAST_MERCHANT_ID = os.getenv('PAYFAST_MERCHANT_ID')
PAYFAST_MERCHANT_KEY = os.getenv('PAYFAST_MERCHANT_KEY')
PAYFAST_PASSPHRASE = os.getenv('PAYFAST_PASSPHRASE')
# Determine if the environment is production
PAYFAST_URL = (
    "https://www.payfast.co.za/eng/process"
    if os.getenv("NODE_ENV") == "production"
    else "https://sandbox.payfast.co.za/eng/process"
)

# Twilio configuration
twilio_client = Client(
    os.getenv('TWILIO_ACCOUNT_SID'),
    os.getenv('TWILIO_AUTH_TOKEN')
)

# SendGrid configuration
sendgrid_client = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))

# Caching configuration
cache = Cache(config={
    'CACHE_TYPE': 'simple',
    'CACHE_DEFAULT_TIMEOUT': 300  # 5 minutes
})
cache.init_app(app)

# Models
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(10), unique=True, nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('OrderItem', backref='order', lazy=True)

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    extras = db.Column(db.Text)
    size = db.Column(db.Text)
    piece_option = db.Column(db.Text)

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    image_url = db.Column(db.String(200))
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    extras = db.relationship('Extra', backref='menu_item', lazy=True, cascade='all, delete-orphan')
    sizes = db.relationship('Size', backref='menu_item', lazy=True, cascade='all, delete-orphan')
    piece_options = db.relationship('PieceOption', backref='menu_item', lazy=True, cascade='all, delete-orphan')

class Extra(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)

class Size(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)

class PieceOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)  # number of pieces
    price = db.Column(db.Float, nullable=False)  # price for this quantity
    is_default = db.Column(db.Boolean, default=False)  # if this is the default option

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.Text)
    image_url = db.Column(Text)
    icon = db.Column(db.String(10))  # For storing emoji icons
    is_default = db.Column(db.Boolean, default=False)  # To distinguish default categories

# Admin Authentication
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, os.getenv('JWT_SECRET_KEY'), algorithms=['HS256'])
            admin_id = payload['admin_id']
            admin = db.session.get(Admin, admin_id)
            if not admin:
                raise Exception('Admin not found')
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
            
        return f(*args, **kwargs)
    return decorated_function


#generators of order number
def generate_order_number():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
#services
def send_sms(phone_number, message):
    try:
        twilio_client.messages.create(
            body=message,
            from_=os.getenv('TWILIO_PHONE_NUMBER'),
            to=phone_number
        )
        return True
    except Exception as e:
        print(f"SMS Error: {str(e)}")
        return False

def send_email(to_email, subject, content):
    try:
        message = Mail(
            from_email=os.getenv('SENDGRID_FROM_EMAIL'),
            to_emails=to_email,
            subject=subject,
            html_content=content
        )
        sendgrid_client.send(message)
        return True
    except Exception as e:
        print(f"Email Error: {str(e)}")
        return False
#routes
#payments
#stripe
@app.route('/api/create-payment-intent', methods=['POST'])
def create_payment_intent():
    try:
        data = request.json
        amount = int(float(data['amount']) * 100)  # Convert to cents
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than zero'}), 400

        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='zar'
        )

        return jsonify({'clientSecret': intent['client_secret']})
    except Exception as e:
        print(f"Error creating payment intent: {str(e)}")
        return jsonify({'error': 'Failed to create payment intent', 'message': str(e)}), 400
#payfast
def generate_signature(data):
    """Generate the signature required for PayFast requests."""
    sorted_items = sorted(data.items())
    signature_string = "&".join(f"{key}={value}" for key, value in sorted_items)
    if PAYFAST_PASSPHRASE:
        signature_string += f"&passphrase={PAYFAST_PASSPHRASE}"

    return hashlib.md5(signature_string.encode()).hexdigest()

@app.route("/api/payfast-payment", methods=["POST"])
def payfast_payment():
    """Generate PayFast payment details."""
    try:
        data = request.json
        amount = data.get("amount")
        base_url = data.get("base_url")
        if not amount or not base_url:
            return jsonify({'error': 'Amount is required'}), 400

        payment_id = f"ORDER_{int(time.time())}"
        item_name = f"Restaurant Order #{payment_id}"

        pf_data = {
            "merchant_id": PAYFAST_MERCHANT_ID,
            "merchant_key": PAYFAST_MERCHANT_KEY,
            "return_url": f"{base_url}/payment/success",
            "cancel_url": f"{base_url}/payment/cancel",
            "notify_url": f"{base_url}/api/payment/notify",
            "m_payment_id": payment_id,
            "amount": f"{float(amount):.2f}",
            "item_name": item_name,
        }

        # Generate signature
        pf_data["signature"] = generate_signature(pf_data)

        return jsonify(pf_data)
    except Exception as e:
        print(f"Error in payfast_payment: {str(e)}")
        return jsonify({'error': 'Payment initialization failed', 'message': str(e)}), 500

@app.route('/api/payment/notify', methods=['POST'])
def payment_notification():
    try:
        # Verify the payment notification is from PayFast
        pfData = request.form.to_dict()
        
        # TODO: Implement signature verification
        # signature = generate_signature(pfData, PAYFAST_PASSPHRASE)
        # if signature != pfData['signature']:
        #     return 'Invalid signature', 400

        # received_signature = pfData.pop("signature", None)
        # generated_signature = generate_signature(pfData)
        # if received_signature != generated_signature:
        #     return "Invalid signature", 400

        payment_status = pfData.get('payment_status')
        order_id = pfData.get('m_payment_id')
        amount_gross = pfData.get('amount_gross')

        if payment_status == "COMPLETE":
            # Update order status in database
            order = Order.query.filter_by(order_number=order_id).first()
            if order:
                order.status = 'paid'
                order.total_amount = float(amount_gross)
                db.session.commit()
                return "Payment processed successfully", 200

                # Send confirmation email/SMS
                try:
                    if order.email:
                        send_email(
                            order.email,
                            'Order Payment Confirmed',
                            f'Thank you for your payment of R{amount_gross}. Your order #{order_id} has been confirmed.'
                        )
                    if order.phone:
                        send_sms(
                            order.phone,
                            f'Payment received for order #{order_id}. Amount: R{amount_gross}'
                        )
                except Exception as e:
                    print(f"Error sending confirmation: {str(e)}")

        return 'OK'
    except Exception as e:
        print(f"Error processing payment notification: {str(e)}")
        return str(e), 500


@app.route('/api/complete-order', methods=['POST'])
def complete_order():
    try:
        data = request.json
        app.logger.info(f"Received order data: {data}")
        
        if not data:
            app.logger.error("No data provided in request")
            return jsonify({'error': 'No data provided', 'success': False}), 400
            
        if 'items' not in data or not data['items']:
            app.logger.error("No items in order")
            return jsonify({'error': 'No items in order', 'success': False}), 400
            
        if 'amount' not in data:
            app.logger.error("Total amount not provided")
            return jsonify({'error': 'Total amount not provided', 'success': False}), 400

        if not data.get('paymentIntent'):
            app.logger.error("Payment intent not provided")
            return jsonify({'error': 'Payment intent not provided', 'success': False}), 400

        order_number = generate_order_number()
        app.logger.info(f"Generated order number: {order_number}")
        
        # Create order in database
        order = Order(
            order_number=order_number,
            email=data.get('email'),
            phone=data.get('phone'),
            total_amount=float(data['amount']),
            status='completed'
        )
        db.session.add(order)
        app.logger.info(f"Created order: {order_number}")

        # Add order items with all details
        for item in data['items']:
            try:
                # Create the order item with base details
                order_item = OrderItem(
                    order=order,
                    item_name=item['name'],
                    quantity=item['quantity'],
                    price=float(item['price'])
                )
                
                # Store additional details as JSON in the database
                order_item.extras = str(item.get('selectedExtras', []))
                order_item.size = str(item.get('selectedSize', {}))
                order_item.piece_option = str(item.get('selectedOption', None))
                
                db.session.add(order_item)
                app.logger.info(f"Added item to order {order_number}: {item['name']}")
            except Exception as item_error:
                app.logger.error(f"Error adding item {item.get('name', 'unknown')}: {str(item_error)}")
                db.session.rollback()
                return jsonify({
                    'error': f'Failed to add item {item.get("name", "unknown")} to order',
                    'success': False
                }), 500

        try:
            db.session.commit()
            app.logger.info(f"Successfully committed order {order_number} to database")
        except Exception as db_error:
            db.session.rollback()
            app.logger.error(f"Database error while saving order {order_number}: {str(db_error)}")
            return jsonify({
                'error': 'Failed to save order to database',
                'success': False
            }), 500

        # Send notifications
        notification_errors = []
        try:
            if order.phone:
                try:
                    sms_message = f"Your KIOSK order number is: {order_number}. Thank you for your order!"
                    send_sms(order.phone, sms_message)
                    app.logger.info(f"SMS sent for order {order_number}")
                except Exception as sms_error:
                    notification_errors.append(f"SMS error: {str(sms_error)}")
                    app.logger.error(f"Failed to send SMS for order {order_number}: {str(sms_error)}")

            if order.email:
                try:
                    email_subject = "Your KIOSK Order Confirmation"
                    email_content = f"""
                    <h2>Order Confirmation</h2>
                    <p>Thank you for your order!</p>
                    <p>Order Number: {order_number}</p>
                    <h3>Order Details:</h3>
                    <ul>
                    {"".join(f"<li>{item['name']} x {item['quantity']} - R{item['price']}</li>" for item in data['items'])}
                    </ul>
                    <p>Total Amount: R{order.total_amount}</p>
                    """
                    send_email(order.email, email_subject, email_content)
                    app.logger.info(f"Email sent for order {order_number}")
                except Exception as email_error:
                    notification_errors.append(f"Email error: {str(email_error)}")
                    app.logger.error(f"Failed to send email for order {order_number}: {str(email_error)}")
        except Exception as notification_error:
            app.logger.error(f"Notification error for order {order_number}: {str(notification_error)}")
            notification_errors.append(str(notification_error))

        response_data = {
            'success': True,
            'order_number': order_number
        }
        
        if notification_errors:
            response_data['notification_errors'] = notification_errors
            
        app.logger.info(f"Order {order_number} completed successfully")
        return jsonify(response_data)

    except Exception as e:
        app.logger.error(f"Order completion error: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 400

@app.route('/api/order-status/<order_number>', methods=['GET'])
def get_order_status(order_number):
    order = Order.query.filter_by(order_number=order_number).first()
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    return jsonify({
        'order_number': order.order_number,
        'status': order.status,
        'created_at': order.created_at.isoformat()
    })


@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400

        admin = Admin.query.filter_by(username=username).first()
        if not admin:
            return jsonify({'error': 'Invalid credentials'}), 401

        try:
            is_valid = bcrypt.checkpw(password.encode('utf-8'), admin.password.encode('utf-8'))
        except Exception as e:
            print(f"Password verification error: {e}")
            return jsonify({'error': 'Authentication error'}), 500

        if not is_valid:
            return jsonify({'error': 'Invalid credentials'}), 401

        # Generate JWT token
        token = jwt.encode(
            {
                'admin_id': admin.id,
                'exp': datetime.now(timezone.utc) + timedelta(days=1)  # Token expiration
            },
            os.getenv('JWT_SECRET_KEY'),
            algorithm='HS256'
        )

        return jsonify({
            'token': token,
            'message': 'Login successful'
        })

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500
#adding admin
@app.route('/api/admin/create', methods=['POST'])
def create_admin():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')

        if not username or not password or not email:
            return jsonify({'error': 'Missing required fields'}), 400

        # Check if admin already exists
        existing_admin = Admin.query.filter(
            (Admin.username == username) | (Admin.email == email)
        ).first()
        if existing_admin:
            return jsonify({'error': 'Username or email already exists'}), 400

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Create new admin
        new_admin = Admin(
            username=username,
            password=hashed_password,
            email=email
        )
        db.session.add(new_admin)
        db.session.commit()

        return jsonify({'message': 'Admin created successfully'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/menu-items', methods=['GET', 'POST'])
@admin_required
def manage_menu_items():
    if request.method == 'GET':
        items = MenuItem.query.all()
        return jsonify([{
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'price': item.price,
            'category': item.category,
            'image_url': item.image_url,
            'is_available': item.is_available,
            'extras': [{
                'id': extra.id,
                'name': extra.name,
                'price': extra.price
            } for extra in item.extras],
            'sizes': [{
                'id': size.id,
                'name': size.name,
                'price': size.price
            } for size in item.sizes],
            'piece_options': [{
                'id': p.id,
                'quantity': p.quantity,
                'price': p.price,
                'is_default': p.is_default
            } for p in item.piece_options]
        } for item in items])
    
    if request.method == 'POST':
        try:
            data = request.get_json()
            print("Received menu item data:", data)  # Debug log

            # Validate required fields
            required_fields = ['name', 'description', 'price', 'category']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'{field} is required'}), 400

            # Create new menu item
            new_item = MenuItem(
                name=data['name'],
                description=data['description'],
                price=float(data['price']),
                category=data['category'],
                image_url=data.get('image_url', ''),
                is_available=data.get('is_available', True)
            )
            print(f"Creating menu item with category: {new_item.category}")  # Debug log

            # Add extras if provided
            if 'extras' in data and data['extras']:
                for extra_data in data['extras']:
                    extra = Extra(
                        name=extra_data['name'],
                        price=float(extra_data['price'])
                    )
                    new_item.extras.append(extra)

            # Add sizes if provided
            if 'sizes' in data and data['sizes']:
                for size_data in data['sizes']:
                    size = Size(
                        name=size_data['name'],
                        price=float(size_data['price'])
                    )
                    new_item.sizes.append(size)

            # Add piece options if provided
            if 'piece_options' in data and data['piece_options']:
                for option_data in data['piece_options']:
                    option = PieceOption(
                        quantity=int(option_data['quantity']),
                        price=float(option_data['price']),
                        is_default=option_data.get('is_default', False)
                    )
                    new_item.piece_options.append(option)

            db.session.add(new_item)
            db.session.commit()
            print(f"Successfully created menu item with ID: {new_item.id}")  # Debug log

            return jsonify({
                'message': 'Menu item created successfully',
                'id': new_item.id
            }), 201

        except Exception as e:
            print(f"Error creating menu item: {str(e)}")  # Debug log
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@app.route('/api/admin/menu-items/<int:item_id>', methods=['PUT', 'DELETE'])
@admin_required
def manage_menu_item(item_id):
    item = MenuItem.query.get_or_404(item_id)
    
    if request.method == 'DELETE':
        db.session.delete(item)
        db.session.commit()
        return '', 204
    
    data = request.json
    item.name = data.get('name', item.name)
    item.description = data.get('description', item.description)
    item.price = data.get('price', item.price)
    item.category = data.get('category', item.category)
    item.image_url = data.get('image_url', item.image_url)
    item.is_available = data.get('is_available', item.is_available)
    
    db.session.commit()
    return jsonify({
        'id': item.id,
        'name': item.name,
        'description': item.description,
        'price': item.price,
        'category': item.category,
        'image_url': item.image_url,
        'is_available': item.is_available,
        'extras': [{
            'id': extra.id,
            'name': extra.name,
            'price': extra.price
        } for extra in item.extras],
        'sizes': [{
            'id': size.id,
            'name': size.name,
            'price': size.price
        } for size in item.sizes],
        'piece_options': [{
            'id': p.id,
            'quantity': p.quantity,
            'price': p.price,
            'is_default': p.is_default
        } for p in item.piece_options]
    })

@app.route('/api/menu-items', methods=['GET'])
# @cache.cached(timeout=300, query_string=True)  # Cache for 5 minutes, vary by query string
def get_menu_items():
    try:
        # Get category from query parameters
        category = request.args.get('category', None)
        
        # Base query with eager loading of relationships
        query = MenuItem.query.options(
            db.joinedload(MenuItem.extras),
            db.joinedload(MenuItem.sizes),
            db.joinedload(MenuItem.piece_options)
        ).filter_by(is_available=True)
        
        # Apply category filter if provided
        if category:
            query = query.filter(MenuItem.category == category)
        
        # Execute query
        menu_items = query.all()
        
        items_list = [{
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'price': float(item.price),
            'category': item.category,
            'image_url': item.image_url,
            'extras': [{'id': e.id, 'name': e.name, 'price': float(e.price)} for e in item.extras],
            'sizes': [{'id': s.id, 'name': s.name, 'price': float(s.price)} for s in item.sizes],
            'piece_options': [{'id': p.id, 'quantity': p.quantity, 'price': float(p.price), 'is_default': p.is_default} 
                            for p in item.piece_options]
        } for item in menu_items]
        
        return jsonify(items_list), 200
    except Exception as e:
        app.logger.error(f"Error in get_menu_items: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories', methods=['GET'])
def get_public_categories():
    try:
        categories = Category.query.all()
        return jsonify([{
            'id': cat.id,
            'name': cat.name,
            'description': cat.description,
            'image_url': cat.image_url,
            'icon': cat.icon,
            'is_default': cat.is_default
        } for cat in categories])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/categories', methods=['GET'])
@admin_required
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify([{
            'id': cat.id,
            'name': cat.name,
            'description': cat.description,
            'image_url': cat.image_url,
            'icon': cat.icon,
            'is_default': cat.is_default
        } for cat in categories])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/categories', methods=['POST'])
@admin_required
def create_category():
    try:
        data = request.get_json()
        
        if not data or 'name' not in data:
            return jsonify({'error': 'Name is required'}), 400
            
        # Check if category already exists
        existing_category = Category.query.filter_by(name=data['name']).first()
        if existing_category:
            return jsonify({'error': 'Category with this name already exists'}), 400

        new_category = Category(
            name=data['name'],
            description=data.get('description', ''),
            image_url=data.get('image_url', ''),
            icon=data.get('icon', ''),
            is_default=data.get('is_default', False)
        )
        
        db.session.add(new_category)
        db.session.commit()
        
        return jsonify({
            'id': new_category.id,
            'name': new_category.name,
            'description': new_category.description,
            'image_url': new_category.image_url,
            'icon': new_category.icon,
            'is_default': new_category.is_default
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/categories/<int:id>', methods=['PUT'])
@admin_required
def update_category(id):
    try:
        category = Category.query.get_or_404(id)
        data = request.get_json()
        
        if 'name' in data and data['name'] != category.name:
            existing_category = Category.query.filter_by(name=data['name']).first()
            if existing_category:
                return jsonify({'error': 'Category with this name already exists'}), 400
            category.name = data['name']
            
        if 'description' in data:
            category.description = data['description']
        if 'image_url' in data:
            category.image_url = data['image_url']
        if 'icon' in data:
            category.icon = data['icon']
        if 'is_default' in data:
            category.is_default = data['is_default']
            
        db.session.commit()
        
        return jsonify({
            'id': category.id,
            'name': category.name,
            'description': category.description,
            'image_url': category.image_url,
            'icon': category.icon,
            'is_default': category.is_default
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/categories/<int:id>', methods=['DELETE'])
@admin_required
def delete_category(id):
    try:
        category = Category.query.get_or_404(id)
        db.session.delete(category)
        db.session.commit()
        return jsonify({'message': 'Category deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/orders', methods=['GET'])
@admin_required
def get_all_orders():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify([{
        'id': order.id,
        'order_number': order.order_number,
        'email': order.email,
        'phone': order.phone,
        'total_amount': order.total_amount,
        'status': order.status,
        'created_at': order.created_at.isoformat(),
        'items': [{
            'item_name': item.item_name,
            'quantity': item.quantity,
            'price': item.price,
            'extras': item.extras,
            'size': item.size,
            'piece_option': item.piece_option
        } for item in order.items]
    } for order in orders])

@app.route('/api/admin/orders/<order_number>/status', methods=['PUT'])
@admin_required
def update_order_status(order_number):
    order = Order.query.filter_by(order_number=order_number).first_or_404()
    data = request.json
    order.status = data['status']
    db.session.commit()
    return jsonify({
        'order_number': order.order_number,
        'status': order.status
    })

# Business Intelligence Routes
@app.route('/api/admin/analytics', methods=['GET'])
@admin_required
def get_analytics():
    try:
        timeframe = request.args.get('timeframe', 'daily')
        if timeframe not in ['daily', 'weekly', 'monthly']:
            return jsonify({
                'error': 'Invalid timeframe',
                'message': 'Timeframe must be one of: daily, weekly, monthly'
            }), 400
        
        # Get current date
        today = datetime.now()
        
        if timeframe == 'daily':
            start_date = today - timedelta(days=7)
            group_format = '%Y-%m-%d'
        elif timeframe == 'weekly':
            start_date = today - timedelta(weeks=4)
            group_format = '%Y-%W'
        else:  # monthly
            start_date = today - timedelta(days=365)
            group_format = '%Y-%m'

        # Get orders within the timeframe
        orders = Order.query.filter(
            Order.created_at >= start_date,
            Order.status == 'completed'
        ).all()

        # Initialize response data
        response_data = {
            'totalRevenue': 0,
            'totalOrders': 0,
            'averageOrderValue': 0,
            'daily': [],
            'categoryWise': [],  # Initialize as array
            'topProducts': []    # Initialize as array
        }

        if orders:
            # Calculate total revenue and orders
            total_revenue = sum(order.total_amount for order in orders)
            total_orders = len(orders)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0

            # Daily revenue trend
            daily_sales = {}
            category_sales = {}  # Track category sales
            product_sales = {}   # Track product sales
            
            for order in orders:
                # Process daily sales
                date_key = order.created_at.strftime(group_format)
                daily_sales[date_key] = daily_sales.get(date_key, 0) + order.total_amount

                # Process items
                for item in order.items:
                    # Track product sales
                    product_sales[item.item_name] = product_sales.get(item.item_name, 0) + item.quantity
                    
                    # Categorize items
                    category = 'Uncategorized'  # Default category
                    if 'burger' in item.item_name.lower():
                        category = 'Burgers'
                    elif 'pizza' in item.item_name.lower():
                        category = 'Pizza'
                    elif 'drink' in item.item_name.lower() or 'soda' in item.item_name.lower():
                        category = 'Drinks'
                    elif 'side' in item.item_name.lower():
                        category = 'Sides'
                    elif 'breakfast' in item.item_name.lower():
                        category = 'Breakfast'
                      
                    
                    category_sales[category] = category_sales.get(category, 0) + item.quantity

            # Format the response data
            response_data.update({
                'totalRevenue': float(total_revenue),
                'totalOrders': total_orders,
                'averageOrderValue': float(avg_order_value),
                'daily': [
                    {'date': date, 'revenue': float(amount)}
                    for date, amount in daily_sales.items()
                ],
                'categoryWise': [
                    {'name': category, 'value': quantity}
                    for category, quantity in category_sales.items()
                ],
                'topProducts': sorted(
                    [{'name': product, 'quantity': quantity}
                     for product, quantity in product_sales.items()],
                    key=lambda x: x['quantity'],
                    reverse=True
                )[:5]  # Get top 5 products
            })

        return jsonify(response_data)

    except Exception as e:
        app.logger.error(f"Error in analytics: {str(e)}")
        return jsonify({
            'error': 'Server error',
            'message': str(e)
        }), 500
#not needed
def cleanup_whats_new_category():
    try:
        whats_new = Category.query.filter_by(name='Whats New').first()
        if whats_new:
            db.session.delete(whats_new)
            db.session.commit()
            print("Successfully removed What's New category")
    except Exception as e:
        db.session.rollback()
        print(f"Error removing What's New category: {e}")
#hard code default categories
def create_default_categories():
    default_categories = [
        {'name': 'Burgers', 'icon': '🍔', 'description': 'Delicious burgers', 'is_default': True},
        {'name': 'Drinks', 'icon': '🥤', 'description': 'Refreshing beverages', 'is_default': True},
        {'name': 'Sides', 'icon': '🍟', 'description': 'Tasty side dishes', 'is_default': True},
        {'name': 'Breakfast', 'icon': '🍳', 'description': 'Start your day right', 'is_default': True},
    ]
    
    for cat_data in default_categories:
        # Check if category already exists
        existing = Category.query.filter_by(name=cat_data['name']).first()
        if not existing:
            category = Category(
                name=cat_data['name'],
                icon=cat_data['icon'],
                description=cat_data['description'],
                is_default=cat_data['is_default']
            )
            db.session.add(category)
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error creating default categories: {e}")

#initial admin
def create_initial_admin():
    username = 'admin'
    password = 'Saar5048?'
    email = 'sandil.saar@gmail.com'

    try:
        # Check if the admin already exists
        existing_admin = Admin.query.filter_by(username=username).first()
        if existing_admin:
            print('Admin user already exists.')
            return

        # Hash the password using bcrypt
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Create new admin
        new_admin = Admin(
            username=username,
            password=hashed_password,
            email=email
        )
        db.session.add(new_admin)
        db.session.commit()
        print('Initial admin user created successfully.')

    except Exception as e:
        print(f"Error creating initial admin: {e}")
        db.session.rollback()

if __name__ == '__main__':
    with app.app_context():
        try:
            # Drop all tables and recreate them
            # db.drop_all()
            db.create_all()
            create_initial_admin()
            create_default_categories()
            print("Database initialized successfully")
        except Exception as e:
            print(f"Error initializing database: {e}")
            raise e
    app.run(debug=True)
