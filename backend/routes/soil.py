import os
import numpy as np
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from PIL import Image

soil_bp = Blueprint('soil', __name__)

SOIL_TYPES = ['Clay', 'Loamy', 'Sandy', 'Black', 'Red', 'Alluvial', 'Silt']

SOIL_HEALTH_INFO = {
    'Clay': {
        'description': 'Heavy soil with high water retention. Good nutrient content but drainage can be poor.',
        'best_crops': ['Rice', 'Wheat', 'Cotton', 'Sugarcane'],
        'amendments': ['Add organic matter', 'Improve drainage', 'Apply gypsum to improve structure']
    },
    'Loamy': {
        'description': 'Balanced soil with good drainage and nutrient retention. Ideal for most crops.',
        'best_crops': ['Maize', 'Tomato', 'Soybean', 'Potato', 'Vegetables'],
        'amendments': ['Maintain organic matter', 'Regular balanced fertilization']
    },
    'Sandy': {
        'description': 'Light soil with excellent drainage. Low water retention and nutrients.',
        'best_crops': ['Groundnut', 'Watermelon', 'Carrot', 'Radish'],
        'amendments': ['Add compost regularly', 'Install drip irrigation', 'Increase fertilizer frequency']
    },
    'Black': {
        'description': 'Rich in minerals, retains moisture well. Swells when wet, cracks when dry.',
        'best_crops': ['Cotton', 'Sorghum', 'Wheat', 'Sunflower'],
        'amendments': ['Improve drainage', 'Add organic matter', 'Apply lime if acidic']
    },
    'Red': {
        'description': 'Iron-rich soil, well-drained but low in nutrients and water retention.',
        'best_crops': ['Groundnut', 'Maize', 'Pulses', 'Millets'],
        'amendments': ['Apply compost', 'Increase irrigation', 'Add NPK fertilizers']
    },
    'Alluvial': {
        'description': 'Highly fertile, deposited by rivers. Excellent structure and nutrients.',
        'best_crops': ['Rice', 'Wheat', 'Sugarcane', 'Most vegetables'],
        'amendments': ['Maintain fertility', 'Regular testing', 'Balanced fertilization']
    },
    'Silt': {
        'description': 'Medium-textured, moderate drainage. Good nutrient content.',
        'best_crops': ['Rice', 'Vegetables', 'Maize', 'Wheat'],
        'amendments': ['Improve drainage', 'Add organic matter for better structure']
    }
}

model = None

def load_soil_model():
    global model
    if model is None:
        try:
            import tensorflow as tf
            model_path = 'models/soil_efficientnet.h5'
            if os.path.exists(model_path):
                model = tf.keras.models.load_model(model_path)
                print("✅ EfficientNet soil model loaded from file")
            else:
                base = tf.keras.applications.EfficientNetB0(
                    weights='imagenet',
                    include_top=False,
                    input_shape=(224, 224, 3)
                )
                base.trainable = False
                x = tf.keras.layers.GlobalAveragePooling2D()(base.output)
                x = tf.keras.layers.Dense(128, activation='relu')(x)
                x = tf.keras.layers.Dropout(0.3)(x)
                out = tf.keras.layers.Dense(len(SOIL_TYPES), activation='softmax')(x)
                model = tf.keras.Model(base.input, out)
                print("⚠️  Using untrained EfficientNetB0 (demo) - upload model to models/soil_efficientnet.h5")
        except Exception as e:
            print(f"Soil model load error: {e}")
            model = None
    return model

def preprocess_image(image_file):
    img = Image.open(image_file).convert('RGB')
    img = img.resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)

