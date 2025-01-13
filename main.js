// Les données initiales
const mapData = {
    center: { lat: 48.67103, lon: 6.15083 },
    workMarkers: [],
    additionalMarkers: [
        { lat: 48.692054, lon: 6.184417, message: "Gare de Nancy" },
        { lat: 48.67103, lon: 6.15083, message: "IUT Charlemagne" }
    ]
};

// Charger les données du fichier travaux.json
fetch('travaux.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP ! statut : ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Traiter les incidents et les ajouter à mapData.workMarkers
        if (data.incidents && data.incidents.length > 0) {
            data.incidents.forEach(incident => {
                const location = incident.location;
                if (location && location.polyline) {
                    const [lat, lon] = location.polyline.split(' ').map(coord => parseFloat(coord));
                    mapData.workMarkers.push({
                        lat,
                        lon,
                        message: `${incident.description} (${incident.starttime} - ${incident.endtime})`
                    });
                }
            });
        }

        // Initialiser la carte avec les données
        initializeMap();
    })
    .catch(error => {
        console.error('Erreur lors du chargement du fichier JSON :', error);
    });

// Fonction pour initialiser la carte avec Leaflet
function initializeMap() {
    const map = L.map('map').setView([mapData.center.lat, mapData.center.lon], 13);

    // Ajouter la couche de tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Ajouter les marqueurs des travaux
    mapData.workMarkers.forEach(marker => {
        L.marker([marker.lat, marker.lon])
            .addTo(map)
            .bindPopup(marker.message);
    });

    // Ajouter les marqueurs supplémentaires
    mapData.additionalMarkers.forEach(marker => {
        L.marker([marker.lat, marker.lon])
            .addTo(map)
            .bindPopup(marker.message);
    });
}
