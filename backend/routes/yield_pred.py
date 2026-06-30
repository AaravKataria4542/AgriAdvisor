from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import joblib
import numpy as np
import os

yield_bp = Blueprint('yield_pred', __name__)

yield_model = None
yield_scaler = None

def load_yield_models():
    global yield_model, yield_scaler
    try:
        if os.path.exists('models/yield_prediction_model.pkl'):
            yield_model = joblib.load('models/yield_prediction_model.pkl')
        if os.path.exists('models/yield_scaler.pkl'):
            yield_scaler = joblib.load('models/yield_scaler.pkl')
        print("✅ Yield model loaded")
    except Exception as e:
        print(f"Yield model load error: {e}")

load_yield_models()

@yield_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict_yield():
    try:
        data = request.get_json()
        rainfall = float(data.get('rainfall', 800))
        pesticide = float(data.get('pesticide', 100))
        temperature = float(data.get('temperature', 25))
        crop = data.get('crop', 'Maize')

        if yield_model and yield_scaler:
            try:
                features = np.array([[rainfall, pesticide, temperature]])
                features_scaled = yield_scaler.transform(features)
                prediction = float(yield_model.predict(features_scaled)[0])
            except Exception as e:
                print(f"Yield inference error: {e}")
                prediction = _fallback_yield(rainfall, pesticide, temperature)
        else:
            prediction = _fallback_yield(rainfall, pesticide, temperature)

        prediction = max(0, round(prediction))

        return jsonify({
            'success': True,
            'prediction': {
                'yield_hg_ha': prediction,
                'yield_kg_ha': round(prediction / 10),
                'yield_ton_ha': round(prediction / 10000, 2),
                'crop': crop,
                'parameters': {
                    'rainfall': rainfall,
                    'pesticide': pesticide,
                    'temperature': temperature
                }
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


def _fallback_yield(rainfall, pesticide, temperature):
    base = 30000
    rain_factor = min(rainfall / 1000, 1.5)
    pest_factor = min(pesticide / 200, 1.2)
    temp_factor = max(0.5, 1 - abs(temperature - 25) / 25)
    return base * rain_factor * pest_factor * temp_factor
