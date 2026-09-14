import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageBackground,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchMeteorFeedWithMeta } from '../services/nasaNeoService';
import { MeteorObject, RootStackParamList } from '../types';
import { getCleanErrorMessage } from '../utils/errorUtils';
import { formatFreshnessLabel } from '../utils/timeUtils';
import { useTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Meteor'>;

export default function MeteorScreen({ navigation }: Props) {
  const { colors, activeTheme } = useTheme();
  const [meteors, setMeteors] = useState<MeteorObject[]>([]);
  const [source, setSource] = useState<'live' | 'cache'>('live');
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const getMeteors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchMeteorFeedWithMeta();
      setMeteors(res.data);
      setSource(res.source);
      setCachedAt(res.cachedAt || null);
      setLastUpdated(Date.now());
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching NASA NEO meteors:', err.message);
      const cleanMsg = getCleanErrorMessage(err, 'Near-Earth Object feed is');
      setError(cleanMsg);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getMeteors();
  }, [getMeteors]);

  const onRefresh = async () => {
    setRefreshing(true);
    await getMeteors();
    setRefreshing(false);
  };

  const renderMeteorCard = ({ item }: ListRenderItemInfo<MeteorObject>) => {
    let bgImg, speedImg, speedSize, threatLabel, threatColor;

    const threatScore = item.threatScore || 0;

    // Threat level calculation & asset mapping matching legacy thresholds
    if (threatScore <= 30) {
      bgImg = require('../../assets/meteor_bg1.png');
      speedImg = require('../../assets/meteor_speed1.gif');
      speedSize = 80;
      threatLabel = 'Low Threat';
      threatColor = '#48bb78';
    } else if (threatScore <= 75) {
      bgImg = require('../../assets/meteor_bg2.png');
      speedImg = require('../../assets/meteor_speed2.gif');
      speedSize = 110;
      threatLabel = 'Medium Threat';
      threatColor = '#ecc94b';
    } else {
      bgImg = require('../../assets/meteor_bg3.png');
      speedImg = require('../../assets/meteor_speed3.gif');
      speedSize = 140;
      threatLabel = 'High Threat';
      threatColor = '#f56565';
    }

    const approachData = item.current_approach || item.close_approach_data?.[0];
    const approachDate =
      approachData?.close_approach_date_full ||
      approachData?.close_approach_date ||
      'N/A';
    const minDia = (
      item.estimated_diameter?.kilometers?.estimated_diameter_min || 0
    ).toFixed(2);
    const maxDia = (
      item.estimated_diameter?.kilometers?.estimated_diameter_max || 0
    ).toFixed(2);
    const missKm = Math.round(
      parseFloat(approachData?.miss_distance?.kilometers || '0')
    ).toLocaleString();
    const velocityKmH = Math.round(
      parseFloat(approachData?.relative_velocity?.kilometers_per_hour || '0')
    ).toLocaleString();

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AsteroidDetails', { asteroid: item })}
      >
        <ImageBackground source={bgImg} style={styles.cardBackground} imageStyle={{ borderRadius: 20 }}>
          <View style={styles.cardHeader}>
            <Text style={[styles.threatBadge, { backgroundColor: threatColor }]}>
              {threatLabel}
            </Text>
            <Text style={styles.threatScoreText}>
              Score: {Math.round(threatScore)}
            </Text>
          </View>

          <Image source={speedImg} style={[styles.speedGif, { width: speedSize, height: speedSize }]} />

          <View style={[styles.cardBody, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.meteorTitle, { color: colors.primaryAccent }]} numberOfLines={1}>
              {item.name}
            </Text>

            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Closest Approach:</Text>
              <Text style={[styles.dataValue, { color: colors.textPrimary }]}>{approachDate}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Diameter Range:</Text>
              <Text style={[styles.dataValue, { color: colors.textPrimary }]}>{minDia} - {maxDia} km</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Miss Distance:</Text>
              <Text style={[styles.dataValue, { color: colors.textPrimary }]}>{missKm} km</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Velocity:</Text>
              <Text style={[styles.dataValue, { color: colors.textPrimary }]}>{velocityKmH} km/h</Text>
            </View>

            <Text style={[styles.viewDetailsText, { color: colors.primaryAccent }]}>Tap for Trajectory Radar & Orbit Details &rarr;</Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ImageBackground source={require('../../assets/meteor_bg.jpg')} style={styles.background}>
          <View style={[styles.centerContainer, { backgroundColor: colors.overlay }]}>
            <ActivityIndicator size="large" color={colors.primaryAccent} />
            <Text style={[styles.loadingText, { color: colors.primaryAccent }]}>Fetching NASA Near-Earth Objects...</Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (error && meteors.length === 0) {
    return (
      <View style={styles.container}>
        <ImageBackground source={require('../../assets/meteor_bg.jpg')} style={styles.background}>
          <View style={[styles.centerContainer, { backgroundColor: colors.overlay }]}>
            <Text style={[styles.errorTitle, { color: colors.critical }]}>Telemetry Offline</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primaryAccent }]} onPress={getMeteors}>
              <Text style={[styles.retryText, { color: colors.background }]}>Retry Feed</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../../assets/meteor_bg.jpg')} style={styles.background}>
        <View style={styles.titleContainer}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Near-Earth Object Radar</Text>
          <Text style={[styles.screenSubtitle, { color: colors.primaryAccent }]}>
            NASA NEO Threat Analysis • {formatFreshnessLabel({ source, cachedAt, lastUpdated, prefix: 'Updated' })}
          </Text>
        </View>

        {meteors.length === 0 ? (
          <View style={[styles.centerContainer, { backgroundColor: colors.overlay }]}>
            <Text style={[styles.errorText, { color: colors.textMuted }]}>No meteor approaches recorded for this period.</Text>
          </View>
        ) : (
          <FlatList
            data={meteors}
            keyExtractor={(item) => item.id || String(Math.random())}
            renderItem={renderMeteorCard}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryAccent}
                colors={[colors.primaryAccent]}
              />
            }
          />
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
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 12,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#5B9CFF',
    marginTop: 3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(11, 13, 27, 0.7)',
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
    marginBottom: 8,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
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
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  cardContainer: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  cardBackground: {
    padding: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threatBadge: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  threatScoreText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  speedGif: {
    alignSelf: 'center',
    marginVertical: 10,
    resizeMode: 'contain',
  },
  cardBody: {
    backgroundColor: 'rgba(18, 22, 44, 0.92)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.2)',
  },
  meteorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5B9CFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dataLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  viewDetailsText: {
    color: '#5B9CFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'right',
  },
});
