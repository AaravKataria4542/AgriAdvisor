import os
import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dotenv import load_dotenv

load_dotenv()

weather_bp = Blueprint('weather', __name__)

OWM_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')

@weather_bp.route('/current', methods=['GET'])
def get_current_weather():
    try:
        city = request.args.get('city', 'Mumbai')
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={OWM_API_KEY}&units=metric"
        resp = requests.get(url, timeout=10)

        if resp.status_code != 200:
            return jsonify({'success': False, 'message': f'City "{city}" not found or API error'}), 400

        data = resp.json()

        weather = {
            'city': data['name'],
            'country': data['sys']['country'],
            'temperature': round(data['main']['temp'], 1),
            'feels_like': round(data['main']['feels_like'], 1),
            'humidity': data['main']['humidity'],
            'pressure': data['main']['pressure'],
            'description': data['weather'][0]['description'].title(),
            'icon': data['weather'][0]['icon'],
            'wind_speed': round(data['wind']['speed'] * 3.6, 1),  # m/s to km/h
            'visibility': data.get('visibility', 0) // 1000,  # meters to km
            'clouds': data['clouds']['all'],
            'rainfall_1h': data.get('rain', {}).get('1h', 0),
            'sunrise': data['sys']['sunrise'],
            'sunset': data['sys']['sunset']
        }

        return jsonify({'success': True, 'weather': weather})

    except requests.exceptions.Timeout:
        return jsonify({'success': False, 'message': 'Weather API timeout. Try again.'}), 504
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@weather_bp.route('/forecast', methods=['GET'])
def get_forecast():
    try:
        city = request.args.get('city', 'Mumbai')
        url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={OWM_API_KEY}&units=metric&cnt=40"
        resp = requests.get(url, timeout=10)

        if resp.status_code != 200:
            return jsonify({'success': False, 'message': f'City "{city}" not found'}), 400

        data = resp.json()
        forecasts = []

        for item in data['list']:
            forecasts.append({
                'datetime': item['dt_txt'],
                'temp': round(item['main']['temp'], 1),
                'humidity': item['main']['humidity'],
                'description': item['weather'][0]['description'].title(),
                'icon': item['weather'][0]['icon'],
                'rain': item.get('rain', {}).get('3h', 0),
                'wind_speed': round(item['wind']['speed'] * 3.6, 1)
            })

        return jsonify({'success': True, 'city': city, 'forecast': forecasts})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@weather_bp.route('/crop-calendar', methods=['POST'])
def crop_calendar():
    """Generate 6-month crop recommendation calendar based on weather + soil"""
    try:
        import random
        from datetime import datetime, timedelta

        data = request.get_json()
        city = data.get('city', 'Mumbai')
        soil_type = data.get('soil_type', 'loamy')
        current_month = datetime.now().month

        # Fetch current weather for context
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={OWM_API_KEY}&units=metric"
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                wdata = resp.json()
                current_temp = wdata['main']['temp']
                current_humidity = wdata['main']['humidity']
            else:
                current_temp = 25
                current_humidity = 65
        except:
            current_temp = 25
            current_humidity = 65

        months = []
        for i in range(6):
            m = (current_month + i - 1) % 12 + 1
            dt = datetime.now() + timedelta(days=30 * i)
            month_name = dt.strftime('%B %Y')

            # Seasonal crop mapping
            if m in [6, 7, 8, 9]:  # Kharif
                season = 'Kharif'
                recommended = ['Rice', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Groundnut']
                advisory = 'Kharif season – high rainfall crops recommended'
            elif m in [10, 11, 12, 1, 2, 3]:  # Rabi
                season = 'Rabi'
                recommended = ['Wheat', 'Barley', 'Mustard', 'Chana', 'Potato', 'Onion']
                advisory = 'Rabi season – cool weather, low water crops recommended'
            else:  # Zaid
                season = 'Zaid'
                recommended = ['Watermelon', 'Cucumber', 'Muskmelon', 'Fodder', 'Sunflower']
                advisory = 'Zaid season – short duration crops recommended'

            # Temperature adjust
            temp = round(current_temp + random.uniform(-3, 3) + (i * 0.5 if m < 9 else -0.3), 1)
            rain = round(random.uniform(50, 300) if season == 'Kharif' else random.uniform(10, 100), 1)

            months.append({
                'month': month_name,
                'month_num': m,
                'season': season,
                'temperature': temp,
                'expected_rainfall': rain,
                'humidity': min(95, current_humidity + (10 if season == 'Kharif' else -5)),
                'recommended_crops': recommended[:4],
                'advisory': advisory,
                'soil_note': f'Best for {soil_type} soil: {recommended[0]} or {recommended[1]}'
            })

        return jsonify({
            'success': True,
            'city': city,
            'soil_type': soil_type,
            'calendar': months
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
