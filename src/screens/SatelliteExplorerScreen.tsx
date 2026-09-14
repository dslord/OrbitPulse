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
import { useTheme } from '../context/ThemeContext';
import {
  calculateOrbitalVisualization,
} from '../services/satelliteService';
import { SatelliteCategory, SatelliteItem } from '../types';

const CATEGORIES: { id: SatelliteCategory; label: string }[] = [
  { id: 'visual', label: 'Brightest' },
  { id: 'stations', label: 'Stations' },
  { id: 'weather', label: 'Weather' },
  { id: 'resource', label: 'Science' },
];

const ORBIT_ARROW_AHEAD_SECONDS = 50;

export default function SatelliteExplorerScreen() {
  const { colors, activeTheme } = useTheme();
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
        <View style={[styles.controlHeader, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder, borderBottomWidth: 1 }]}>
          <View style={[styles.searchContainer, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search satellite by name or NORAD ID..."
              placeholderTextColor={colors.textMuted}
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
                <Text style={[styles.clearSearchText, { color: colors.textMuted }]}>✕</Text>
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
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.selectedSurface : colors.raisedSurface,
                      borderColor: active ? colors.selectedIndicator : colors.surfaceBorder,
                    },
                  ]}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? colors.selectedIndicator : colors.textMuted, fontWeight: active ? 'bold' : '600' },
                    ]}
                  >
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
            <ActivityIndicator size="large" color={colors.primaryAccent} />
            <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Fetching Orbital Telemetry...</Text>
          </View>
        )}

        {/* Error View */}
        {error && !selectedSatellite && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorTitle}>Signal Disrupted</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primaryAccent }]} onPress={refetch}>
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Explorer Content */}
        {!loading && !error && (
          <View style={[styles.contentBody, { backgroundColor: colors.background }]}>
            {/* MapLibre Map View */}
            <View style={[styles.mapContainer, { borderColor: colors.surfaceBorder, borderWidth: 1 }]}>
              {orbitalState ? (
                <MapLibreGL.MapView
                  style={styles.mapView}
                  mapStyle={activeTheme === 'light' ? 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'}
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
                            lineColor: colors.primaryAccent,
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
                            <Text style={[styles.arrowSymbol, { color: colors.primaryAccent }]}>▲</Text>
                          </View>
                        </View>
                      </MapLibreGL.MarkerView>
                    )}

                    {/* Selected Satellite Position Marker */}
                    <MapLibreGL.MarkerView
                      id={`sat-marker-${orbitalState.satId}`}
                      coordinate={[
                        orbitalState.currentPos.longitude,
                        orbitalState.currentPos.latitude,
                      ]}
                    >
                      <View style={styles.markerContainer}>
                        <View style={[styles.markerBadge, { backgroundColor: colors.surface, borderColor: colors.primaryAccent }]}>
                          <Text style={[styles.markerBadgeText, { color: colors.primaryAccent }]} numberOfLines={1}>
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
                <View style={[styles.noPositionBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.noPositionText, { color: colors.textMuted }]}>
                    Position calculations unavailable for selected satellite.
                  </Text>
                </View>
              )}
            </View>

            {/* Selected Satellite Telemetry Overlay Panel */}
            {selectedSatellite && orbitalState && (
              <View style={[styles.telemetryOverlay, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderBottomWidth: 1 }]}>
                <View style={styles.telemetryHeaderRow}>
                  <View style={styles.telemetryTitleBox}>
                    <Text style={[styles.satelliteNameText, { color: colors.textPrimary }]} numberOfLines={1}>
                      {orbitalState.satName}
                    </Text>
                    <Text style={[styles.satelliteMetaText, { color: colors.textMuted }]}>
                      NORAD #{orbitalState.noradId} | {orbitalState.designator}
                    </Text>
                  </View>
                  <Text style={[styles.liveBadge, { color: colors.primaryAccent, backgroundColor: colors.raisedSurface }]}>
                    {formatFreshnessLabel({ source, cachedAt, lastUpdated, prefix: 'GP Data' })}
                  </Text>
                </View>

                <View style={styles.telemetryGrid}>
                  <View style={[styles.telemetryItem, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>Latitude</Text>
                    <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={1}>
                      {orbitalState.currentPos.latitude.toFixed(3)}°
                    </Text>
                  </View>
                  <View style={[styles.telemetryItem, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>Longitude</Text>
                    <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={1}>
                      {orbitalState.currentPos.longitude.toFixed(3)}°
                    </Text>
                  </View>
                  <View style={[styles.telemetryItem, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>Altitude</Text>
                    <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={1}>
                      {Math.round(orbitalState.currentPos.altitudeKm)} km
                    </Text>
                  </View>
                  <View style={[styles.telemetryItem, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>Velocity</Text>
                    <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={1}>
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
            <View style={[styles.listContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.listHeader}>
                <Text style={[styles.listTitle, { color: colors.textPrimary }]}>
                  Satellites Catalog ({filteredSatellites.length})
                </Text>
              </View>

              {filteredSatellites.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No satellites match "{searchQuery}"</Text>
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
                          {
                            backgroundColor: isSelected ? colors.selectedSurface : colors.raisedSurface,
                            borderColor: isSelected ? colors.selectedIndicator : colors.surfaceBorder,
                          },
                        ]}
                        onPress={() => setSelectedSatId(item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.cardInfo}>
                          <Text
                            style={[
                              styles.cardName,
                              { color: isSelected ? colors.selectedIndicator : colors.textPrimary },
                            ]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                            NORAD: {item.noradId} | {item.designator}
                          </Text>
                        </View>
                        {item.position && (
                          <View style={styles.cardCoords}>
                            <Text style={[styles.coordText, { color: colors.textSecondary }]}>
                              {item.position.latitude.toFixed(3)}°,{' '}
                              {item.position.longitude.toFixed(3)}°
                            </Text>
                            <Text style={[styles.altText, { color: colors.textMuted }]}>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  chip: {
    flex: 1,
    height: 36,
    marginHorizontal: 3,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
  },
  chipActive: {},
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
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
    color: '#5B9CFF',
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
    backgroundColor: '#5B9CFF',
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
    borderColor: '#5B9CFF',
    marginBottom: 4,
  },
  markerBadgeText: {
    color: '#5B9CFF',
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
    color: '#5B9CFF',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
    textAlign: 'center',
  },
  telemetryOverlay: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  satelliteMetaText: {
    fontSize: 11,
    marginTop: 2,
  },
  liveBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cacheBadge: {},
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  telemetryItem: {
    flex: 1,
    minWidth: 0,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginHorizontal: 2,
    borderWidth: 1,
  },
  label: {
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  listHeader: {
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  listScrollContent: {
    paddingBottom: 24,
  },
  satelliteCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  satelliteCardSelected: {},
  cardInfo: {
    flex: 1,
    paddingRight: 10,
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardNameSelected: {},
  cardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  cardCoords: {
    alignItems: 'flex-end',
  },
  coordText: {
    fontSize: 12,
    fontWeight: '600',
  },
  altText: {
    fontSize: 10,
    marginTop: 2,
  },
});
