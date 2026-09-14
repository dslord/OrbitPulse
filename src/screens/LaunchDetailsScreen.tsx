import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { calculateLaunchCountdown } from '../services/launchService';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'LaunchDetails'>;

export default function LaunchDetailsScreen({ route }: Props) {
  const { colors, activeTheme } = useTheme();
  const { launch } = route.params;
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [imageError, setImageError] = useState<boolean>(false);
  const [isPreparing, setIsPreparing] = useState<boolean>(!!launch.imageUrl);

  // Dynamic countdown ticker every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Image prefetch & loading preparation
  useEffect(() => {
    if (!launch.imageUrl) {
      setIsPreparing(false);
      return;
    }

    let isMounted = true;
    // Fast safety timeout guard (max 1.2s) so user is never kept waiting long
    const timeoutTimer = setTimeout(() => {
      if (isMounted) setIsPreparing(false);
    }, 1200);

    Image.prefetch(launch.imageUrl)
      .then(() => {
        if (isMounted) {
          clearTimeout(timeoutTimer);
          setIsPreparing(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          clearTimeout(timeoutTimer);
          setIsPreparing(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timeoutTimer);
    };
  }, [launch.imageUrl]);

  const countdown = calculateLaunchCountdown(launch.net, nowMs);

  const utcDate = new Date(launch.net).toUTCString();
  const localDate = new Date(launch.net).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const handleOpenWebcast = async () => {
    if (!launch.webcastUrl) return;
    try {
      const supported = await Linking.canOpenURL(launch.webcastUrl);
      if (supported) {
        await Linking.openURL(launch.webcastUrl);
      } else {
        Alert.alert('Unable to open link', `Cannot open URL: ${launch.webcastUrl}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not open webcast URL');
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/bg_image.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {isPreparing ? (
          <View style={[styles.loadingContainer, { backgroundColor: colors.overlay }]}>
            <Text style={[styles.loadingBrand, { color: colors.textPrimary }]}>OrbitPulse</Text>
            <ActivityIndicator size="large" color={colors.primaryAccent} style={styles.loader} />
            <Text style={[styles.loadingText, { color: colors.primaryAccent }]}>Loading launch details...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Mission Image Header */}
            {launch.imageUrl && !imageError ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: launch.imageUrl }}
                  style={styles.headerImage}
                  onError={() => setImageError(true)}
                />
                <View style={styles.imageOverlay} />
              </View>
            ) : null}

            {/* Launch Name & Provider Header */}
            <View style={[styles.headerCard, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
              <View style={styles.badgeRow}>
                <View style={[styles.providerBadge, { backgroundColor: colors.primaryAccent }]}>
                  <Text style={[styles.providerText, { color: colors.background }]}>{launch.providerName}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    countdown.isPastOrLive && styles.statusBadgeLive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      countdown.isPastOrLive && styles.statusTextLive,
                    ]}
                  >
                    {launch.statusName.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={[styles.launchTitle, { color: colors.textPrimary }]}>{launch.name}</Text>
            </View>

            {/* Dynamic Countdown Banner */}
            <View style={[styles.countdownBanner, { backgroundColor: colors.surface, borderColor: colors.primaryAccent }]}>
              <Text style={[styles.countdownTitle, { color: colors.textMuted }]}>COUNTDOWN TO LAUNCH</Text>
              <Text
                style={[
                  styles.countdownText,
                  { color: countdown.isPastOrLive ? '#22c55e' : colors.primaryAccent },
                ]}
              >
                {countdown.countdownText}
              </Text>
            </View>

            {/* Webcast Action Button */}
            {launch.webcastUrl && (
              <TouchableOpacity
                style={styles.webcastButton}
                onPress={handleOpenWebcast}
                activeOpacity={0.8}
              >
                <Text style={styles.webcastButtonText}>Watch Live Webcast</Text>
              </TouchableOpacity>
            )}

            {/* Details Metadata Grid */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>Launch Specifications</Text>

              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Rocket Vehicle</Text>
                  <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{launch.rocketName}</Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Mission Type</Text>
                  <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{launch.missionType}</Text>
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Launch Pad</Text>
                  <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{launch.padName}</Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Location</Text>
                  <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{launch.locationName}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

              <View style={styles.timeBlock}>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Local Time</Text>
                <Text style={[styles.timeValue, { color: colors.textPrimary }]}>{localDate}</Text>

                <Text style={[styles.gridLabel, { marginTop: 8, color: colors.textMuted }]}>UTC Time</Text>
                <Text style={[styles.timeValue, { color: colors.textPrimary }]}>{utcDate}</Text>
              </View>
            </View>

            {/* Mission Overview / Description */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>Mission Overview</Text>
              <Text style={[styles.missionText, { color: colors.textSecondary }]}>{launch.missionDescription}</Text>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(11, 13, 27, 0.95)',
  },
  loadingBrand: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 212, 255, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  loader: {
    marginVertical: 20,
  },
  loadingText: {
    color: '#5B9CFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 13, 27, 0.4)',
  },
  headerCard: {
    padding: 20,
    backgroundColor: 'rgba(22, 25, 54, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(91, 156, 255, 0.2)',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  providerBadge: {
    backgroundColor: '#5B9CFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  providerText: {
    color: '#0b0d1b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeLive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusTextLive: {
    color: '#22c55e',
  },
  launchTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  countdownBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: '#161936',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5B9CFF',
  },
  countdownTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  countdownText: {
    color: '#5B9CFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  countdownTextLive: {
    color: '#22c55e',
  },
  webcastButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#e53e3e',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  webcastButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#161936',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    color: '#5B9CFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    fontWeight: '600',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
  },
  timeBlock: {
    marginTop: 4,
  },
  timeValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  missionText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
});
