// create map

var map = L.map('map').setView([20.5937,78.9629],5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
attribution:'© OpenStreetMap'
}).addTo(map);


// API KEY (replace with yours)

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImU2Y2EzYTA5MGNiNDQyOWY5YWY3YTk3NjBhMjUxODY2IiwiaCI6Im11cm11cjY0In0=";


// get user location

navigator.geolocation.getCurrentPosition(function(position){

let lat = position.coords.latitude;
let lon = position.coords.longitude;

map.setView([lat,lon],13);


// user marker

L.marker([lat,lon])
.addTo(map)
.bindPopup("You are here")
.openPopup();


// search hospitals

fetchHospitals(lat,lon);

});



async function fetchHospitals(lat,lon){

let radius = 10000;

let query = `
[out:json];
(
node["amenity"="hospital"](around:${radius},${lat},${lon});
);
out;
`;

let url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

let response = await fetch(url);
let data = await response.json();

let hospitals = data.elements;

let bestHospital = null;
let fastestTime = Infinity;


// check route to each hospital

for(let hospital of hospitals.slice(0,10)){   // limit to 10

let hLat = hospital.lat;
let hLon = hospital.lon;

let routeURL =
`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${lon},${lat}&end=${hLon},${hLat}`;

let routeResponse = await fetch(routeURL);
let routeData = await routeResponse.json();

let duration = routeData.features[0].properties.summary.duration;

if(duration < fastestTime){

fastestTime = duration;
bestHospital = hospital;

}

}


// display hospitals

hospitals.slice(0,10).forEach(hospital => {

let hLat = hospital.lat;
let hLon = hospital.lon;

let name = hospital.tags.name || "Hospital";

let markerColor = "blue";

if(bestHospital && hospital.id === bestHospital.id){

markerColor = "green";

}


// marker

let icon = L.icon({
iconUrl:`https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${markerColor}.png`,
shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
iconSize:[25,41],
iconAnchor:[12,41]
});

L.marker([hLat,hLon],{icon})
.addTo(map)
.bindPopup("🏥 " + name);

});


// draw fastest route

if(bestHospital){

let hLat = bestHospital.lat;
let hLon = bestHospital.lon;

L.Routing.control({

waypoints:[
L.latLng(lat,lon),
L.latLng(hLat,hLon)
],

routeWhileDragging:false

}).addTo(map);

}

}