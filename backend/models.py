from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()
 


class GeneralSetting(db.Model):
    __tablename__ = 'general_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    restaurant_name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    currency = db.Column(db.String(10), nullable=False)
    time_zone = db.Column(db.String(50), nullable=False)
    logo_url = db.Column(db.String(255), nullable=False)