import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import {
  fetchSpacecraftGPData,
  calculateOrbitalVisualization,
} from '../services/satelliteService';
import { SatelliteGPData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getAgencyIcon } from '../utils/agencyIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'SpacecraftDetails'>;

export default function SpacecraftDetailsScreen({ route }: Props) {
  const { colors, activeTheme } = useTheme();
  const { spacecraft } = route.params;
  const agencyIcon = getAgencyIcon(spacecraft.agencyAbbrev || spacecraft.agency);

  const [gpData, setGpData] = useState<SatelliteGPData | null>(null);
  const [loading, setLoading] = useState<boolean>(spacecraft.hasLiveTracking);
  const [fetchError, setFetchError] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [imageError, setImageError] = useState<boolean>(false);

  // Auto-refresh ticker for live position updates every 2 seconds
  useEffect(() => {
    if (!spacecraft.hasLiveTracking) return;

    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 2000);
    return () => clearInterval(timer);
  }, [spacecraft.hasLiveTracking]);

  // Load GP orbital data from CelesTrak if spacecraft supports live tracking
  const loadLiveTelemetry = useCallback(async () => {
    if (!spacecraft.hasLiveTracking || !spacecraft.noradCatId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setFetchError(false);
      const data = await fetchSpacecraftGPData(spacecraft.noradCatId);
      if (data) {
        setGpData(data);
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [spacecraft.hasLiveTracking, spacecraft.noradCatId]);

  useEffect(() => {
    loadLiveTelemetry();
  }, [loadLiveTelemetry]);

  // Compute live orbital state atomically using satelliteService pipeline
  const orbitalState = useMemo(() => {
    if (!gpData) return null;
    return calculateOrbitalVisualization(gpData, nowMs, `sc-${spacecraft.id}`);
  }, [gpData, nowMs, spacecraft.id]);

  const handleOpenWebsite = () => {
    if (spacecraft.websiteUrl) {
      Linking.openURL(spacecraft.websiteUrl).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/bg_image.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO BANNER OR IMAGE */}
          {spacecraft.imageUrl && !imageError ? (
            <View style={[styles.heroImageContainer, { borderColor: colors.surfaceBorder }]}>
              <Image
                source={{ uri: spacecraft.imageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
              <View style={styles.heroOverlay} />
            </View>
          ) : agencyIcon ? (
            <View style={[styles.heroImageContainer, styles.heroAgencyIconContainer, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
              <Image source={agencyIcon} style={styles.heroAgencyIcon} resizeMode="contain" />
            </View>
          ) : (
            <View style={[styles.heroFallbackBanner, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.heroFallbackText, { color: colors.primaryAccent }]}>{spacecraft.agencyAbbrev}</Text>
              <Text style={[styles.heroFallbackSubtext, { color: colors.textMuted }]}>{spacecraft.region}</Text>
            </View>
          )}

          {/* MAIN HEADER CARD */}
          <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.headerTopRow}>
              <View style={[styles.agencyBadge, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.agencyBadgeText, { color: colors.primaryAccent }]}>{spacecraft.agencyAbbrev}</Text>
              </View>

              <View
                style={[
                  styles.trackingPill,
                  spacecraft.hasLiveTracking ? styles.livePill : styles.staticPill,
                  { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: spacecraft.hasLiveTracking ? '#10b981' : colors.primaryAccent },
                  ]}
                />
                <Text
                  style={[
                    styles.trackingText,
                    { color: spacecraft.hasLiveTracking ? '#10b981' : colors.primaryAccent },
                  ]}
                >
                  {spacecraft.hasLiveTracking ? 'LIVE TELEMETRY' : 'TRAJECTORY VIEW'}
                </Text>
              </View>
            </View>

            <Text style={[styles.titleText, { color: colors.textPrimary }]}>{spacecraft.name}</Text>
            <Text style={[styles.agencyFullName, { color: colors.textMuted }]}>{spacecraft.agency}</Text>
          </View>

          {/* LIVE TELEMETRY / MAP SECTION (For Earth LEO Spacecraft) */}
          {spacecraft.hasLiveTracking ? (
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>LIVE EARTH ORBITAL TELEMETRY</Text>
                <TouchableOpacity onPress={loadLiveTelemetry} style={[styles.refreshBtn, { backgroundColor: colors.raisedSurface }]}>
                  <Text style={[styles.refreshBtnText, { color: colors.primaryAccent }]}>↻ Refresh</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={colors.primaryAccent} />
                  <Text style={[styles.loadingText, { color: colors.textMuted }]}>Fetching orbital telemetry...</Text>
                </View>
              ) : fetchError || !orbitalState ? (
                <View style={[styles.fallbackBox, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                  <Text style={styles.fallbackTitle}>Telemetry Unavailable</Text>
                  <Text style={[styles.fallbackText, { color: colors.textMuted }]}>
                    Live orbital telemetry server is currently unreachable. Displaying standard mission specifications below.
                  </Text>
                </View>
              ) : (
                <>
                  {/* MAP VISUALIZATION */}
                  <View style={[styles.mapContainer, { borderColor: colors.surfaceBorder }]}>
                    <MapLibreGL.MapView
                      style={styles.map}
                      mapStyle={activeTheme === 'light' ? 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'}
                      logoEnabled={false}
                      attributionEnabled={false}
                    >
                      <MapLibreGL.Camera
                        centerCoordinate={[
                          orbitalState.currentPos.longitude,
                          orbitalState.currentPos.latitude,
                        ]}
                        zoomLevel={1.8}
                        animationMode="flyTo"
                      />

                      {/* Orbital Trail */}
                      {orbitalState.trailGeoJson.features.length > 0 && (
                        <MapLibreGL.ShapeSource
                          id={`sc-trail-src-${spacecraft.id}`}
                          shape={orbitalState.trailGeoJson}
                        >
                          <MapLibreGL.LineLayer
                            id={`sc-trail-layer-${spacecraft.id}`}
                            style={{
                              lineColor: colors.primaryAccent,
                              lineWidth: 2.5,
                              lineOpacity: 0.85,
                            }}
                          />
                        </MapLibreGL.ShapeSource>
                      )}

                      {/* Current Spacecraft Position Marker */}
                      <MapLibreGL.MarkerView
                        id={`sc-marker-${spacecraft.id}`}
                        coordinate={[
                          orbitalState.currentPos.longitude,
                          orbitalState.currentPos.latitude,
                        ]}
                      >
                        <View style={styles.markerContainer}>
                          <View style={[styles.markerBadge, { backgroundColor: colors.primaryAccent }]}>
                            <Text style={styles.markerBadgeText}>{spacecraft.name}</Text>
                          </View>
                          <Image
                            source={require('../../assets/iss_icon.png')}
                            style={styles.satMarkerIcon}
                          />
                        </View>
                      </MapLibreGL.MarkerView>
                    </MapLibreGL.MapView>
                  </View>

                  {/* TELEMETRY METRICS GRID */}
                  <View style={styles.telemetryGrid}>
                    <View style={styles.gridItem}>
                      <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Latitude</Text>
                      <Text style={[styles.gridValue, { color: colors.textPrimary }]}>
                        {orbitalState.currentPos.latitude.toFixed(3)}°
                      </Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Longitude</Text>
                      <Text style={[styles.gridValue, { color: colors.textPrimary }]}>
                        {orbitalState.currentPos.longitude.toFixed(3)}°
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.gridRow, { marginTop: 10 }]}>
                    <View style={styles.gridItem}>
                      <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Altitude</Text>
                      <Text style={[styles.gridValue, { color: colors.textPrimary }]}>
                        {Math.round(orbitalState.currentPos.altitudeKm)} km
                      </Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Orbital Velocity</Text>
                      <Text style={[styles.gridValue, { color: colors.textPrimary }]}>
                        {Math.round(orbitalState.currentPos.velocityKmH).toLocaleString('en-US')}{' '}
                        km/h
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          ) : (
            /* TRAJECTORY & DEEP SPACE ORBIT CARD */
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>TRAJECTORY & ORBITAL REGION</Text>
              <View style={[styles.trajectoryBox, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.trajectoryRegion, { color: colors.primaryAccent }]}>{spacecraft.region.toUpperCase()}</Text>
                <Text style={[styles.trajectoryDest, { color: colors.textPrimary }]}>{spacecraft.destination}</Text>
                <Text style={[styles.trajectoryNote, { color: colors.textMuted }]}>
                  Live Earth-orbit telemetry unavailable for deep-space / planetary mission. Displaying verified mission trajectory parameters.
                </Text>
              </View>
            </View>
          )}

          {/* SPECIFICATIONS GRID */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>SPACECRAFT SPECIFICATIONS</Text>

            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Mission / Program</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{spacecraft.mission}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Operational Status</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{spacecraft.status}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Launch Date</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{spacecraft.launchDate}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Target Destination</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{spacecraft.destination}</Text>
              </View>
            </View>
          </View>

          {/* OVERVIEW / DESCRIPTION */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>MISSION OVERVIEW</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{spacecraft.description}</Text>
          </View>

          {/* PRIMARY OBJECTIVES */}
          {spacecraft.primaryObjectives && spacecraft.primaryObjectives.length > 0 && (
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>PRIMARY OBJECTIVES</Text>
              {spacecraft.primaryObjectives.map((obj, index) => (
                <View key={index} style={styles.objectiveRow}>
                  <Text style={[styles.objectiveBullet, { color: colors.primaryAccent }]}>•</Text>
                  <Text style={[styles.objectiveText, { color: colors.textSecondary }]}>{obj}</Text>
                </View>
              ))}
            </View>
          )}

          {/* OFFICIAL WEBSITE LINK */}
          {spacecraft.websiteUrl && (
            <TouchableOpacity
              style={[styles.websiteButton, { backgroundColor: colors.surface, borderColor: colors.primaryAccent }]}
              activeOpacity={0.8}
              onPress={handleOpenWebsite}
            >
              <Text style={[styles.websiteButtonText, { color: colors.primaryAccent }]}>Visit Official Mission Website &rarr;</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroImageContainer: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.2)',
  },
  heroAgencyIconContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  heroAgencyIcon: {
    width: 180,
    height: 100,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 13, 27, 0.3)',
  },
  heroFallbackBanner: {
    height: 110,
    backgroundColor: '#161936',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.2)',
  },
  heroFallbackText: {
    color: '#5B9CFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  heroFallbackSubtext: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  headerCard: {
    backgroundColor: '#161936',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  agencyBadge: {
    backgroundColor: 'rgba(91, 156, 255, 0.15)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.3)',
  },
  agencyBadgeText: {
    color: '#5B9CFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  trackingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  livePill: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  staticPill: {
    borderColor: 'rgba(91, 156, 255, 0.3)',
    backgroundColor: 'rgba(91, 156, 255, 0.08)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  trackingText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  titleText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  agencyFullName: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#161936',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#5B9CFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  refreshBtn: {
    backgroundColor: 'rgba(91, 156, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  refreshBtnText: {
    color: '#5B9CFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#5B9CFF',
    fontSize: 12,
    marginTop: 8,
  },
  fallbackBox: {
    backgroundColor: '#0b0d1b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  fallbackTitle: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fallbackText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  mapContainer: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.2)',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBadge: {
    backgroundColor: '#5B9CFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 2,
  },
  markerBadgeText: {
    color: '#0b0d1b',
    fontSize: 9,
    fontWeight: 'bold',
  },
  satMarkerIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trajectoryBox: {
    backgroundColor: '#0b0d1b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.15)',
  },
  trajectoryRegion: {
    color: '#5B9CFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  trajectoryDest: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  trajectoryNote: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
    marginRight: 8,
  },
  gridLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gridValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
  },
  objectiveRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  objectiveBullet: {
    color: '#5B9CFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    lineHeight: 18,
  },
  objectiveText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  websiteButton: {
    backgroundColor: '#0b0d1b',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5B9CFF',
    marginTop: 4,
  },
  websiteButtonText: {
    color: '#5B9CFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
