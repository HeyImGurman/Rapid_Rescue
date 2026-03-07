// create map

var map = L.map('map').setView([20.5937,78.9629],5);

// load OpenStreetMap tiles

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
attribution:'© OpenStreetMap'
}).addTo(map);


// get user location

navigator.geolocation.getCurrentPosition(function(position){

let lat = position.coords.latitude;
let lon = position.coords.longitude;

map.setView([lat,lon],14);


// user marker

L.marker([lat,lon])
.addTo(map)
.bindPopup("You are here")
.openPopup();


// find hospitals

fetchHospitals(lat,lon);

});


// function to fetch hospitals

function fetchHospitals(lat,lon){

let radius = 10000;

let query = `
[out:json];
(
node["amenity"="hospital"](around:${radius},${lat},${lon});
);
out;
`;

let url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

fetch(url)
.then(res => res.json())
.then(data => {

data.elements.forEach(hospital => {

let hLat = hospital.lat;
let hLon = hospital.lon;

let name = hospital.tags.name || "Hospital";

L.marker([hLat,hLon])
.addTo(map)
.bindPopup("🏥 " + name);

});

});

}