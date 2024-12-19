from flask import Flask, jsonify, render_template
import requests

app = Flask(__name__)

API_KEY = "494f636554726a7339345068506258"  # OpenAPI 인증 키
API_URL = f"http://openapi.seoul.go.kr:8088/494f636554726a7339345068506258/json/GetParkingInfo/1/1000/"

# OpenAPI에서 주차장 데이터를 가져오는 함수
def get_parking_data():
    try:
        response = requests.get(API_URL)
        if response.status_code == 200:
            data = response.json()
            if "GetParkingInfo" in data:
                return data["GetParkingInfo"]["row"]  # 주차장 데이터 리스트 반환
            else:
                print("API 응답에 데이터가 없습니다.")
                return []
        else:
            print(f"API 호출 실패: {response.status_code}")
            return []
    except Exception as e:
        print(f"오류 발생: {e}")
        return []

# 주차 데이터 제공 엔드포인트
@app.route('/api/parking', methods=['GET'])
def parking_api():
    data = get_parking_data()
    if data:
        # LAT(위도)와 LOT(경도)가 유효한 데이터만 반환
        valid_data = [
            item for item in data 
            if item.get('LAT') and item.get('LOT')
        ]
        return jsonify(valid_data)  # JSON 형식으로 반환
    else:
        return jsonify({"error": "Failed to fetch parking data"}), 500

# 클라이언트에 HTML 페이지 제공
@app.route('/')
def index():
    return render_template('index.html')  # templates 폴더 내 index.html 사용

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
