import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useSatelliteExplorer } from '../hooks/useSatelliteExplorer';
import { formatFreshnessLabel } from '../utils/timeUtils';
import {
  calculateOrbitalVisualization,
} from '../services/satelliteService';
import { SatelliteCategory, SatelliteItem } from '../types';

const CATEGORIES: { id: SatelliteCategory; label: string }[] = [
  { id: 'visual', label: '⭐ Brightest' },
  { id: 'stations', label: '🛸 Stations' },
  { id: 'weather', label: '🛰️ Weather' },
  { id: 'resource', label: '🌍 Science' },
];

const ORBIT_ARROW_AHEAD_SECONDS = 50;

export default function SatelliteExplorerScreen() {
  const {
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
    selectedSatellite,
    setSelectedSatId,
    filteredSatellites,
    loading,
    error,
    source,
    cachedAt,
    lastUpdated,
    refetch,
  } = useSatelliteExplorer('visual');

  // Compute unified orbital state atomically for the currently selected satellite using shared pipeline
  const orbitalState = useMemo(() => {
    if (!selectedSatellite?.gpData) return null;

    const refTime = lastUpdated || Date.now();
    const vis = calculateOrbitalVisualization(
      selectedSatellite.gpData,
      refTime,
      `sat-orbit-${selectedSatellite.id}`,
      ORBIT_ARROW_AHEAD_SECONDS
    );

    if (!vis) return null;

    return {
      satId: selectedSatellite.id,
      satName: selectedSatellite.name,
      noradId: selectedSatellite.noradId,
      designator: selectedSatellite.designator,
      currentPos: vis.currentPos,
      trailGeoJson: vis.trailGeoJson,
      arrowInfo: vis.arrowInfo,
    };
  }, [selectedSatellite, lastUpdated]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Header Search & Category Filter */}
        <View style={styles.controlHeader}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search satellite by name or NORAD ID..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Chips */}
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => {
              const active = cat.id === category;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Loading View */}
        {loading && !selectedSatellite && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00d4ff" />
            <Text style={styles.loadingText}>Fetching Orbital Telemetry...</Text>
          </View>
        )}

        {/* Error View */}
        {error && !selectedSatellite && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorTitle}>Signal Disrupted</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Explorer Content */}
        {!loading && !error && (
          <View style={styles.contentBody}>
            {/* MapLibre Map View */}
            <View style={styles.mapContainer}>
              {orbitalState ? (
                <MapLibreGL.MapView
                  style={styles.mapView}
                  mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                  logoEnabled={false}
                  attributionEnabled={true}
                  attributionPosition={{ bottom: 6, right: 6 }}
                >
                  <React.Fragment key={`sat-view-${orbitalState.satId}`}>
                    <MapLibreGL.Camera
                      zoomLevel={2.5}
                      centerCoordinate={[
                        orbitalState.currentPos.longitude,
                        orbitalState.currentPos.latitude,
                      ]}
                      animationMode="easeTo"
                      animationDuration={1000}
                    />

                    {/* Calculated Orbital Trail LineLayer */}
                    {orbitalState.trailGeoJson.features.length > 0 && (
                      <MapLibreGL.ShapeSource
                        id={`sat-orbit-source-${orbitalState.satId}`}
                        shape={orbitalState.trailGeoJson}
                      >
                        <MapLibreGL.LineLayer
                          id={`sat-orbit-line-${orbitalState.satId}`}
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

                    {/* Directional Arrow directly on orbital line 50s ahead */}
                    {orbitalState.arrowInfo && (
                      <MapLibreGL.MarkerView
                        id={`sat-arrow-${orbitalState.satId}`}
                        coordinate={orbitalState.arrowInfo.arrowPos}
                      >
                        <View style={styles.arrowMarkerBox}>
                          <View
                            style={{
                              transform: [
                                { rotate: `${orbitalState.arrowInfo.bearing}deg` },
                              ],
                            }}
                          >
                            <Text style={styles.arrowSymbol}>▲</Text>
                          </View>
                        </View>
                      </MapLibreGL.MarkerView>
                    )}

                    {/* Selected Satellite Position Marker (Reusing ISS Icon & Preserved Name Badge) */}
                    <MapLibreGL.MarkerView
                      id={`sat-marker-${orbitalState.satId}`}
                      coordinate={[
                        orbitalState.currentPos.longitude,
                        orbitalState.currentPos.latitude,
                      ]}
                    >
                      <View style={styles.markerContainer}>
                        <View style={styles.markerBadge}>
                          <Text style={styles.markerBadgeText} numberOfLines={1}>
                            {orbitalState.satName}
                          </Text>
                        </View>
                        <Image
                          source={require('../../assets/iss_icon.png')}
                          style={styles.satMarkerIcon}
                        />
                      </View>
                    </MapLibreGL.MarkerView>
                  </React.Fragment>
                </MapLibreGL.MapView>
              ) : (
                <View style={styles.noPositionBox}>
                  <Text style={styles.noPositionText}>
                    Position calculations unavailable for selected satellite.
                  </Text>
                </View>
              )}
            </View>

            {/* Selected Satellite Telemetry Overlay */}
            {selectedSatellite && orbitalState && (
              <View style={styles.telemetryOverlay}>
                <View style={styles.telemetryHeaderRow}>
                  <View style={styles.telemetryTitleBox}>
                    <Text style={styles.satelliteNameText} numberOfLines={1}>
                      {orbitalState.satName}
                    </Text>
                    <Text style={styles.satelliteMetaText}>
                      NORAD #{orbitalState.noradId} | {orbitalState.designator}
                    </Text>
                  </View>
                  <Text style={[styles.liveBadge, source === 'cache' && styles.cacheBadge]}>
                    {formatFreshnessLabel({ source, cachedAt, lastUpdated, prefix: 'GP Data' })}
                  </Text>
                </View>

                <View style={styles.telemetryGrid}>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.label}>Latitude</Text>
                    <Text style={styles.value} numberOfLines={1}>
                      {orbitalState.currentPos.latitude.toFixed(3)}°
                    </Text>
                  </View>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.label}>Longitude</Text>
                    <Text style={styles.value} numberOfLines={1}>
                      {orbitalState.currentPos.longitude.toFixed(3)}°
                    </Text>
                  </View>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.label}>Altitude</Text>
                    <Text style={styles.value} numberOfLines={1}>
                      {Math.round(orbitalState.currentPos.altitudeKm)} km
                    </Text>
                  </View>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.label}>Velocity</Text>
                    <Text style={styles.value} numberOfLines={1}>
                      {Math.round(orbitalState.currentPos.velocityKmH).toLocaleString(
                        'en-US'
                      )}{' '}
                      km/h
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Scrollable Satellite Catalog List */}
            <View style={styles.listContainer}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>
                  Satellites Catalog ({filteredSatellites.length})
                </Text>
              </View>

              {filteredSatellites.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No satellites match "{searchQuery}"</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredSatellites}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }: { item: SatelliteItem }) => {
                    const isSelected = item.id === selectedSatellite?.id;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.satelliteCard,
                          isSelected && styles.satelliteCardSelected,
                        ]}
                        onPress={() => setSelectedSatId(item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.cardInfo}>
                          <Text
                            style={[
                              styles.cardName,
                              isSelected && styles.cardNameSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <Text style={styles.cardSub}>
                            NORAD: {item.noradId} | {item.designator}
                          </Text>
                        </View>
                        {item.position && (
                          <View style={styles.cardCoords}>
                            <Text style={styles.coordText}>
                              {item.position.latitude.toFixed(3)}°,{' '}
                              {item.position.longitude.toFixed(3)}°
                            </Text>
                            <Text style={styles.altText}>
                              {Math.round(item.position.altitudeKm)} km
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={styles.listScrollContent}
                  showsVerticalScrollIndicator={true}
                />
              )}
            </View>
          </View>
        )}
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
  controlHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(11, 13, 27, 0.9)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161936',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#ffffff',
    fontSize: 14,
  },
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  chip: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#161936',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: '#00d4ff',
    borderColor: '#00d4ff',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  chipTextActive: {
    color: '#0b0d1b',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  errorTitle: {
    color: '#ff4d4d',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryText: {
    color: '#0b0d1b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  contentBody: {
    flex: 1,
  },
  mapContainer: {
    height: 220,
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  noPositionBox: {
    flex: 1,
    backgroundColor: '#161936',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noPositionText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  satMarkerIcon: {
    width: 44,
    height: 32,
    resizeMode: 'contain',
  },
  markerBadge: {
    backgroundColor: '#0b0d1b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00d4ff',
    marginBottom: 4,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  markerBadgeText: {
    color: '#00d4ff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
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
  telemetryOverlay: {
    backgroundColor: '#0b0d1b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.15)',
  },
  telemetryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  telemetryTitleBox: {
    flex: 1,
    marginRight: 8,
  },
  satelliteNameText: {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  satelliteMetaText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  liveBadge: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cacheBadge: {
    color: '#eab308',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  telemetryItem: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#161936',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
  },
  label: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  value: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'rgba(11, 13, 27, 0.8)',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  listHeader: {
    marginBottom: 8,
  },
  listTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  listScrollContent: {
    paddingBottom: 24,
  },
  satelliteCard: {
    backgroundColor: '#161936',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  satelliteCardSelected: {
    borderColor: '#00d4ff',
    backgroundColor: '#1d224a',
  },
  cardInfo: {
    flex: 1,
    paddingRight: 10,
  },
  cardName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardNameSelected: {
    color: '#00d4ff',
  },
  cardSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  cardCoords: {
    alignItems: 'flex-end',
  },
  coordText: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '600',
  },
  altText: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
});
