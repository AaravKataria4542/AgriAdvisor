import os
import hmac
import hashlib
import razorpay
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.database import db
from backend.models.marketplace import Order, Transaction

payment_bp = Blueprint('payment', __name__)

RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', 'rzp_test_tPhc333asPKtv6')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', 'UVSxUflxDlLM9dgEHGBxVok2')

def get_razorpay_client():
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


@payment_bp.route('/create-order', methods=['POST'])
@jwt_required()
def create_payment_order():
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        user_id = int(get_jwt_identity())

        order = Order.query.filter_by(id=order_id, buyer_id=user_id).first()
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404

        if order.status == 'paid':
            return jsonify({'success': False, 'message': 'Order already paid'}), 400

        client = get_razorpay_client()
        amount_paise = int(order.total_amount * 100)  # Razorpay uses paise

        rz_order = client.order.create({
            'amount': amount_paise,
            'currency': 'INR',
            'receipt': f'order_{order_id}',
            'payment_capture': 1
        })

        # Save transaction record (initiated)
        existing_txn = Transaction.query.filter_by(order_id=order_id).first()
        if existing_txn:
            existing_txn.razorpay_order_id = rz_order['id']
            existing_txn.status = 'initiated'
        else:
            txn = Transaction(
                order_id=order_id,
                razorpay_order_id=rz_order['id'],
                amount=order.total_amount,
                status='initiated'
            )
            db.session.add(txn)

        db.session.commit()

        return jsonify({
            'success': True,
            'razorpay_order_id': rz_order['id'],
            'amount': amount_paise,
            'currency': 'INR',
            'key_id': RAZORPAY_KEY_ID,
            'order_id': order_id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@payment_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_payment():
    try:
        data = request.get_json()
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')
        order_id = data.get('order_id')
        user_id = int(get_jwt_identity())

        # Verify signature
        msg = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode('utf-8'),
            msg.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        sig_valid = hmac.compare_digest(expected_signature, razorpay_signature)

        txn = Transaction.query.filter_by(razorpay_order_id=razorpay_order_id).first()
        order = Order.query.filter_by(id=order_id, buyer_id=user_id).first()

        if sig_valid:
            if txn:
                txn.razorpay_payment_id = razorpay_payment_id
                txn.razorpay_signature = razorpay_signature
                txn.status = 'success'
            if order:
                order.status = 'paid'
            db.session.commit()

            return jsonify({
                'success': True,
                'message': 'Payment verified successfully! 🎉',
                'payment_id': razorpay_payment_id,
                'order_id': order_id
            })
        else:
            if txn:
                txn.status = 'failed'
                db.session.commit()
            return jsonify({'success': False, 'message': 'Payment verification failed. Invalid signature.'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@payment_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    try:
        user_id = int(get_jwt_identity())
        orders = Order.query.filter_by(buyer_id=user_id).all()
        transactions = []
        for order in orders:
            if order.transaction:
                t = order.transaction.to_dict()
                t['order_total'] = order.total_amount
                t['order_status'] = order.status
                transactions.append(t)
        return jsonify({'success': True, 'transactions': transactions})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@payment_bp.route('/config', methods=['GET'])
def get_payment_config():
    return jsonify({'key_id': RAZORPAY_KEY_ID})
