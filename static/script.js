document.addEventListener('DOMContentLoaded', function () {
    const map = L.map('map').setView([37.5665, 126.9780], 12); // 초기 위치 설정

    // OpenStreetMap 타일 레이어 추가
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    let markers = [];
    let parkingData = [];
    let userLocation = null;
    let userMarker = null;

    // 거리 계산 함수 (하버사인 공식)
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // 지구 반지름 (km)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // 마커와 테이블 업데이트
    function updateMarkersAndTable(data) {
        markers.forEach(marker => map.removeLayer(marker)); // 기존 마커 제거
        markers = [];
        document.querySelector('#parkingTable tbody').innerHTML = ''; // 테이블 초기화

        data.forEach((parking, index) => {
            const lat = parseFloat(parking.LAT);
            const lng = parseFloat(parking.LOT);
            if (!isNaN(lat) && !isNaN(lng)) {
                const marker = L.marker([lat, lng]).addTo(map).bindPopup(`
                    <b>${parking.PKLT_NM}</b><br>
                    주소: ${parking.ADDR}<br>
                    현재 차량 수: ${parking.NOW_PRK_VHCL_CNT}<br>
                    총 공간: ${parking.TPKCT}<br>
                    거리: ${parking.distance ? parking.distance.toFixed(2) : '-'} km
                `);
                markers.push(marker);

                // 테이블에 추가
                const row = `<tr>
                    <td>${index + 1}</td>
                    <td>${parking.PKLT_NM}</td>
                    <td>${parking.ADDR}</td>
                    <td>${parking.NOW_PRK_VHCL_CNT}</td>
                    <td>${parking.TPKCT}</td>
                    <td>${parking.distance ? parking.distance.toFixed(2) : '-'}</td>
                </tr>`;
                document.querySelector('#parkingTable tbody').insertAdjacentHTML('beforeend', row);
            }
        });
    }

    // 주차 데이터 가져오기
    function fetchParkingData() {
        fetch('/api/parking')
            .then(response => response.json())
            .then(data => {
                parkingData = data;
                applyCurrentFilter();
            });
    }

    // 필터 적용
    function applyCurrentFilter() {
        let filteredData = parkingData;
        const filter = document.getElementById('filter').value;

        if (filter === 'distance' && userLocation) {
            filteredData = parkingData.map(parking => {
                return { ...parking, distance: calculateDistance(userLocation.lat, userLocation.lng, parseFloat(parking.LAT), parseFloat(parking.LOT)) };
            }).sort((a, b) => a.distance - b.distance);
        } else if (filter === 'free') {
            filteredData = parkingData.filter(parking => parking.PAY_YN === 'N');
        }

        updateMarkersAndTable(filteredData);
    }

    // 사용자 위치 가져오기
    function getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                if (userMarker) map.removeLayer(userMarker);
                userMarker = L.marker([userLocation.lat, userLocation.lng], {
                    icon: L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', iconSize: [30, 30] })
                }).addTo(map).bindPopup("현재 위치");

                map.setView([userLocation.lat, userLocation.lng], 12);
                fetchParkingData();
            });
        }
    }

    // 이벤트 리스너
    document.getElementById('applyFilter').addEventListener('click', applyCurrentFilter);
    getUserLocation();
    setInterval(fetchParkingData, 30000);
});
