document.addEventListener("DOMContentLoaded", () => {
    const locationElement = document.getElementById("location");
    const covidChart1 = document.getElementById('covidChart1').getContext('2d');
    const covidChart2 = document.getElementById('covidChart2').getContext('2d');
    const airQualityElement = document.getElementById("airQuality");
    const airIcon = document.getElementById("airIcon");
    const weatherElement = document.getElementById("weather");
    const resourcesElement = document.getElementById("resources");
    const mapElement = document.getElementById("map");

    // URLs des API utilisées
    const apiUrls = {
        geoloc: "https://ipapi.co/json/",
        covid: "https://tabular-api.data.gouv.fr/api/resources/5c4e1452-3850-4b59-b11c-3dd51d7fb8b5/data/",
        velosStatic: "https://api.cyclocity.fr/contracts/nancy/gbfs/station_information.json",
        velosDynamic: "https://api.cyclocity.fr/contracts/nancy/gbfs/station_status.json",
        pollution: "https://services3.arcgis.com/Is0UwT37raQYl9Jj/arcgis/rest/services/ind_grandest/FeatureServer/0/query?where=lib_zone%3D%27Nancy%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=", // Remplacer par une URL valide
        meteo: "https://www.infoclimat.fr/public-api/gfs/xml?_ll=",
    };

    // Fonction pour ajouter les ressources utilisées
    const addResourceLinks = () => {
        Object.values(apiUrls).forEach(url => {
            const li = document.createElement("li");
            li.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
            resourcesElement.appendChild(li);
        });
    };

    // Géolocalisation
    fetch(apiUrls.geoloc)
        .then(response => response.json())
        .then(data => {
            locationElement.textContent = `Vous êtes localisé à ${data.city}, ${data.region}, ${data.country_name}`;
            const { latitude, longitude } = data;

            // Initialisation de la carte
            const map = L.map(mapElement).setView([latitude, longitude], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            // Appels aux autres APIs
            loadCovidData(data.region);
            loadBikeData(map, latitude, longitude);
            loadAirQuality(latitude, longitude);
            loadWeather(latitude, longitude);
        })
        .catch(error => console.error("Erreur de géolocalisation :", error));

    // Données Covid
    // Fonction pour récupérer les données SARS pour un département spécifique
    async function fetchSarsDataByDepartment(department, page = 1, pageSize = 50) {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const twoYearsAgoString = twoYearsAgo.toISOString().split('T')[0];
        const url = `https://tabular-api.data.gouv.fr/api/resources/5c4e1452-3850-4b59-b11c-3dd51d7fb8b5/data/?dep__exact=${department}&date__greater=${twoYearsAgoString}&page=${page}&page_size=${pageSize}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error("Erreur lors de la récupération des données SARS :", error);
            return [];
        }
    }

// Fonction pour formater les données d'hospitalisation
    async function formatDataByHospitalization(data) {
        return data.map(item => ({
            label: item.date,
            value: item.hosp
        }));
    }

// Fonction pour formater les données des cas positifs
    async function formatDataByPositiveCases(data) {
        return data.map(item => ({
            label: item.date,
            value: item.pos
        }));
    }

// Fonction pour récupérer une page de données de Maxéville
    async function fetchMaxevillePage(page = 1, pageSize = 50) {
        const url = `https://tabular-api.data.gouv.fr/api/resources/2963ccb5-344d-4978-bdd3-08aaf9efe514/data/?page=${page}&page_size=${pageSize}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.data
                .filter(item => item.MAXEVILLE !== null)
                .map(item => ({
                    label: item.semaine, // Les dates pour Maxéville
                    value: item.MAXEVILLE // Les valeurs de Maxéville
                }));
        } catch (error) {
            console.error("Erreur lors de la récupération des données de Maxéville :", error);
            return [];
        }
    }

// Fonction pour récupérer toutes les données de Maxéville
    async function fetchAllMaxevilleData() {
        let page = 1;
        let data = [];
        while (true) {
            const pageData = await fetchMaxevillePage(page);
            if (pageData.length === 0) {
                break; // Arrêter lorsque la page est vide
            }
            data = data.concat(pageData);
            page++;
        }
        return data;
    }
    // Fonction principale pour charger les données et afficher les graphiques
    const loadCovidData = async () => {
        try {
            // Récupérer les données SARS pour le département 54
            const departmentData = await fetchSarsDataByDepartment("54");

            if (departmentData.length === 0) {
                console.error("Aucune donnée disponible pour le département 54.");
                return;
            }

            // Récupérer les données de Maxéville
            const maxevilleData = await fetchAllMaxevilleData();

            if (maxevilleData.length === 0) {
                console.error("Aucune donnée disponible pour Maxéville.");
            }

            // Formater les données pour les hospitalisations et les cas positifs
            const hospitalizationData = await formatDataByHospitalization(departmentData);
            const positiveCasesData = await formatDataByPositiveCases(departmentData);

            // Préparer les données pour le graphique 1 (Maxéville)
            const labelsMaxeville = maxevilleData.map(item => item.label); // Les dates pour Maxéville
            const valuesMaxeville = maxevilleData.map(item => item.value); // Valeurs de Maxéville

            // Préparer les données pour le graphique 2 (hospitalisations et cas positifs)
            const labelsDepartment = hospitalizationData.map(item => item.label); // Les dates pour le département 54
            const hospValues = hospitalizationData.map(item => item.value); // Hospitalisations
            const posValues = positiveCasesData.map(item => item.value); // Cas positifs

            // Graphique 1 : Données de Maxéville
            new Chart(covidChart1, {
                type: 'line',
                data: {
                    labels: labelsMaxeville, // Labels pour Maxéville
                    datasets: [
                        {
                            label: "Données de Maxéville",
                            data: valuesMaxeville,
                            borderColor: "#28a745",
                            backgroundColor: "rgba(40, 167, 69, 0.2)",
                        }
                    ]
                }
            });

            // Graphique 2 : Hospitalisations et cas positifs pour le département 54
            new Chart(covidChart2, {
                type: 'line',
                data: {
                    labels: labelsDepartment, // Labels pour le département 54
                    datasets: [
                        {
                            label: "Hospitalisations (Département 54)",
                            data: hospValues,
                            borderColor: "#007bff",
                            backgroundColor: "rgba(0, 123, 255, 0.2)",
                        },
                        {
                            label: "Cas positifs (Département 54)",
                            data: posValues,
                            borderColor: "#FF0000",
                            backgroundColor: "rgba(255, 0, 0, 0.2)",
                        }
                    ]
                }
            });

        } catch (error) {
            console.error("Erreur lors de la récupération ou du traitement des données :", error);
        }
    };

// Exemple d'utilisation
    loadCovidData();


    // Disponibilités des vélos
    const loadBikeData = (map, latitude, longitude) => {
        // URLs des API
        const staticDataUrl = apiUrls.velosStatic; // Endpoint pour les données statiques
        const dynamicDataUrl = apiUrls.velosDynamic; // Endpoint pour les données dynamiques

        // Chargement des données statiques et dynamiques
        Promise.all([
            fetch(staticDataUrl).then(response => response.json()),
            fetch(dynamicDataUrl).then(response => response.json())
        ])
            .then(([staticData, dynamicData]) => {
                // Création d'un Map des données dynamiques (clé: station_id)
                const dynamicDataMap = new Map();
                dynamicData.data.stations.forEach(station => {
                    dynamicDataMap.set(station.station_id, station);
                });

                // Ajout des marqueurs sur la carte
                staticData.data.stations.forEach(station => {
                    const dynamicStation = dynamicDataMap.get(station.station_id);

                    // Vérification que des données dynamiques sont disponibles
                    if (dynamicStation) {
                        const marker = L.marker([station.lat, station.lon]).addTo(map);
                        marker.bindPopup(
                            `<strong>${station.name}</strong><br>
                        Adresse: ${station.address}<br>
                        Vélos disponibles: ${dynamicStation.num_bikes_available}<br>
                        Places libres: ${dynamicStation.num_docks_available}`
                        );
                    }
                });
            })
            .catch(error => console.error("Erreur lors du chargement des données vélos :", error));
    };


    // Qualité de l'air
    const loadAirQuality = () => {
        fetch(apiUrls.pollution)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erreur lors de la requête vers l'API ArcGIS");
                }
                return response.json();
            })
            .then(data => {
                if (data.features && data.features.length > 0) {
                    const feature = data.features[0].attributes;
                    const airQuality = feature.lib_qual || "Données non disponibles";

                    const timestamp = feature.date_ech ? new Date(feature.date_ech) : new Date();
                    const formattedDate = `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`;

                    airQualityElement.textContent = `Qualité de l'air : ${airQuality} (Mis à jour : ${formattedDate})`;
                } else {
                    airQualityElement.textContent = "Qualité de l'air : Données non disponibles";
                }
            })
            .catch(error => console.error("Erreur de qualité de l'air :", error));
    };

    // Météo
    const loadWeather = (latitude, longitude) => {
        fetch('./atmosphere/meteo.xsl') // Assurez-vous que ce fichier XSL est disponible au bon emplacement
            .then(response => response.text())
            .then(xsltText => {
                const xsltProcessor = new XSLTProcessor();

                // Charger le XSLT
                const parser = new DOMParser();
                const xsltDoc = parser.parseFromString(xsltText, 'application/xml');
                xsltProcessor.importStylesheet(xsltDoc);

                // Charger les données météo
                return fetch(`${apiUrls.meteo}${latitude},${longitude}&_auth=ARsDFFIsBCZRfFtsD3lSe1Q8ADUPeVRzBHgFZgtuAH1UMQNgUTNcPlU5VClSfVZkUn8AYVxmVW0Eb1I2WylSLgFgA25SNwRuUT1bPw83UnlUeAB9DzFUcwR4BWMLYwBhVCkDb1EzXCBVOFQoUmNWZlJnAH9cfFVsBGRSPVs1UjEBZwNkUjIEYVE6WyYPIFJjVGUAZg9mVD4EbwVhCzMAMFQzA2JRMlw5VThUKFJiVmtSZQBpXGtVbwRlUjVbKVIuARsDFFIsBCZRfFtsD3lSe1QyAD4PZA%3D%3D&_c=19f3aa7d766b6ba91191c8be71dd1ab2`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
                        }
                        return response.text(); // Récupérer les données météo en XML
                    })
                    .then(xmlText => {
                        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

                        // Appliquer la transformation XSLT
                        const resultDocument = xsltProcessor.transformToFragment(xmlDoc, document);

                        // Insérer le résultat dans le DOM
                        const weatherElement = document.getElementById('weather');
                        weatherElement.innerHTML = ''; // Nettoyer le contenu existant
                        weatherElement.appendChild(resultDocument);
                    });
            })
            .catch(error => console.error("Erreur lors du chargement des données ou XSLT :", error));

    };

    addResourceLinks();
});
