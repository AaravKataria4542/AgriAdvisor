from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import random

fertilizer_bp = Blueprint('fertilizer', __name__)

CROP_NPK = {
    'Maize': {'N': 120, 'P': 60, 'K': 40},
    'Rice': {'N': 100, 'P': 50, 'K': 50},
    'Potatoes': {'N': 150, 'P': 80, 'K': 120},
    'Soybeans': {'N': 20, 'P': 40, 'K': 60},
    'Wheat': {'N': 120, 'P': 40, 'K': 30},
    'Sorghum': {'N': 80, 'P': 40, 'K': 40},
    'Cotton': {'N': 120, 'P': 60, 'K': 60},
    'Sugarcane': {'N': 200, 'P': 80, 'K': 100},
    'Tomatoes': {'N': 150, 'P': 100, 'K': 150},
}

@fertilizer_bp.route('/recommend', methods=['POST'])
@jwt_required()
def recommend_fertilizer():
    try:
        data = request.get_json()
        crop = data.get('crop', 'Maize')
        rainfall = float(data.get('rainfall', 800))
        soil_type = data.get('soil_type', 'loamy')
        field_size = float(data.get('field_size', 1.0))
        growth_stage = data.get('growth_stage', 'vegetative')

        # Match crop
        matched = 'Maize'
        for key in CROP_NPK:
            if key.lower() in crop.lower() or crop.lower() in key.lower():
                matched = key
                break
        base = CROP_NPK[matched]

        # Rainfall factor
        if rainfall < 400:
            rf = (random.uniform(1.15, 1.25), random.uniform(1.10, 1.20), random.uniform(1.05, 1.15))
            rain_note = 'Low rainfall: increased N&P needs'
        elif rainfall > 1500:
            rf = (random.uniform(0.75, 0.85), random.uniform(0.80, 0.90), random.uniform(1.10, 1.20))
            rain_note = 'High rainfall: reduced N&P, increased K'
        else:
            rf = (random.uniform(0.95, 1.05),) * 3
            rain_note = 'Normal rainfall: standard application'

        soil_adj = {
            'clay': (0.9, 1.1, 0.9), 'sandy': (1.1, 1.2, 1.1), 'loamy': (1.0, 1.0, 1.0),
            'silt': (0.95, 1.05, 0.95), 'red': (1.05, 1.15, 1.0), 'black': (0.95, 0.9, 1.05)
        }.get(soil_type, (1.0, 1.0, 1.0))

        stage_adj = {
            'pre-sowing': (0.3, 0.5, 0.3), 'sowing': (0.4, 0.6, 0.4),
            'vegetative': (1.2, 0.8, 0.9), 'flowering': (0.6, 1.2, 1.1), 'maturity': (0.2, 0.3, 0.8)
        }.get(growth_stage, (1.0, 1.0, 1.0))

        n = max(10, round(base['N'] * rf[0] * soil_adj[0] * stage_adj[0] * random.uniform(0.9, 1.1)))
        p = max(5, round(base['P'] * rf[1] * soil_adj[1] * stage_adj[1] * random.uniform(0.9, 1.1)))
        k = max(5, round(base['K'] * rf[2] * soil_adj[2] * stage_adj[2] * random.uniform(0.9, 1.1)))

        return jsonify({
            'success': True,
            'recommendation': {
                'crop': matched,
                'nitrogen_kg_ha': n,
                'phosphorus_kg_ha': p,
                'potassium_kg_ha': k,
                'total_nitrogen_kg': round(n * field_size, 1),
                'total_phosphorus_kg': round(p * field_size, 1),
                'total_potassium_kg': round(k * field_size, 1),
                'rainfall_note': rain_note,
                'soil_type': soil_type.title(),
                'growth_stage': growth_stage.replace('-', ' ').title(),
                'field_size': field_size,
                'cost_estimate': {
                    'per_hectare': round(n * 30 + p * 60 + k * 37),
                    'total_field': round((n * 30 + p * 60 + k * 37) * field_size),
                    'currency': 'INR'
                },
                'summary': f'Apply {n}kg/ha N, {p}kg/ha P, {k}kg/ha K for {matched}'
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
