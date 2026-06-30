import os
import uuid
import numpy as np
import cv2
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename

disease_bp = Blueprint('disease', __name__)

UPLOAD_FOLDER = 'static/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Label classes matching the trained leaf_disease_model.h5 (33 classes)
DISEASE_CLASSES = [
    'Apple scab', 'Apple Black rot', 'Apple Cedar apple rust', 'Apple healthy',
    'Cherry Powdery mildew', 'Cherry healthy',
    'Corn Cercospora leaf spot Gray leaf spot', 'Corn Common rust', 'Corn Northern Leaf Blight', 'Corn healthy',
    'Grape Black rot', 'Grape Esca', 'Grape Leaf blight', 'Grape healthy',
    'Peach Bacterial spot', 'Peach healthy',
    'Pepper bell Bacterial spot', 'Pepper bell healthy',
    'Potato Early blight', 'Potato Late blight', 'Potato healthy',
    'Strawberry Leaf scorch', 'Strawberry healthy',
    'Tomato Bacterial spot', 'Tomato Early blight', 'Tomato Late blight',
    'Tomato Leaf Mold', 'Tomato Septoria leaf spot', 'Tomato Spider mites',
    'Tomato Target Spot', 'Tomato Yellow Leaf Curl Virus', 'Tomato mosaic virus', 'Tomato healthy'
]

DISEASE_INFO = {
    'Apple scab': {
        'description': 'Fungal disease causing dark, scabby lesions on leaves and fruit.',
        'treatment': 'Remove infected leaves. Apply fungicides containing captan or myclobutanil. Rake and destroy fallen leaves to reduce spores.',
        'severity': 'Medium'
    },
    'Apple Black rot': {
        'description': 'Fungal disease causing black rotting of fruit and cankers on branches.',
        'treatment': 'Prune out dead or diseased wood. Remove mummified fruit. Apply appropriate fungicides during the growing season.',
        'severity': 'High'
    },
    'Apple Cedar apple rust': {
        'description': 'Fungal disease causing orange-yellow spots on leaves and fruit.',
        'treatment': 'Remove nearby cedar hosts if possible. Apply fungicides early in the season when apple blossoms are in the pink stage.',
        'severity': 'Medium'
    },
    'Cherry Powdery mildew': {
        'description': 'Fungal disease causing white powdery coating on leaves and shoots.',
        'treatment': 'Apply sulfur or potassium bicarbonate based fungicides. Ensure good air circulation by pruning.',
        'severity': 'Medium'
    },
    'Corn Cercospora leaf spot Gray leaf spot': {
        'description': 'Fungal disease causing tan to gray rectangular lesions on leaves.',
        'treatment': 'Plant resistant hybrids, use crop rotation to non-host crops, and apply fungicides if disease pressure is high.',
        'severity': 'Medium'
    },
    'Corn Common rust': {
        'description': 'Fungal disease with orange-brown pustules on both leaf surfaces.',
        'treatment': 'Use resistant hybrids. Foliar fungicides (propiconazole or trifloxystrobin) can be applied if symptoms appear early.',
        'severity': 'Medium'
    },
    'Corn Northern Leaf Blight': {
        'description': 'Fungal disease causing large, cigar-shaped gray-green lesions on leaves.',
        'treatment': 'Use resistant hybrids and crop rotation. Tillage helps bury infected residue. Apply fungicides if warranted.',
        'severity': 'High'
    },
    'Grape Black rot': {
        'description': 'Fungal disease causing brown leaf lesions and black mummified berries.',
        'treatment': 'Remove mummified berries and infected canes. Apply fungicides starting from early shoot growth until veraison.',
        'severity': 'High'
    },
    'Grape Esca': {
        'description': 'Complex fungal disease causing wood decay and leaf scorch symptoms.',
        'treatment': 'Remove and destroy infected wood. Preventive pruning wound protection is essential.',
        'severity': 'High'
    },
    'Grape Leaf blight': {
        'description': 'Fungal disease causing irregular brown lesions with yellow halos on leaves.',
        'treatment': 'Improve air circulation and spray with appropriate fungicides. Avoid overhead irrigation.',
        'severity': 'Medium'
    },
    'Peach Bacterial spot': {
        'description': 'Bacterial disease causing water-soaked lesions on leaves, fruit, and twigs.',
        'treatment': 'Use resistant varieties. Copper-based sprays can help manage the disease during the dormant and early seasons.',
        'severity': 'Medium'
    },
    'Pepper bell Bacterial spot': {
        'description': 'Bacterial disease causing small water-soaked spots on leaves and fruit.',
        'treatment': 'Plant disease-free seed and transplants. Use copper sprays combined with mancozeb to slow the spread.',
        'severity': 'Medium'
    },
    'Potato Early blight': {
        'description': 'Fungal disease with dark brown spots with concentric rings on lower leaves.',
        'treatment': 'Ensure proper nutrition. Apply protective fungicides like chlorothalonil or mancozeb every 7-10 days.',
        'severity': 'Medium'
    },
    'Potato Late blight': {
        'description': 'Oomycete disease causing water-soaked lesions that rapidly turn brown and kill the plant.',
        'treatment': 'Use resistant varieties. Apply metalaxyl fungicides immediately. Destroy cull piles.',
        'severity': 'High'
    },
    'Strawberry Leaf scorch': {
        'description': 'Fungal disease causing small purple-red spots that enlarge and turn brown.',
        'treatment': 'Remove old infected leaves. Practice crop rotation and avoid overhead watering.',
        'severity': 'Medium'
    },
    'Tomato Bacterial spot': {
        'description': 'Bacterial disease causing small water-soaked spots on leaves and fruit.',
        'treatment': 'Use disease-free seed, practice crop rotation, and avoid working in wet fields. Copper sprays can suppress it.',
        'severity': 'Medium'
    },
    'Tomato Early blight': {
        'description': 'Dark concentric ring spots on lower leaves, progressing upward.',
        'treatment': 'Apply mancozeb or chlorothalonil fungicides every 7-10 days. Remove infected lower leaves.',
        'severity': 'Medium'
    },
    'Tomato Late blight': {
        'description': 'Water-soaked lesions that expand rapidly in humid conditions, killing plants fast.',
        'treatment': 'Destroy infected plants immediately. Apply copper-based fungicides preventively.',
        'severity': 'High'
    },
    'Tomato Leaf Mold': {
        'description': 'Fungal disease causing pale green-yellow spots on upper leaf surface, olive-green mold below.',
        'treatment': 'Increase air circulation and reduce humidity. Apply chlorothalonil or copper fungicides.',
        'severity': 'Medium'
    },
    'Tomato Septoria leaf spot': {
        'description': 'Fungal disease causing small circular spots with dark borders and gray centers.',
        'treatment': 'Remove infected leaves, avoid overhead watering, and apply mancozeb or chlorothalonil fungicides.',
        'severity': 'Medium'
    },
    'Tomato Spider mites': {
        'description': 'Pest infestation causing stippled, yellowing leaves with fine webbing underneath.',
        'treatment': 'Use insecticidal soaps, neem oil, or predatory mites to control populations.',
        'severity': 'Medium'
    },
    'Tomato Target Spot': {
        'description': 'Fungal disease causing brown spots with concentric rings resembling a target.',
        'treatment': 'Ensure good air flow, avoid overhead watering, and apply chlorothalonil or mancozeb fungicides.',
        'severity': 'Medium'
    },
    'Tomato Yellow Leaf Curl Virus': {
        'description': 'Viral disease transmitted by whiteflies causing leaf curling and yellowing.',
        'treatment': 'Control whitefly populations using insecticides or reflective mulches. Remove and destroy infected plants.',
        'severity': 'High'
    },
    'Tomato mosaic virus': {
        'description': 'Viral disease causing mosaic patterns of light and dark green on leaves.',
        'treatment': 'Use resistant varieties, disinfect tools, and wash hands after handling infected plants. No chemical control available.',
        'severity': 'High'
    },
}

