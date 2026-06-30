from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import random

crop_bp = Blueprint('crop', __name__)

CROP_DB = {
    'Rice':      {'rain': (1000,2500), 'temp': (20,35), 'hum': (70,95), 'soils': ['clay','loamy','alluvial'], 'ph': (5.5,7.0), 'water': 'high',     'seasons': ['kharif','rabi'],          'market': 'food_grain', 'duration': '120-150d', 'profit': 'medium'},
    'Wheat':     {'rain': (300,1000),  'temp': (15,25), 'hum': (50,70), 'soils': ['loamy','clay','black'],    'ph': (6.0,7.5), 'water': 'medium',    'seasons': ['rabi'],                   'market': 'food_grain', 'duration': '120-140d', 'profit': 'medium'},
    'Maize':     {'rain': (500,1200),  'temp': (18,32), 'hum': (60,80), 'soils': ['loamy','sandy','red'],     'ph': (5.5,7.0), 'water': 'medium',    'seasons': ['kharif','rabi','zaid'],   'market': 'food_grain', 'duration': '90-120d',  'profit': 'high'},
    'Cotton':    {'rain': (500,1200),  'temp': (21,35), 'hum': (60,85), 'soils': ['black','alluvial','red'],  'ph': (6.0,8.0), 'water': 'medium',    'seasons': ['kharif'],                 'market': 'cash_crop',  'duration': '180-200d', 'profit': 'very_high'},
    'Soybean':   {'rain': (400,800),   'temp': (20,30), 'hum': (60,80), 'soils': ['loamy','black','red'],     'ph': (6.0,7.5), 'water': 'medium',    'seasons': ['kharif'],                 'market': 'oilseed',    'duration': '90-110d',  'profit': 'medium'},
    'Groundnut': {'rain': (500,1000),  'temp': (20,30), 'hum': (65,85), 'soils': ['sandy','red','black'],     'ph': (6.0,7.0), 'water': 'medium',    'seasons': ['kharif','rabi'],          'market': 'oilseed',    'duration': '100-120d', 'profit': 'medium'},
    'Tomato':    {'rain': (400,800),   'temp': (18,27), 'hum': (60,80), 'soils': ['loamy','sandy','red'],     'ph': (6.0,7.0), 'water': 'high',      'seasons': ['rabi','zaid'],            'market': 'vegetable',  'duration': '90-120d',  'profit': 'very_high'},
    'Potato':    {'rain': (400,700),   'temp': (15,25), 'hum': (60,80), 'soils': ['loamy','sandy','red'],     'ph': (5.5,6.5), 'water': 'medium',    'seasons': ['rabi'],                   'market': 'vegetable',  'duration': '90-120d',  'profit': 'high'},
    'Onion':     {'rain': (300,600),   'temp': (15,25), 'hum': (60,70), 'soils': ['loamy','sandy'],            'ph': (6.0,7.5), 'water': 'medium',    'seasons': ['rabi','kharif'],          'market': 'vegetable',  'duration': '120-150d', 'profit': 'high'},
    'Sunflower': {'rain': (400,800),   'temp': (20,30), 'hum': (60,80), 'soils': ['loamy','sandy','red'],     'ph': (6.0,7.5), 'water': 'medium',    'seasons': ['kharif','rabi'],          'market': 'oilseed',    'duration': '90-110d',  'profit': 'medium'},
    'Chili':     {'rain': (600,1200),  'temp': (20,30), 'hum': (70,85), 'soils': ['loamy','sandy','red'],     'ph': (6.0,7.0), 'water': 'medium',    'seasons': ['kharif','rabi'],          'market': 'spice',      'duration': '150-180d', 'profit': 'very_high'},
    'Sugarcane': {'rain': (1000,2000), 'temp': (20,35), 'hum': (70,90), 'soils': ['loamy','clay','alluvial'],'ph': (6.0,7.5), 'water': 'very_high', 'seasons': ['annual'],                 'market': 'cash_crop',  'duration': '12-18mo',  'profit': 'high'},
}

BASE_YIELDS = {'Rice':4000,'Wheat':3500,'Maize':5000,'Cotton':2000,'Sugarcane':80000,
               'Soybean':2500,'Groundnut':2000,'Tomato':40000,'Potato':25000,'Onion':30000,'Sunflower':1800,'Chili':3000}

