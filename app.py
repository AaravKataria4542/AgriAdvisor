from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)

    # ── Config ──────────────────────────────────────────────
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'agri-secret-2025')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///agri.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-2025')

    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB upload limit
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400  # 24h in seconds

    # ── Extensions ──────────────────────────────────────────
    from backend.database import db, mail
    db.init_app(app)
    mail.init_app(app)
    JWTManager(app)

    CORS(app, resources={r"/api/*": {"origins": [
        os.getenv('FRONTEND_URL', 'http://localhost:5173'),
        "http://localhost:3000",
        "http://127.0.0.1:5173"
    ]}}, supports_credentials=True)

    # ── Import models (needed for db.create_all) ────────────
    from backend.models.user import User
    from backend.models.marketplace import Product, CartItem, Order, OrderItem, Transaction

    # ── Register Blueprints ─────────────────────────────────
    from backend.routes.auth import auth_bp
    from backend.routes.disease import disease_bp
    from backend.routes.soil import soil_bp
    from backend.routes.weather import weather_bp
    from backend.routes.crop import crop_bp
    from backend.routes.marketplace import marketplace_bp
    from backend.routes.payment import payment_bp
    from backend.routes.yield_pred import yield_bp
    from backend.routes.fertilizer import fertilizer_bp

    app.register_blueprint(auth_bp,        url_prefix='/api/auth')
    app.register_blueprint(disease_bp,     url_prefix='/api/disease')
    app.register_blueprint(soil_bp,        url_prefix='/api/soil')
    app.register_blueprint(weather_bp,     url_prefix='/api/weather')
    app.register_blueprint(crop_bp,        url_prefix='/api/crop')
    app.register_blueprint(marketplace_bp, url_prefix='/api/marketplace')
    app.register_blueprint(payment_bp,     url_prefix='/api/payment')
    app.register_blueprint(yield_bp,       url_prefix='/api/yield')
    app.register_blueprint(fertilizer_bp,  url_prefix='/api/fertilizer')

    # ── Health check ────────────────────────────────────────
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'message': 'AgriAdvisor API running 🌾'})

    # ── Create DB tables ────────────────────────────────────
    with app.app_context():
        db.create_all()
        _seed_sample_products(db)

    return app


def _seed_sample_products(db):
    """Seed a few sample marketplace products for demo"""
    from backend.models.marketplace import Product
    from backend.models.user import User
    import bcrypt

    if User.query.count() == 0:
        # Create demo seller
        demo = User(
            name='Demo Seller',
            email='demo@agri.com',
            phone='+91 9999999999',
            location='Punjab, India',
            is_verified=True
        )
        demo.set_password('Demo@12345')
        db.session.add(demo)
        db.session.flush()

        sample_products = [
            Product(seller_id=demo.id, title='Organic Wheat Seeds (HD-2967)', description='High yield wheat variety, suitable for North India. Disease resistant.', category='seeds', price=850.0, quantity=50, unit='kg', location='Punjab'),
            Product(seller_id=demo.id, title='Fresh Tomatoes (Grade A)', description='Organically grown cherry tomatoes. Ready for market.', category='crops', price=35.0, quantity=500, unit='kg', location='Maharashtra'),
            Product(seller_id=demo.id, title='Urea Fertilizer (46% N)', description='High quality urea for Kharif crops. BIS certified.', category='fertilizer', price=290.0, quantity=200, unit='bag (50kg)', location='Gujarat'),
            Product(seller_id=demo.id, title='Mini Tractor (30HP)', description='Second-hand Mahindra 30HP tractor in excellent condition with all attachments.', category='equipment', price=285000.0, quantity=1, unit='unit', location='Haryana'),
            Product(seller_id=demo.id, title='Basmati Rice (Premium)', description='Long grain aromatic Basmati rice, export quality.', category='crops', price=75.0, quantity=1000, unit='kg', location='Uttar Pradesh'),
            Product(seller_id=demo.id, title='NPK Fertilizer 20-20-20', description='Balanced nutrition for all crops. Water soluble formula.', category='fertilizer', price=1250.0, quantity=100, unit='bag (25kg)', location='Karnataka'),
        ]
        db.session.add_all(sample_products)
        db.session.commit()
        print("✅ Sample data seeded")


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5001)
