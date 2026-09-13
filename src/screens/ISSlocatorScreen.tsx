import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useISSTelemetry } from '../hooks/useISSTelemetry';
import {
  fetchISSGPData,
  calculateOrbitalVisualization,
} from '../services/satelliteService';
import { SatelliteGPData } from '../types';

export default function ISSlocatorScreen() {
  const { telemetry: location, loading, error, refetch } = useISSTelemetry(7000);
  const [issGpData, setIssGpData] = useState<SatelliteGPData | null>(null);

  // Fetch real ISS orbital GP parameters once on mount (failure-safe)
  useEffect(() => {
    let isMounted = true;
    fetchISSGPData()
      .then((gp) => {
        if (isMounted && gp) {
          setIssGpData(gp);
        }
      })
      .catch(() => {
        // Failure-safe: if CelesTrak GP fails, live ISS telemetry remains 100% operational
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute unified orbital visualization using the EXACT SAME pipeline as Feature 2
  const orbitalState = useMemo(() => {
    if (!issGpData) return null;
    return calculateOrbitalVisualization(issGpData, Date.now(), 'iss-orbit', 50);
  }, [issGpData, location]);

  if (loading && !location) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/iss_bg.jpg')}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00d4ff" />
            <Text style={styles.loadingText}>Locating ISS Orbit...</Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (error && !location) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/iss_bg.jpg')}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.centerContainer}>
            <Text style={styles.errorTitle}>Signal Disrupted</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/iss_bg.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Map View */}
        <View style={styles.mapContainer}>
          {orbitalState && (
            <MapLibreGL.MapView
              style={styles.mapView}
              mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
              logoEnabled={false}
              attributionEnabled={true}
              attributionPosition={{ bottom: 8, right: 8 }}
            >
              <MapLibreGL.Camera
                zoomLevel={2.5}
                centerCoordinate={[
                  orbitalState.currentPos.longitude,
                  orbitalState.currentPos.latitude,
                ]}
                animationMode="easeTo"
                animationDuration={1000}
              />

              {/* Orbital Trail LineLayer (Identical to Feature 2) */}
              {orbitalState.trailGeoJson.features.length > 0 && (
                <MapLibreGL.ShapeSource id="iss-orbit-source" shape={orbitalState.trailGeoJson}>
                  <MapLibreGL.LineLayer
                    id="iss-orbit-line"
                    style={{
                      lineColor: '#00d4ff',
                      lineWidth: 2.5,
                      lineOpacity: 0.75,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                </MapLibreGL.ShapeSource>
              )}

              {/* Directional Arrow directly on orbital line 50s ahead (Identical to Feature 2) */}
              {orbitalState.arrowInfo && (
                <MapLibreGL.MarkerView
                  id="iss-orbit-arrow"
                  coordinate={orbitalState.arrowInfo.arrowPos}
                >
                  <View style={styles.arrowMarkerBox}>
                    <View style={{ transform: [{ rotate: `${orbitalState.arrowInfo.bearing}deg` }] }}>
                      <Text style={styles.arrowSymbol}>▲</Text>
                    </View>
                  </View>
                </MapLibreGL.MarkerView>
              )}

              {/* Live ISS Marker sitting directly ON the orbital line (Identical to Feature 2) */}
              <MapLibreGL.MarkerView
                id="iss-marker"
                coordinate={[
                  orbitalState.currentPos.longitude,
                  orbitalState.currentPos.latitude,
                ]}
              >
                <Image
                  source={require('../../assets/iss_icon.png')}
                  style={styles.issMarkerIcon}
                />
              </MapLibreGL.MarkerView>
            </MapLibreGL.MapView>
          )}
        </View>

        {/* Telemetry Card (WhereTheISS Live Telemetry) */}
        <View style={styles.telemetryCard}>
          <Text style={styles.telemetryTitle}>Live Telemetry</Text>

          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.label}>Latitude</Text>
              <Text style={styles.value}>
                {location ? `${location.latitude.toFixed(4)}°` : '--'}
              </Text>
            </View>

            <View style={styles.telemetryItem}>
              <Text style={styles.label}>Longitude</Text>
              <Text style={styles.value}>
                {location ? `${location.longitude.toFixed(4)}°` : '--'}
              </Text>
            </View>

            <View style={styles.telemetryItem}>
              <Text style={styles.label}>Altitude</Text>
              <Text style={styles.value}>
                {location ? `${Math.round(location.altitude)} km` : '--'}
              </Text>
            </View>

            <View style={styles.telemetryItem}>
              <Text style={styles.label}>Velocity</Text>
              <Text style={styles.value}>
                {location ? `${Math.round(location.velocity).toLocaleString('en-US')} km/h` : '--'}
              </Text>
            </View>
          </View>

          {location?.visibility && (
            <Text style={styles.visibilityText}>
              Visibility Status: <Text style={styles.highlightText}>{String(location.visibility).toUpperCase()}</Text>
            </Text>
          )}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0d1b',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(11, 13, 27, 0.75)',
  },
  loadingText: {
    color: '#00d4ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  errorTitle: {
    color: '#ff4d4d',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryText: {
    color: '#0b0d1b',
    fontWeight: 'bold',
    fontSize: 15,
  },
  mapContainer: {
    flex: 0.65,
    overflow: 'hidden',
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  issMarkerIcon: {
    width: 45,
    height: 35,
    resizeMode: 'contain',
  },
  arrowMarkerBox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 900,
  },
  arrowSymbol: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 212, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  telemetryCard: {
    flex: 0.35,
    backgroundColor: '#0b0d1b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  telemetryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    textAlign: 'center',
    marginBottom: 12,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  telemetryItem: {
    width: '48%',
    backgroundColor: '#161936',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 4,
  },
  visibilityText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 2,
  },
  highlightText: {
    color: '#00d4ff',
    fontWeight: 'bold',
  },
});
