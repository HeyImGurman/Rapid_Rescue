// Initialize Map
var map = L.map('map').setView([20.5937, 78.9629], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// API KEY
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZkZDIwMTEyYzJjZjQ2YThhNDExNmY3MTAzNTM4YzZjIiwiaCI6Im11cm11cjY0In0=";

// Get User Location
navigator.geolocation.getCurrentPosition(function (position) {
    let lat = position.coords.latitude;
    let lon = position.coords.longitude;

    map.setView([lat, lon], 13);

    // User marker
    L.marker([lat, lon])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();

    // Search hospitals
    fetchHospitals(lat, lon);
}, function(error) {
    console.error("Geolocation error:", error);
    alert("Please allow location access to find nearby hospitals.");
});

async function fetchHospitals(lat, lon) {
    let radius = 10000;
    
    // 1. SHOW THE LOADING SPINNER
    const listContainer = document.getElementById('hospital-list');
    if (listContainer) {
        listContainer.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Finding nearby hospitals and calculating fastest routes...</p>
            </div>
        `;
    }

    let query = `
        [out:json];
        (
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        );
        out;
    `;

    let url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    try {
        let response = await fetch(url);
        let data = await response.json();
        let hospitals = data.elements.slice(0, 10); 

        if (hospitals.length === 0) {
            if (listContainer) {
                listContainer.innerHTML = "<p>No hospitals found within 10km.</p>";
            }
            return;
        }

        // Fetch routing data for ALL 10 hospitals concurrently
        let routePromises = hospitals.map(async (hospital) => {
            let hLat = hospital.lat;
            let hLon = hospital.lon;
            let routeURL = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${lon},${lat}&end=${hLon},${hLat}`;

            try {
                let routeResponse = await fetch(routeURL);
                let routeData = await routeResponse.json();
                
                if (routeData.features && routeData.features.length > 0) {
                    let summary = routeData.features[0].properties.summary;
                    let geometry = routeData.features[0].geometry;
                    return {
                        hospital: hospital,
                        duration: summary.duration, 
                        distance: summary.distance, 
                        geometry: geometry
                    };
                }
            } catch (err) {
                console.error("Routing error for hospital:", hospital.tags.name, err);
            }
            return null; 
        });

        // Wait for all route calculations to finish
        let results = await Promise.all(routePromises);
        
        // Filter out failed routes and sort by duration
        let sortedHospitals = results
            .filter(result => result !== null)
            .sort((a, b) => a.duration - b.duration);

        // This will automatically clear out the loading spinner!
        renderHospitalList(sortedHospitals, lat, lon);

    } catch (error) {
        console.error("Error fetching hospitals:", error);
        if (listContainer) {
            listContainer.innerHTML = "<p style='text-align:center; color:#e74c3c;'>Error loading hospitals. Please try again later.</p>";
        }
    }
}

function renderHospitalList(sortedHospitals, userLat, userLon) {
    const listContainer = document.getElementById('hospital-list');
    listContainer.innerHTML = ''; // Clear loading states if any

    sortedHospitals.forEach((item, index) => {
        let hospital = item.hospital;
        let hLat = hospital.lat;
        let hLon = hospital.lon;
        let name = hospital.tags.name || "Unknown Hospital";
        let phone = hospital.tags.phone || hospital.tags['contact:phone'];
        
        // Convert metrics
        let timeMins = Math.ceil(item.duration / 60);
        let distKm = (item.distance / 1000).toFixed(1);

        // 1. Add Marker to Map
        let isBest = index === 0;
        let markerColor = isBest ? "green" : "blue";
        let icon = L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${markerColor}.png`,
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });

        L.marker([hLat, hLon], { icon })
            .addTo(map)
            .bindPopup(`<b>${index + 1}. ${name}</b><br>${timeMins} mins away`);

        // 2. Draw fastest route on map for the #1 hospital
        if (isBest && item.geometry) {
            L.geoJSON(item.geometry, {
                style: { color: '#0a66ff', weight: 5, opacity: 0.8 }
            }).addTo(map);
        }

        // 3. Build HTML List Item
        // Create Google Maps Direct URL
        let navUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${hLat},${hLon}&travelmode=driving`;
        
        // Handle missing phone numbers gracefully
        let callButtonHtml = phone 
            ? `<a href="tel:${phone}" class="btn btn-call">📞 Call</a>` 
            : `<a href="#" class="btn btn-call" style="opacity: 0.5; pointer-events: none;">No Phone</a>`;

        let htmlString = `
            <div class="hospital-item">
                <div class="hospital-info">
                    <h3>${index + 1}. ${name}</h3>
                    <div class="hospital-stats">
                        <span>🚗 ${timeMins} mins</span>
                        <span>📍 ${distKm} km away</span>
                    </div>
                </div>
                <div class="hospital-actions">
                    ${callButtonHtml}
                    <a href="${navUrl}" target="_blank" class="btn btn-navigate">🧭 Navigate</a>
                </div>
            </div>
        `;
        
        listContainer.insertAdjacentHTML('beforeend', htmlString);
    });
}