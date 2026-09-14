import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MeteorObject, RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AsteroidDetails'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AsteroidDetailsScreen({ route, navigation }: Props) {
  const { colors, activeTheme } = useTheme();
  const asteroid = route.params?.asteroid;

  if (!asteroid) {
    return (
      <View style={styles.container}>
        <ImageBackground source={require('../../assets/meteor_bg.jpg')} style={styles.background}>
          <View style={[styles.errorContainer, { backgroundColor: colors.overlay }]}>
            <Text style={[styles.errorTitle, { color: colors.critical }]}>Asteroid Data Unavailable</Text>
            <Text style={[styles.errorSub, { color: colors.textSecondary }]}>The requested near-earth object parameters could not be loaded.</Text>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primaryAccent }]} onPress={() => navigation.goBack()}>
              <Text style={[styles.backButtonText, { color: colors.background }]}>Back to Radar Feed</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    );
  }

  const approach = asteroid.current_approach || asteroid.close_approach_data?.[0];
  const isHazardous = asteroid.is_potentially_hazardous_asteroid ?? false;
  const isSentry = asteroid.is_sentry_object ?? false;

  // Threat level score & badge
  const threatScore = asteroid.threatScore || 0;
  let threatLabel = 'Low Threat';
  let threatColor = '#48bb78';
  if (threatScore > 75) {
    threatLabel = 'High Threat';
    threatColor = '#f56565';
  } else if (threatScore > 30) {
    threatLabel = 'Medium Threat';
    threatColor = '#ecc94b';
  }

  // Diameters
  const minKm = asteroid.estimated_diameter?.kilometers?.estimated_diameter_min || 0;
  const maxKm = asteroid.estimated_diameter?.kilometers?.estimated_diameter_max || 0;
  const minMeters = asteroid.estimated_diameter?.meters?.estimated_diameter_min || minKm * 1000;
  const maxMeters = asteroid.estimated_diameter?.meters?.estimated_diameter_max || maxKm * 1000;

  // Distances & Velocities
  const missKmRaw = parseFloat(approach?.miss_distance?.kilometers || '0');
  const missKmFormatted = Math.round(missKmRaw).toLocaleString();
  const missLdRaw = parseFloat(approach?.miss_distance?.lunar || '0');
  const missLdFormatted = missLdRaw > 0 ? missLdRaw.toFixed(1) : (missKmRaw / 384400).toFixed(1);

  const velKmHRaw = parseFloat(approach?.relative_velocity?.kilometers_per_hour || '0');
  const velKmHFormatted = Math.round(velKmHRaw).toLocaleString();
  const velKmSRaw = parseFloat(approach?.relative_velocity?.kilometers_per_second || '0');
  const velKmSFormatted = velKmSRaw > 0 ? velKmSRaw.toFixed(2) : (velKmHRaw / 3600).toFixed(2);

  // Visualization distance scaling for mobile canvas
  // Earth is at center, 1 Lunar Distance (384,400 km) is reference ring radius ~45px
  const maxVisualRadius = (SCREEN_WIDTH - 60) / 2;
  const lunarRadiusPx = 45;
  const normalizedLd = Math.min(Math.max(parseFloat(missLdFormatted) || 1, 0.5), 15);
  // Logarithmic visual mapping so high distances remain visible within canvas bounds
  const asteroidDistancePx = Math.min(
    lunarRadiusPx + Math.log2(normalizedLd + 1) * 22,
    maxVisualRadius - 20
  );

  const openNasaJplLink = () => {
    if (asteroid.nasa_jpl_url) {
      Linking.openURL(asteroid.nasa_jpl_url).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../../assets/meteor_bg.jpg')} style={styles.background}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* HEADER BADGE & TITLE */}
          <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.headerTopRow}>
              <View style={[styles.threatBadge, { backgroundColor: threatColor }]}>
                <Text style={styles.threatBadgeText}>{threatLabel.toUpperCase()}</Text>
              </View>
              <View style={[styles.hazardBadge, isHazardous ? styles.badgeHazardous : styles.badgeSafe]}>
                <Text style={[styles.hazardBadgeText, isHazardous ? styles.textHazardous : styles.textSafe]}>
                  {isHazardous ? 'POTENTIALLY HAZARDOUS' : 'NON-HAZARDOUS'}
                </Text>
              </View>
            </View>

            <Text style={[styles.asteroidTitle, { color: colors.textPrimary }]}>{asteroid.name}</Text>
            <Text style={[styles.asteroidSubtitle, { color: colors.primaryAccent }]}>
              NASA NEO ID: {asteroid.id} {asteroid.absolute_magnitude_h ? `• Absolute Magnitude (H): ${asteroid.absolute_magnitude_h}` : ''}
            </Text>
          </View>

          {/* VISUALIZATION CANVAS */}
          <View style={[styles.visContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.visHeaderRow}>
              <Text style={[styles.visTitle, { color: colors.primaryAccent }]}>CLOSE-APPROACH TRAJECTORY</Text>
              <Text style={[styles.visSubtitle, { color: colors.textMuted }]}>Schematic Scale</Text>
            </View>

            <View style={[styles.canvasContainer, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
              {/* Outer Space Grid Background */}
              <View style={styles.gridOverlay} />

              {/* Lunar Orbit Reference Ring (1 LD / 384,400 km) */}
              <View
                style={[
                  styles.lunarRing,
                  {
                    width: lunarRadiusPx * 2,
                    height: lunarRadiusPx * 2,
                    borderRadius: lunarRadiusPx,
                    borderColor: colors.primaryAccent,
                  },
                ]}
              >
                <Text style={[styles.lunarRingLabel, { color: colors.primaryAccent, backgroundColor: colors.raisedSurface }]}>1 LD</Text>
              </View>

              {/* Close-Approach Hyperbolic Path Line */}
              <View
                style={[
                  styles.trajectoryArc,
                  {
                    width: asteroidDistancePx * 2,
                    height: asteroidDistancePx * 1.5,
                    borderRadius: asteroidDistancePx,
                  },
                ]}
              />

              {/* Earth Central Globe */}
              <View style={styles.earthGlobe}>
                <View style={styles.earthCore} />
                <Text style={styles.earthLabel}>EARTH</Text>
              </View>

              {/* Asteroid Marker on Trajectory */}
              <View
                style={[
                  styles.asteroidMarkerContainer,
                  {
                    transform: [
                      { translateX: asteroidDistancePx * 0.75 },
                      { translateY: -asteroidDistancePx * 0.5 },
                    ],
                  },
                ]}
              >
                <View style={[styles.asteroidDot, isHazardous && styles.asteroidDotHazardous]} />
                <View style={[styles.asteroidLabelBadge, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.asteroidLabelText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {asteroid.name}
                  </Text>
                  <Text style={[styles.asteroidDistanceSub, { color: colors.primaryAccent }]}>{missLdFormatted} LD</Text>
                </View>
              </View>
            </View>

            {/* Distance & Velocity Telemetry Bar */}
            <View style={[styles.visFooterBar, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
              <View style={styles.visFooterItem}>
                <Text style={[styles.visFooterLabel, { color: colors.textMuted }]}>Miss Distance</Text>
                <Text style={[styles.visFooterValue, { color: colors.textPrimary }]}>{missKmFormatted} km</Text>
                <Text style={[styles.visFooterSub, { color: colors.primaryAccent }]}>({missLdFormatted} Lunar Distances)</Text>
              </View>
              <View style={[styles.visFooterDivider, { backgroundColor: colors.surfaceBorder }]} />
              <View style={styles.visFooterItemRight}>
                <Text style={[styles.visFooterLabel, { color: colors.textMuted }]}>Relative Speed</Text>
                <Text style={[styles.visFooterValue, { color: colors.textPrimary }]}>{velKmHFormatted} km/h</Text>
                <Text style={[styles.visFooterSub, { color: colors.primaryAccent }]}>({velKmSFormatted} km/s)</Text>
              </View>
            </View>
          </View>

          {/* PHYSICAL CHARACTERISTICS GRID */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>PHYSICAL CHARACTERISTICS</Text>

            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Est. Diameter (Meters)</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>
                  {Math.round(minMeters)} m - {Math.round(maxMeters)} m
                </Text>
              </View>

              <View style={styles.gridColRight}>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Est. Diameter (Km)</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>
                  {minKm.toFixed(2)} - {maxKm.toFixed(2)} km
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Absolute Magnitude (H)</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>
                  {asteroid.absolute_magnitude_h !== undefined ? asteroid.absolute_magnitude_h : 'N/A'}
                </Text>
              </View>

              <View style={styles.gridColRight}>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Sentry Object Status</Text>
                <Text style={[styles.gridValue, isSentry ? styles.textHazardous : styles.textSafe]}>
                  {isSentry ? 'ACTIVE SENTRY' : 'NO SENTRY RISK'}
                </Text>
              </View>
            </View>
          </View>

          {/* CLOSE APPROACH SPECIFICATIONS */}
          {approach && (
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>CLOSE APPROACH TELEMETRY</Text>

              <View style={[styles.specRow, { borderBottomColor: colors.surfaceBorder }]}>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Close-Approach Date</Text>
                <Text style={[styles.specValueHighlight, { color: colors.primaryAccent }]}>
                  {approach.close_approach_date_full || approach.close_approach_date || 'N/A'}
                </Text>
              </View>

              <View style={[styles.specRow, { borderBottomColor: colors.surfaceBorder }]}>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Miss Distance (Lunar)</Text>
                <Text style={[styles.specValue, { color: colors.textPrimary }]}>{missLdFormatted} LD</Text>
              </View>

              <View style={[styles.specRow, { borderBottomColor: colors.surfaceBorder }]}>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Miss Distance (Km)</Text>
                <Text style={[styles.specValue, { color: colors.textPrimary }]}>{missKmFormatted} km</Text>
              </View>

              {approach.miss_distance?.astronomical && (
                <View style={[styles.specRow, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Miss Distance (AU)</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {parseFloat(approach.miss_distance.astronomical).toFixed(4)} AU
                  </Text>
                </View>
              )}

              <View style={[styles.specRow, { borderBottomColor: colors.surfaceBorder }]}>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Relative Velocity</Text>
                <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                  {velKmHFormatted} km/h ({velKmSFormatted} km/s)
                </Text>
              </View>

              <View style={[styles.specRow, { borderBottomColor: colors.surfaceBorder }]}>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Orbiting Celestial Body</Text>
                <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                  {approach.orbiting_body || 'Earth'}
                </Text>
              </View>
            </View>
          )}

          {/* UPCOMING CLOSE APPROACHES */}
          {asteroid.close_approach_data && asteroid.close_approach_data.length > 1 && (
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>RECORDED CLOSE APPROACHES ({asteroid.close_approach_data.length})</Text>
              {asteroid.close_approach_data.slice(0, 5).map((cad, idx) => {
                const dateStr = cad.close_approach_date_full || cad.close_approach_date || 'N/A';
                const cadKm = cad.miss_distance?.kilometers
                  ? Math.round(parseFloat(cad.miss_distance.kilometers)).toLocaleString()
                  : 'N/A';
                const cadLd = cad.miss_distance?.lunar
                  ? parseFloat(cad.miss_distance.lunar).toFixed(1)
                  : 'N/A';

                return (
                  <View key={idx} style={[styles.approachListItem, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                    <View style={styles.approachListHeader}>
                      <Text style={[styles.approachListDate, { color: colors.textPrimary }]}>{dateStr}</Text>
                      <Text style={[styles.approachListBody, { color: colors.primaryAccent }]}>{cad.orbiting_body || 'Earth'}</Text>
                    </View>
                    <Text style={[styles.approachListSub, { color: colors.textMuted }]}>
                      Miss Distance: {cadKm} km ({cadLd} LD)
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ORBITAL PARAMETERS (IF NASA ORBITAL_DATA PRESENT) */}
          {asteroid.orbital_data && (
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>ORBITAL MECHANICS (JPL)</Text>

              {asteroid.orbital_data.orbit_class?.orbit_class_type && (
                <View style={[styles.specRow, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Orbit Class</Text>
                  <Text style={[styles.specValueHighlight, { color: colors.primaryAccent }]}>
                    {asteroid.orbital_data.orbit_class.orbit_class_type} ({asteroid.orbital_data.orbit_class.orbit_class_description || ''})
                  </Text>
                </View>
              )}

              {asteroid.orbital_data.eccentricity && (
                <View style={[styles.specRow, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Eccentricity (e)</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>{parseFloat(asteroid.orbital_data.eccentricity).toFixed(4)}</Text>
                </View>
              )}

              {asteroid.orbital_data.inclination && (
                <View style={[styles.specRow, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Inclination (i)</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>{parseFloat(asteroid.orbital_data.inclination).toFixed(2)}°</Text>
                </View>
              )}

              {asteroid.orbital_data.orbital_period && (
                <View style={[styles.specRow, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Orbital Period</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>{Math.round(parseFloat(asteroid.orbital_data.orbital_period))} days</Text>
                </View>
              )}
            </View>
          )}

          {/* NASA JPL WEB BUTTON */}
          {asteroid.nasa_jpl_url && (
            <TouchableOpacity style={[styles.jplButton, { backgroundColor: colors.surface, borderColor: colors.primaryAccent }]} onPress={openNasaJplLink} activeOpacity={0.8}>
              <Text style={[styles.jplButtonText, { color: colors.primaryAccent }]}>View Official NASA JPL Small-Body Database &rarr;</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#ff4d4d',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorSub: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#5B9CFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#0b0d1b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerCard: {
    backgroundColor: '#161936',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.3)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  threatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  threatBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hazardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeHazardous: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  badgeSafe: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
  },
  hazardBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  textHazardous: {
    color: '#ef4444',
  },
  textSafe: {
    color: '#22c55e',
  },
  asteroidTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  asteroidSubtitle: {
    color: '#5B9CFF',
    fontSize: 12,
    fontWeight: '600',
  },
  visContainer: {
    backgroundColor: '#161936',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  visHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  visTitle: {
    color: '#5B9CFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  visSubtitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  canvasContainer: {
    height: 220,
    backgroundColor: '#0b0d1b',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.2)',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  lunarRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.35)',
    borderStyle: 'dashed',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  lunarRingLabel: {
    color: '#5B9CFF',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
    backgroundColor: '#0b0d1b',
    paddingHorizontal: 4,
  },
  trajectoryArc: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(236, 201, 75, 0.5)',
    borderStyle: 'solid',
  },
  earthGlobe: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00b4d8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 4,
  },
  earthCore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0077b6',
  },
  earthLabel: {
    position: 'absolute',
    bottom: -16,
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  asteroidMarkerContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
  },
  asteroidDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ecc94b',
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 6,
  },
  asteroidDotHazardous: {
    backgroundColor: '#ef4444',
  },
  asteroidLabelBadge: {
    backgroundColor: 'rgba(11, 13, 27, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  asteroidLabelText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    maxWidth: 90,
  },
  asteroidDistanceSub: {
    color: '#5B9CFF',
    fontSize: 8,
    fontWeight: '600',
  },
  visFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0b0d1b',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  visFooterItem: {
    flex: 1,
  },
  visFooterItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  visFooterDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  visFooterLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  visFooterValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  visFooterSub: {
    color: '#5B9CFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  sectionCard: {
    backgroundColor: '#161936',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    color: '#5B9CFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  gridColRight: {
    flex: 1,
    alignItems: 'flex-end',
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
    fontWeight: 'bold',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  specLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
  },
  specValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  specValueHighlight: {
    color: '#5B9CFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  approachListItem: {
    backgroundColor: '#0b0d1b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  approachListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  approachListDate: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  approachListBody: {
    color: '#5B9CFF',
    fontSize: 11,
    fontWeight: '600',
  },
  approachListSub: {
    color: '#94a3b8',
    fontSize: 11,
  },
  jplButton: {
    backgroundColor: '#161936',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5B9CFF',
    marginTop: 4,
  },
  jplButtonText: {
    color: '#5B9CFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