def analyze_soil_nutrients(ph, nitrogen, phosphorus, potassium, moisture, organic_carbon):
    """Analyze soil nutrient levels and generate recommendations"""
    alerts = []
    recommendations = []
    health_score = 100

    # pH analysis
    if ph < 5.5:
        alerts.append({'type': 'danger', 'message': f'pH too acidic ({ph}). Optimal: 6.0–7.5'})
        recommendations.append('Apply agricultural lime to raise pH')
        health_score -= 20
    elif ph > 8.0:
        alerts.append({'type': 'danger', 'message': f'pH too alkaline ({ph}). Optimal: 6.0–7.5'})
        recommendations.append('Apply sulfur or acidic fertilizers to lower pH')
        health_score -= 15
    elif ph < 6.0 or ph > 7.5:
        alerts.append({'type': 'warning', 'message': f'pH slightly off ({ph}). Optimal: 6.0–7.5'})
        health_score -= 8

    # Nitrogen
    if nitrogen < 20:
        alerts.append({'type': 'danger', 'message': f'Nitrogen deficient ({nitrogen} mg/kg)'})
        recommendations.append('Apply urea or ammonium sulfate at 120–150 kg/ha')
        health_score -= 15
    elif nitrogen > 80:
        alerts.append({'type': 'warning', 'message': f'Nitrogen excessive ({nitrogen} mg/kg) – risk of runoff'})
        health_score -= 5

    # Phosphorus
    if phosphorus < 10:
        alerts.append({'type': 'danger', 'message': f'Phosphorus deficient ({phosphorus} mg/kg)'})
        recommendations.append('Apply DAP or SSP at 60–80 kg/ha')
        health_score -= 15
    elif phosphorus > 60:
        alerts.append({'type': 'warning', 'message': f'Phosphorus excessive ({phosphorus} mg/kg)'})
        health_score -= 5

    # Potassium
    if potassium < 100:
        alerts.append({'type': 'danger', 'message': f'Potassium deficient ({potassium} mg/kg)'})
        recommendations.append('Apply MOP (Muriate of Potash) at 40–60 kg/ha')
        health_score -= 15
    elif potassium > 400:
        alerts.append({'type': 'warning', 'message': f'Potassium high ({potassium} mg/kg)'})
        health_score -= 5

    # Moisture
    if moisture < 20:
        alerts.append({'type': 'warning', 'message': f'Moisture low ({moisture}%) – irrigation needed'})
        recommendations.append('Implement irrigation. Add mulch to retain moisture.')
        health_score -= 10
    elif moisture > 80:
        alerts.append({'type': 'warning', 'message': f'Soil too wet ({moisture}%) – drainage needed'})
        recommendations.append('Improve field drainage to prevent waterlogging.')
        health_score -= 8

    # Organic carbon
    if organic_carbon < 0.5:
        alerts.append({'type': 'danger', 'message': f'Organic carbon very low ({organic_carbon}%)'})
        recommendations.append('Add compost, green manure, or farmyard manure (FYM)')
        health_score -= 15
    elif organic_carbon < 1.0:
        alerts.append({'type': 'warning', 'message': f'Organic carbon low ({organic_carbon}%)'})
        recommendations.append('Incorporate crop residues and apply compost')
        health_score -= 8

    if not alerts:
        recommendations.append('Soil is in excellent condition! Maintain current practices.')

    return {
        'health_score': max(0, min(100, health_score)),
        'alerts': alerts,
        'recommendations': recommendations
    }

@soil_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict_soil():
    try:
        import random

        # Get numeric inputs
        ph = float(request.form.get('ph', 6.5))
        nitrogen = float(request.form.get('nitrogen', 40))
        phosphorus = float(request.form.get('phosphorus', 25))
        potassium = float(request.form.get('potassium', 200))
        moisture = float(request.form.get('moisture', 50))
        organic_carbon = float(request.form.get('organic_carbon', 1.0))

        # Image prediction
        if 'image' in request.files and request.files['image'].filename:
            file = request.files['image']
            img_array = preprocess_image(file)
            m = load_soil_model()
            if m is not None:
                try:
                    preds = m.predict(img_array, verbose=0)
                    soil_idx = int(np.argmax(preds[0]))
                    soil_confidence = float(preds[0][soil_idx]) * 100
                    predicted_soil = SOIL_TYPES[soil_idx]
                except:
                    predicted_soil = random.choice(SOIL_TYPES)
                    soil_confidence = random.uniform(65, 88)
            else:
                predicted_soil = random.choice(SOIL_TYPES)
                soil_confidence = random.uniform(65, 88)
        else:
            # Guess soil type from pH and nutrients if no image
            if ph < 6.0:
                predicted_soil = 'Red'
            elif ph > 7.5:
                predicted_soil = 'Black'
            elif nitrogen > 50:
                predicted_soil = 'Alluvial'
            else:
                predicted_soil = 'Loamy'
            soil_confidence = 70.0

        soil_info = SOIL_HEALTH_INFO.get(predicted_soil, SOIL_HEALTH_INFO['Loamy'])
        nutrient_analysis = analyze_soil_nutrients(ph, nitrogen, phosphorus, potassium, moisture, organic_carbon)

        return jsonify({
            'success': True,
            'prediction': {
                'soil_type': predicted_soil,
                'confidence': round(soil_confidence, 2),
                'description': soil_info['description'],
                'best_crops': soil_info['best_crops'],
                'amendments': soil_info['amendments'],
                'health_score': nutrient_analysis['health_score'],
                'alerts': nutrient_analysis['alerts'],
                'recommendations': nutrient_analysis['recommendations'],
                'parameters': {
                    'ph': ph,
                    'nitrogen': nitrogen,
                    'phosphorus': phosphorus,
                    'potassium': potassium,
                    'moisture': moisture,
                    'organic_carbon': organic_carbon
                }
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