DEFAULT_INFO = {
    'description': 'Disease identified by AI analysis. Consult a local agricultural extension office for confirmation.',
    'treatment': 'Consult with a local agricultural expert for specific treatment recommendations.',
    'severity': 'Unknown'
}

_model = None


def _load_model():
    global _model
    if _model is None:
        try:
            import keras
            model_path = 'models/leaf_disease_model.h5'
            if os.path.exists(model_path):
                _model = keras.models.load_model(model_path)
                print("✅ Leaf disease model loaded successfully")
            else:
                print(f"❌ Model file not found at {model_path}")
        except Exception as e:
            print(f"Model load error: {e}")
            _model = None
    return _model


def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def _preprocess_image(filepath):
    """Load and preprocess image using OpenCV to match training pipeline (150x150 RGB)."""
    img = cv2.imread(filepath)
    if img is None:
        raise ValueError("Could not read the image file")
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(img_rgb, (150, 150))
    return np.expand_dims(img_resized, axis=0)


@disease_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict_disease():
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'message': 'No image file uploaded'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400

        if not _allowed_file(file.filename):
            return jsonify({'success': False, 'message': 'Invalid file type. Upload JPG, JPEG, or PNG.'}), 400

        # Save file with unique name to avoid collisions
        original_filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{original_filename}"
        filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(filepath)

        try:
            img_array = _preprocess_image(filepath)
        except ValueError as e:
            return jsonify({'success': False, 'message': str(e)}), 400

        m = _load_model()
        if m is None:
            return jsonify({'success': False, 'message': 'Disease model is not available. Please contact support.'}), 503

        predictions = m.predict(img_array, verbose=0)
        top_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][top_idx]) * 100

        # Top 3 predictions
        top3_idx = np.argsort(predictions[0])[::-1][:3]
        top3 = [
            {
                'disease': DISEASE_CLASSES[i],
                'confidence': round(float(predictions[0][i]) * 100, 2)
            }
            for i in top3_idx
        ]

        predicted_class = DISEASE_CLASSES[top_idx]
        is_healthy = 'healthy' in predicted_class.lower()
        info = DISEASE_INFO.get(predicted_class, DEFAULT_INFO)

        return jsonify({
            'success': True,
            'prediction': {
                'disease': predicted_class,
                'confidence': round(confidence, 2),
                'is_healthy': is_healthy,
                'severity': 'None' if is_healthy else info['severity'],
                'description': 'Plant looks healthy! Continue regular care and monitoring.' if is_healthy else info['description'],
                'treatment': 'Continue regular care and good agricultural practices.' if is_healthy else info['treatment'],
                'top_predictions': top3
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
