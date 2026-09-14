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
import { formatFreshnessLabel } from '../utils/timeUtils';
import { useTheme } from '../context/ThemeContext';
import {
  fetchISSGPData,
  calculateOrbitalVisualization,
} from '../services/satelliteService';
import { SatelliteGPData } from '../types';

export default function ISSlocatorScreen() {
  const { colors, activeTheme } = useTheme();
  const { telemetry: location, loading, error, isCached, cachedAt, refetch } = useISSTelemetry(7000);
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
          <View style={[styles.centerContainer, { backgroundColor: colors.background + 'C0' }]}>
            <ActivityIndicator size="large" color={colors.primaryAccent} />
            <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Locating ISS Orbit...</Text>
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
          <View style={[styles.centerContainer, { backgroundColor: colors.background + 'C0' }]}>
            <Text style={[styles.errorTitle, { color: colors.warning }]}>Signal Disrupted</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primaryAccent }]} onPress={refetch}>
              <Text style={[styles.retryText, { color: '#ffffff' }]}>Retry Connection</Text>
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
              mapStyle={activeTheme === 'light' ? 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'}
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
                      lineColor: '#5B9CFF',
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
        <View
          style={[
            styles.telemetryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.telemetryTitle,
              { color: isCached ? colors.warning : colors.primaryAccent },
            ]}
          >
            {isCached
              ? formatFreshnessLabel({ source: 'cache', cachedAt, prefix: 'Cached telemetry •' })
              : 'Live Telemetry'}
          </Text>

          <View style={styles.telemetryGrid}>
            <View
              style={[
                styles.telemetryItem,
                {
                  backgroundColor: colors.raisedSurface,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.label, { color: colors.textMuted }]}>Latitude</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {location ? `${location.latitude.toFixed(4)}°` : '--'}
              </Text>
            </View>

            <View
              style={[
                styles.telemetryItem,
                {
                  backgroundColor: colors.raisedSurface,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.label, { color: colors.textMuted }]}>Longitude</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {location ? `${location.longitude.toFixed(4)}°` : '--'}
              </Text>
            </View>

            <View
              style={[
                styles.telemetryItem,
                {
                  backgroundColor: colors.raisedSurface,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.label, { color: colors.textMuted }]}>Altitude</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {location ? `${Math.round(location.altitude)} km` : '--'}
              </Text>
            </View>

            <View
              style={[
                styles.telemetryItem,
                {
                  backgroundColor: colors.raisedSurface,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.label, { color: colors.textMuted }]}>Velocity</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {location ? `${Math.round(location.velocity).toLocaleString('en-US')} km/h` : '--'}
              </Text>
            </View>
          </View>

          {location?.visibility && (
            <Text style={[styles.visibilityText, { color: colors.textMuted }]}>
              Visibility Status:{' '}
              <Text style={[styles.highlightText, { color: colors.primaryAccent }]}>
                {String(location.visibility).toUpperCase()}
              </Text>
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
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryText: {
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
    color: '#5B9CFF',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
    textAlign: 'center',
  },
  telemetryCard: {
    flex: 0.35,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  telemetryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  telemetryItem: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  visibilityText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  highlightText: {
    fontWeight: 'bold',
  },
});
