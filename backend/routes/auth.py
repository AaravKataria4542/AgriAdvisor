from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_mail import Message
from backend.database import db, mail
from backend.models.user import User
from datetime import datetime, timedelta, timezone
import random
import string

auth_bp = Blueprint('auth', __name__)

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(email, otp, name):
    try:
        msg = Message(
            subject='🌾 AgriAdvisor - Your OTP Verification Code',
            recipients=[email],
            html=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
                <div style="background: linear-gradient(135deg, #1a5c1a, #2d8b2d); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🌾 AgriAdvisor</h1>
                    <p style="color: #a8d8a8; margin: 8px 0 0 0;">Agricultural Intelligence Platform</p>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <h2 style="color: #1a5c1a;">Hello, {name}! 👋</h2>
                    <p style="color: #555; font-size: 16px;">Your OTP verification code is:</p>
                    <div style="background: #f0f8f0; border: 2px solid #2d8b2d; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 40px; font-weight: bold; color: #1a5c1a; letter-spacing: 8px;">{otp}</span>
                    </div>
                    <p style="color: #777; font-size: 14px;">⏰ This OTP is valid for <strong>10 minutes</strong>.</p>
                    <p style="color: #777; font-size: 14px;">Do not share this code with anyone.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #aaa; font-size: 12px; text-align: center;">© 2025 AgriAdvisor. All rights reserved.</p>
                </div>
            </div>
            """
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        phone = data.get('phone', '')
        location = data.get('location', '')

        if not name or not email or not password:
            return jsonify({'success': False, 'message': 'Name, email and password are required'}), 400

        if len(password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400

        existing = User.query.filter_by(email=email).first()
        if existing:
            if existing.is_verified:
                return jsonify({'success': False, 'message': 'Email already registered. Please login.'}), 409
            else:
                # Resend OTP
                otp = generate_otp()
                existing.otp = otp
                existing.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
                existing.set_password(password)
                db.session.commit()
                send_otp_email(email, otp, existing.name)
                return jsonify({'success': True, 'message': 'OTP resent to your email', 'email': email})

        otp = generate_otp()
        user = User(
            name=name,
            email=email,
            phone=phone,
            location=location,
            otp=otp,
            otp_expiry=datetime.now(timezone.utc) + timedelta(minutes=10)
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        email_sent = send_otp_email(email, otp, name)
        return jsonify({
            'success': True,
            'message': 'Registration successful! Check your email for OTP.',
            'email': email,
            'email_sent': email_sent
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        otp = data.get('otp', '').strip()

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        if user.is_verified:
            return jsonify({'success': False, 'message': 'Account already verified. Please login.'}), 400

        if user.otp != otp:
            return jsonify({'success': False, 'message': 'Invalid OTP'}), 400

        if user.otp_expiry and datetime.now(timezone.utc) > user.otp_expiry.replace(tzinfo=timezone.utc):
            return jsonify({'success': False, 'message': 'OTP expired. Please register again.'}), 400

        user.is_verified = True
        user.otp = None
        user.otp_expiry = None
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'success': True,
            'message': 'Email verified successfully!',
            'access_token': access_token,
            'user': user.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

        if not user.is_verified:
            # Resend OTP
            otp = generate_otp()
            user.otp = otp
            user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
            db.session.commit()
            send_otp_email(email, otp, user.name)
            return jsonify({
                'success': False,
                'message': 'Email not verified. OTP resent to your email.',
                'needs_verification': True,
                'email': email
            }), 403

        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'success': True,
            'message': 'Login successful!',
            'access_token': access_token,
            'user': user.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        return jsonify({'success': True, 'user': user.to_dict()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        otp = generate_otp()
        user.otp = otp
        user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
        db.session.commit()
        send_otp_email(email, otp, user.name)
        return jsonify({'success': True, 'message': 'OTP resent successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
