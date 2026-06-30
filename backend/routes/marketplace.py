from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.database import db
from backend.models.marketplace import Product, CartItem, Order, OrderItem, Transaction

marketplace_bp = Blueprint('marketplace', __name__)

# ─── PRODUCTS ────────────────────────────────────────────────────────────────

@marketplace_bp.route('/products', methods=['GET'])
def get_products():
    try:
        category = request.args.get('category')
        search = request.args.get('search', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 12))

        query = Product.query.filter_by(is_active=True)
        if category and category != 'all':
            query = query.filter_by(category=category)
        if search:
            query = query.filter(Product.title.ilike(f'%{search}%'))

        total = query.count()
        products = query.order_by(Product.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'success': True,
            'products': [p.to_dict() for p in products.items],
            'total': total,
            'pages': products.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@marketplace_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify({'success': True, 'product': product.to_dict()})


@marketplace_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()

        product = Product(
            seller_id=user_id,
            title=data['title'],
            description=data.get('description', ''),
            category=data['category'],
            price=float(data['price']),
            quantity=float(data['quantity']),
            unit=data.get('unit', 'kg'),
            location=data.get('location', ''),
            image_url=data.get('image_url', '')
        )
        db.session.add(product)
        db.session.commit()

        return jsonify({'success': True, 'product': product.to_dict(), 'message': 'Product listed successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@marketplace_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    try:
        user_id = int(get_jwt_identity())
        product = Product.query.get_or_404(product_id)
        if product.seller_id != user_id:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403

        data = request.get_json()
        for field in ['title', 'description', 'category', 'price', 'quantity', 'unit', 'location', 'image_url', 'is_active']:
            if field in data:
                setattr(product, field, data[field])

        db.session.commit()
        return jsonify({'success': True, 'product': product.to_dict(), 'message': 'Product updated!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@marketplace_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    try:
        user_id = int(get_jwt_identity())
        product = Product.query.get_or_404(product_id)
        if product.seller_id != user_id:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        product.is_active = False
        db.session.commit()
        return jsonify({'success': True, 'message': 'Product removed from listing'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@marketplace_bp.route('/my-products', methods=['GET'])
@jwt_required()
def get_my_products():
    user_id = int(get_jwt_identity())
    products = Product.query.filter_by(seller_id=user_id).order_by(Product.created_at.desc()).all()
    return jsonify({'success': True, 'products': [p.to_dict() for p in products]})


# ─── CART ─────────────────────────────────────────────────────────────────────

@marketplace_bp.route('/cart', methods=['GET'])
@jwt_required()
def get_cart():
    user_id = int(get_jwt_identity())
    items = CartItem.query.filter_by(user_id=user_id).all()
    total = sum(
        item.quantity * item.product.price
        for item in items if item.product and item.product.is_active
    )
    return jsonify({
        'success': True,
        'cart': [i.to_dict() for i in items],
        'total': round(total, 2),
        'count': len(items)
    })


@marketplace_bp.route('/cart', methods=['POST'])
@jwt_required()
def add_to_cart():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        product_id = int(data['product_id'])
        quantity = float(data.get('quantity', 1))

        product = Product.query.get(product_id)
        if not product or not product.is_active:
            return jsonify({'success': False, 'message': 'Product not found'}), 404

        existing = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
        if existing:
            existing.quantity += quantity
        else:
            item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
            db.session.add(item)

        db.session.commit()
        return jsonify({'success': True, 'message': 'Added to cart!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@marketplace_bp.route('/cart/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(item_id):
    try:
        user_id = int(get_jwt_identity())
        item = CartItem.query.filter_by(id=item_id, user_id=user_id).first()
        if not item:
            return jsonify({'success': False, 'message': 'Cart item not found'}), 404
        data = request.get_json()
        item.quantity = float(data['quantity'])
        db.session.commit()
        return jsonify({'success': True, 'message': 'Cart updated'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@marketplace_bp.route('/cart/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    try:
        user_id = int(get_jwt_identity())
        item = CartItem.query.filter_by(id=item_id, user_id=user_id).first()
        if not item:
            return jsonify({'success': False, 'message': 'Item not found'}), 404
        db.session.delete(item)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Removed from cart'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@marketplace_bp.route('/cart/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    user_id = int(get_jwt_identity())
    CartItem.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({'success': True, 'message': 'Cart cleared'})


# ─── ORDERS ───────────────────────────────────────────────────────────────────

@marketplace_bp.route('/orders', methods=['POST'])
@jwt_required()
def create_order():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        delivery_address = data.get('delivery_address', '')

        cart_items = CartItem.query.filter_by(user_id=user_id).all()
        if not cart_items:
            return jsonify({'success': False, 'message': 'Cart is empty'}), 400

        total = sum(
            item.quantity * item.product.price
            for item in cart_items if item.product
        )

        order = Order(
            buyer_id=user_id,
            total_amount=round(total, 2),
            delivery_address=delivery_address
        )
        db.session.add(order)
        db.session.flush()

        for item in cart_items:
            if item.product:
                oi = OrderItem(
                    order_id=order.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    price_at_purchase=item.product.price
                )
                db.session.add(oi)

        CartItem.query.filter_by(user_id=user_id).delete()
        db.session.commit()

        return jsonify({
            'success': True,
            'order': order.to_dict(),
            'message': 'Order placed! Proceed to payment.'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@marketplace_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    user_id = int(get_jwt_identity())
    orders = Order.query.filter_by(buyer_id=user_id).order_by(Order.created_at.desc()).all()
    return jsonify({'success': True, 'orders': [o.to_dict() for o in orders]})


@marketplace_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    user_id = int(get_jwt_identity())
    order = Order.query.filter_by(id=order_id, buyer_id=user_id).first()
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404
    return jsonify({'success': True, 'order': order.to_dict()})
