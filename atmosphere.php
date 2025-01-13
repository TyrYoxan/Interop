<?php
// Géolocalisation via IP
$ip = $_SERVER['REMOTE_ADDR']; // Adresse IP du client
$geoApiUrl = "http://ip-api.com/json/$ip";
$geoContent = file_get_contents($geoApiUrl);
$geoData = json_decode($geoContent, true);

if ($geoData['status'] === 'success') {
    $lat = $geoData['lat'];
    $lon = $geoData['lon'];
    $city = $geoData['city'];
} else {
    // Coordonnées de secours (Nancy - IUT Charlemagne)
    $lat = 48.67103;
    $lon = 6.15083;
    $city = "Nancy";
}

// Récupération des données météo
$xmlUrl = 'https://www.infoclimat.fr/public-api/gfs/xml?_ll=' . $lat . ',' . $lon . '&_auth=ARsDFFIsBCZRfFtsD3lSe1Q8ADUPeVRzBHgFZgtuAH1UMQNgUTNcPlU5VClSfVZkUn8AYVxmVW0Eb1I2WylSLgFgA25SNwRuUT1bPw83UnlUeAB9DzFUcwR4BWMLYwBhVCkDb1EzXCBVOFQoUmNWZlJnAH9cfFVsBGRSPVs1UjEBZwNkUjIEYVE6WyYPIFJjVGUAZg9mVD4EbwVhCzMAMFQzA2JRMlw5VThUKFJiVmtSZQBpXGtVbwRlUjVbKVIuARsDFFIsBCZRfFtsD3lSe1QyAD4PZA%3D%3D&_c=19f3aa7d766b6ba91191c8be71dd1ab2';
$context = stream_context_create([
    'http' => ['proxy' => 'www-cache:3128', 'request_fulluri' => true],
    'ssl' => ['verify_peer' => false, 'verify_peer_name' => false],
]);
$xmlContent = file_get_contents($xmlUrl);
if ($xmlContent === false) {
    $weatherHtml = '<p>Erreur lors de la récupération des données météo.</p>';
} else {
    $xml = simplexml_load_string($xmlContent);
    if ($xml === false) {
        $weatherHtml = '<p>Erreur lors du chargement du XML.</p>';
    } else {
        $XML = new DOMDocument();
        $XML->loadXML($xml->asXML());

        $xslt = new XSLTProcessor();
        $XSLTProcess = new DOMDocument();
        $XSLTProcess->load('./atmosphere/meteo.xsl');
        $xslt->importStylesheet($XSLTProcess);

        $weatherHtml = $xslt->transformToXML($XML);
        if ($weatherHtml === false) {
            $weatherHtml = '<p>Erreur lors de la transformation XSLT.</p>';
        }
    }
}


// Qualité de l'air
$airQualityApiUrl = "https://services3.arcgis.com/Is0UwT37raQYl9Jj/arcgis/rest/services/ind_grandest/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token="; // URL raccourcie pour clarté
$airQualityContent = file_get_contents($airQualityApiUrl);
$airQualityData = json_decode($airQualityContent, true);

if (!empty($airQualityData)) {
    $airQuality = $airQualityData['quality'];
} else {
    $airQuality = 'Données indisponibles';
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Météo, Trafic et Qualité de l'air</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet/dist/leaflet.css">
    <style>
        #map { height: 500px; margin-top: 20px; }
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }
        section { padding: 20px; }
        footer ul { list-style: none; padding: 0; }
        footer ul li { margin: 5px 0; }
    </style>
</head>
<body>
<header>
    <h1>Informations pour <?php echo htmlspecialchars($city); ?></h1>
</header>

<section id="weather">
    <h2>Météo</h2>
    <?php echo $weatherHtml; ?>
</section>

<section id="air-quality">
    <h2>Qualité de l'air</h2>
    <p><?php echo htmlspecialchars($airQuality); ?></p>
</section>

<section id="traffic">
    <h2>Travaux</h2>
    <div id="map"></div>
</section>

<footer>
    <h3>Liens des APIs utilisées :</h3>
    <ul>
        <li><a href="http://ip-api.com/">API Géolocalisation</a></li>
        <li><a href="https://www.infoclimat.fr/public-api/gfs/xml">API Météo</a></li>
        <li><a href="https://api.données-grandnancy.com/traffic.json">API Trafic</a></li>
        <li><a href="https://api.atmo-grandest.com/">API Qualité de l'air</a></li>
    </ul>
</footer>
<script src="https://cdn.jsdelivr.net/npm/leaflet/dist/leaflet.js"></script>
<script src="main.js"></script>
</body>
</html>
