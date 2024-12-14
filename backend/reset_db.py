from app import app, db

with app.app_context():
    # Drop all tables
    db.drop_all()
    print("All tables dropped successfully.")
    
    # Recreate all tables
    db.create_all()
    print("All tables created successfully.")
