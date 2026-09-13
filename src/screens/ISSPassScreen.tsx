import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { calculateISSPasses, calculatePassCountdown } from '../services/issPassService';
import { ISSPassItem, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ISSPass'>;

export default function ISSPassScreen({ navigation }: Props) {
  const [location, setLocation] = useState<{ lat: number; lon: number; altKm: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [passes, setPasses] = useState<ISSPassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // 1-Second interval ticker for dynamic countdown update
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPassData = useCallback(async () => {
    try {
      setError(null);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermission(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setLocationPermission(true);

      // Get user current GPS coordinates
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = currentLoc.coords.latitude;
      const lon = currentLoc.coords.longitude;
      const altKm = (currentLoc.coords.altitude || 0) / 1000;

      setLocation({ lat, lon, altKm });

      // Calculate observer-specific ISS passes
      const passResults = await calculateISSPasses(lat, lon, altKm, 3);
      setPasses(passResults);
    } catch (err: any) {
      setError(err.message || 'Failed to acquire location or calculate ISS passes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPassData();
  }, [fetchPassData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPassData();
  }, [fetchPassData]);

  const heroPass = passes.length > 0 ? passes[0] : null;
  const subsequentPasses = passes.length > 1 ? passes.slice(1) : [];

  const renderPassCard = ({ item, index }: { item: ISSPassItem; index: number }) => {
    const startDateFormatted = new Date(item.startTime).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isVisible = item.visibility === 'Visible';

    return (
      <View style={styles.passListCard}>
        <View style={styles.passListHeader}>
          <Text style={styles.passListDate}>{startDateFormatted}</Text>
          <View
            style={[
              styles.visibilityBadgeSmall,
              isVisible ? styles.badgeVisible : styles.badgeDefault,
            ]}
          >
            <Text style={[styles.badgeTextSmall, isVisible && styles.badgeTextVisible]}>
              {item.visibility.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.passListRow}>
          <View style={styles.passListItem}>
            <Text style={styles.passListLabel}>Peak Time</Text>
            <Text style={styles.passListValue}>
              {new Date(item.peakTime).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.passListItem}>
            <Text style={styles.passListLabel}>Max Elevation</Text>
            <Text style={styles.passListValue}>{item.maxElevation}°</Text>
          </View>

          <View style={styles.passListItemRight}>
            <Text style={styles.passListLabel}>Direction</Text>
            <Text style={styles.passListValue}>{item.directionSummary}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/bg_image.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Permission Denied View */}
        {locationPermission === false && !loading && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorTitle}>Location Access Required</Text>
            <Text style={styles.errorText}>
              ISS Next-Pass predictions require your device location to calculate when the Space Station will rise above your horizon.
            </Text>
            <TouchableOpacity style={styles.actionButton} onPress={fetchPassData}>
              <Text style={styles.actionButtonText}>Grant Location Permission</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading View */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00d4ff" />
            <Text style={styles.loadingText}>Acquiring Location & Propagating Orbit...</Text>
          </View>
        )}

        {/* Error View */}
        {error && !loading && locationPermission !== false && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorTitle}>Calculation Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.actionButton} onPress={onRefresh}>
              <Text style={styles.actionButtonText}>Retry Calculation</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        {!loading && !error && locationPermission && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#00d4ff"
                colors={['#00d4ff']}
              />
            }
          >
            {/* Observer Location Badge */}
            {location && (
              <View style={styles.locationBanner}>
                <Text style={styles.locationLabel}>OBSERVER LOCATION</Text>
                <Text style={styles.locationCoords}>
                  {location.lat.toFixed(2)}° N, {location.lon.toFixed(2)}° E
                </Text>
              </View>
            )}

            {/* HERO NEXT PASS CARD */}
            {heroPass ? (
              <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                  <Text style={styles.heroTitle}>NEXT ISS PASS</Text>
                  <View
                    style={[
                      styles.visibilityBadge,
                      heroPass.visibility === 'Visible' ? styles.badgeVisible : styles.badgeDefault,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        heroPass.visibility === 'Visible' && styles.badgeTextVisible,
                      ]}
                    >
                      {heroPass.visibility.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Dynamic Countdown Banner */}
                <View style={styles.countdownBanner}>
                  <Text style={styles.countdownLabel}>COUNTDOWN</Text>
                  <Text
                    style={[
                      styles.countdownValue,
                      calculatePassCountdown(heroPass.startTime, nowMs).isLive && styles.countdownValueLive,
                    ]}
                  >
                    {calculatePassCountdown(heroPass.startTime, nowMs).countdownText}
                  </Text>
                </View>

                {/* Times Grid */}
                <View style={styles.specGrid}>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Starts</Text>
                    <Text style={styles.specValue}>
                      {new Date(heroPass.startTime).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>
                  </View>

                  <View style={styles.specItemCenter}>
                    <Text style={styles.specLabel}>Peaks</Text>
                    <Text style={styles.specValueHighlight}>
                      {new Date(heroPass.peakTime).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>
                  </View>

                  <View style={styles.specItemRight}>
                    <Text style={styles.specLabel}>Ends</Text>
                    <Text style={styles.specValue}>
                      {new Date(heroPass.endTime).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Elevation & Trajectory Row */}
                <View style={styles.specGrid}>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Max Elevation</Text>
                    <Text style={styles.specValue}>{heroPass.maxElevation}°</Text>
                  </View>

                  <View style={styles.specItemRight}>
                    <Text style={styles.specLabel}>Trajectory</Text>
                    <Text style={styles.specValue}>{heroPass.directionSummary}</Text>
                  </View>
                </View>

                <Text style={styles.visibilityNote}>{heroPass.visibilityDetails}</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Passes Detected</Text>
                <Text style={styles.emptySub}>
                  No visible ISS passes predicted over your location for the next 3 days.
                </Text>
              </View>
            )}

            {/* SUBSEQUENT PASSES LIST */}
            {subsequentPasses.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>UPCOMING PASSES (3 DAYS)</Text>
                {subsequentPasses.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {renderPassCard({ item, index: idx })}
                  </React.Fragment>
                ))}
              </View>
            )}
          </ScrollView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#00d4ff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 14,
  },
  errorTitle: {
    color: '#ff4d4d',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#0b0d1b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  locationBanner: {
    backgroundColor: 'rgba(11, 13, 27, 0.85)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  locationLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  locationCoords: {
    color: '#00d4ff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  heroCard: {
    backgroundColor: '#161936',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00d4ff',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  visibilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  visibilityBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeVisible: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
  },
  badgeDefault: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  badgeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeTextSmall: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeTextVisible: {
    color: '#22c55e',
  },
  countdownBanner: {
    backgroundColor: '#0b0d1b',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
  },
  countdownLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countdownValue: {
    color: '#00d4ff',
    fontSize: 18,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  countdownValueLive: {
    color: '#22c55e',
  },
  specGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  specItem: {
    flex: 1,
  },
  specItemCenter: {
    flex: 1,
    alignItems: 'center',
  },
  specItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  specLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  specValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  specValueHighlight: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  visibilityNote: {
    color: '#94a3b8',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 10,
  },
  sectionContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    color: '#00d4ff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  passListCard: {
    backgroundColor: '#161936',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  passListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  passListDate: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  passListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passListItem: {
    flex: 1,
  },
  passListItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  passListLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  passListValue: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
});