INVEST = {'Rice':(25000,35000),'Wheat':(20000,30000),'Maize':(15000,25000),'Cotton':(30000,45000),
          'Sugarcane':(80000,120000),'Soybean':(12000,18000),'Groundnut':(18000,25000),
          'Tomato':(40000,60000),'Potato':(35000,50000),'Onion':(25000,35000),'Sunflower':(10000,15000),'Chili':(20000,30000)}

def score_crop(crop, req, rain, temp, hum, soil, ph, season, water_avail, exp, market_pref):
    score = 0
    details = []
    rmin, rmax = req['rain']
    if rmin <= rain <= rmax: score += 20; details.append(f'✓ Rainfall ok ({rmin}-{rmax}mm)')
    else: s = max(0,20-abs(rain-((rmin+rmax)/2))/(rmax-rmin+1)*20); score+=s; details.append(f'⚠ Rainfall: needs {rmin}-{rmax}mm')
    tmin, tmax = req['temp']
    if tmin <= temp <= tmax: score += 20; details.append(f'✓ Temperature ok ({tmin}-{tmax}°C)')
    else: s = max(0,20-abs(temp-((tmin+tmax)/2))/(tmax-tmin+1)*20); score+=s; details.append(f'⚠ Temp: needs {tmin}-{tmax}°C')
    if soil in req['soils']: score += 15; details.append(f'✓ Soil compatible')
    else: score += 8; details.append(f'⚠ Soil partially compatible')
    pmin, pmax = req['ph']
    if pmin <= ph <= pmax: score += 10; details.append(f'✓ pH ok ({pmin}-{pmax})')
    else: score += max(0, 10-abs(ph-(pmin+pmax)/2)*3); details.append(f'⚠ pH: needs {pmin}-{pmax}')
    if season in req['seasons'] or 'annual' in req['seasons']: score += 10; details.append(f'✓ Season ok')
    else: score += 5; details.append(f'⚠ Best in {",".join(req["seasons"])}')
    water_compat = {'low':['low'],'medium':['low','medium'],'high':['medium','high','very_high'],'very_high':['high','very_high']}
    if req['water'] in water_compat.get(water_avail,[]): score += 10; details.append('✓ Water ok')
    else: score += 5; details.append(f'⚠ Needs {req["water"]} water')
    if req['market'] == market_pref or market_pref == 'mixed': score += 10; details.append('✓ Market match')
    else: score += 5; details.append(f'⚠ Market: {req["market"]}')
    score += 5  # base
    return min(100, round(score, 1)), details

@crop_bp.route('/recommend', methods=['POST'])
@jwt_required()
def recommend_crops():
    try:
        data = request.get_json()
        rain = float(data.get('rainfall', 800))
        temp = float(data.get('temperature', 25))
        hum  = float(data.get('humidity', 65))
        soil = data.get('soil_type', 'loamy')
        ph   = float(data.get('ph_level', 6.5))
        season = data.get('season', 'kharif')
        farm  = float(data.get('farm_size', 1.0))
        water = data.get('water_availability', 'medium')
        exp   = data.get('experience_level', 'intermediate')
        market= data.get('market_preference', 'food_grain')

        results = []
        for crop, req in CROP_DB.items():
            sc, details = score_crop(crop, req, rain, temp, hum, soil, ph, season, water, exp, market)
            if sc >= 80: lvl, cls = 'Highly Recommended', 'success'
            elif sc >= 65: lvl, cls = 'Recommended', 'primary'
            elif sc >= 50: lvl, cls = 'Moderately Suitable', 'warning'
            else: lvl, cls = 'Not Recommended', 'danger'

            base_y = BASE_YIELDS.get(crop, 3000)
            est_y = round(base_y * sc/100 * random.uniform(0.9, 1.1))
            inv_range = INVEST.get(crop, (15000,25000))
            inv = random.randint(*inv_range)

            results.append({
                'crop': crop,
                'score': sc,
                'level': lvl,
                'level_class': cls,
                'details': details,
                'duration': req['duration'],
                'profit': req['profit'],
                'market': req['market'].replace('_',' ').title(),
                'water_need': req['water'].title(),
                'estimated_yield_kg_ha': est_y,
                'total_yield_kg': round(est_y * farm, 1),
                'investment_per_ha': inv,
                'total_investment': round(inv * farm)
            })

        results.sort(key=lambda x: x['score'], reverse=True)
        return jsonify({'success': True, 'recommendations': results[:8], 'total': len(results)})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
