<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:output method="html" encoding="UTF-8" indent="yes"/>

    <xsl:param name="currentDate" />

    <xsl:template match="/">
        <html>
            <head>
                <title>Prévisions Météo</title>
                <style>
                    body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background-color: #f9f9fc;
                    color: #333;
                    }
                    h1 {
                    text-align: center;
                    color: #007BFF;
                    margin-bottom: 20px;
                    }
                    .forecast-grid {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                    margin-top: 20px;
                    }
                    .forecast-item {
                    flex: 1;
                    background: #fff;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    }
                    .forecast-item h2 {
                    margin-bottom: 10px;
                    font-size: 18px;
                    color: #333;
                    }
                    .icon {
                    font-size: 40px;
                    margin-bottom: 10px;
                    color: #f39c12;
                    }
                    .details {
                    font-size: 14px;
                    line-height: 1.6;
                    }
                    .details strong {
                    color: #007BFF;
                    }
                </style>
            </head>
            <body>
                <h1>Prévisions Météo pour Aujourd'hui</h1>

                <div class="forecast-grid">
                    <xsl:for-each select="/previsions/echeance[substring(@timestamp, 1, 10) = $currentDate and
                        (substring(@timestamp, 12, 2) = '07' or substring(@timestamp, 12, 2) = '13' or
                        substring(@timestamp, 12, 2) = '16' or substring(@timestamp, 12, 2) = '19')]">
                        <div class="forecast-item">

                            <!-- Période de la journée -->
                            <xsl:call-template name="period">
                                <xsl:with-param name="hour" select="substring(@timestamp, 12, 2)"/>
                            </xsl:call-template>

                            <!-- Icône météo -->
                            <xsl:call-template name="weather-icon">
                                <xsl:with-param name="cloudiness" select="nebulosite/level[@val='totale']"/>
                                <xsl:with-param name="rain" select="pluie"/>
                            </xsl:call-template>

                            <!-- Détails météo -->
                            <xsl:call-template name="weather-info">
                                <xsl:with-param name="temperature" select="temperature/level[@val='2m']"/>
                                <xsl:with-param name="wind" select="vent_moyen/level[@val='10m']"/>
                                <xsl:with-param name="humidity" select="humidite/level[@val='2m']"/>
                            </xsl:call-template>
                        </div>
                    </xsl:for-each>
                </div>
            </body>
        </html>
    </xsl:template>

    <xsl:template name="period">
        <xsl:param name="hour"/>
        <h2>
            <xsl:choose>
                <xsl:when test="$hour = '07'">Matin</xsl:when>
                <xsl:when test="$hour = '13'">Midi</xsl:when>
                <xsl:when test="$hour = '16'">Après-midi</xsl:when>
                <xsl:when test="$hour = '19'">Soir</xsl:when>
            </xsl:choose>
        </h2>
    </xsl:template>

    <xsl:template name="weather-icon">
        <xsl:param name="cloudiness"/>
        <xsl:param name="rain"/>
        <p class="icon">
            <xsl:choose>
                <xsl:when test="$rain &gt; 0">&#9730; <!-- Pluie --></xsl:when>
                <xsl:when test="$cloudiness &lt; 20">&#9728; <!-- Soleil --></xsl:when>
                <xsl:when test="$cloudiness &gt;= 20 and $cloudiness &lt; 80">&#9729; <!-- Nuages --></xsl:when>
                <xsl:otherwise>&#9729; <!-- Couvert --></xsl:otherwise>
            </xsl:choose>
        </p>
    </xsl:template>

    <xsl:template name="weather-info">
        <xsl:param name="temperature"/>
        <xsl:param name="wind"/>
        <xsl:param name="humidity"/>
        <div class="details">
            <p><strong>Température :</strong> <xsl:value-of select="format-number($temperature - 273.15, '#')"/> °C
            </p>
            <p><strong>Vent :</strong> <xsl:value-of select="$wind"/> km/h</p>
            <p><strong>Humidité :</strong> <xsl:value-of select="$humidity"/> %</p>
        </div>
    </xsl:template>
</xsl:stylesheet>
