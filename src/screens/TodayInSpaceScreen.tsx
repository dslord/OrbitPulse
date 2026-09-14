import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchUpcomingLaunches } from '../services/launchService';
import { fetchISSTelemetry } from '../services/issTelemetryService';
import { fetchMeteorFeed } from '../services/nasaNeoService';
import { fetchSpaceNews } from '../services/spaceNewsService';
import {
  LaunchItem,
  ISSTelemetry,
  MeteorObject,
  SpaceNewsArticle,
  RootStackParamList,
} from '../types';
import { getCleanErrorMessage } from '../utils/errorUtils';
import { useTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'TodayInSpace'>;

export default function TodayInSpaceScreen({ navigation }: Props) {
  const { colors, activeTheme } = useTheme();
  // 1-Second interval ticker for live countdowns
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Section 1: Launches
  const [launches, setLaunches] = useState<LaunchItem[]>([]);
  const [launchesLoading, setLaunchesLoading] = useState<boolean>(true);
  const [launchesError, setLaunchesError] = useState<string | null>(null);

  // Section 2: ISS Telemetry
  const [issData, setIssData] = useState<ISSTelemetry | null>(null);
  const [issLoading, setIssLoading] = useState<boolean>(true);
  const [issError, setIssError] = useState<string | null>(null);

  // Section 3: Asteroid / NEO Radar
  const [meteors, setMeteors] = useState<MeteorObject[]>([]);
  const [neoLoading, setNeoLoading] = useState<boolean>(true);
  const [neoError, setNeoError] = useState<string | null>(null);

  // Section 4: Space News
  const [news, setNews] = useState<SpaceNewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fault-tolerant data aggregator
  const fetchAllData = useCallback(async (isRefresh: boolean = false) => {
    setLaunchesLoading(true);
    setIssLoading(true);
    setNeoLoading(true);
    setNewsLoading(true);

    setLaunchesError(null);
    setIssError(null);
    setNeoError(null);
    setNewsError(null);

    const results = await Promise.allSettled([
      fetchUpcomingLaunches(),
      fetchISSTelemetry(8000),
      fetchMeteorFeed(),
      fetchSpaceNews(5),
    ]);

    // Handle Launches result
    if (results[0].status === 'fulfilled') {
      setLaunches(results[0].value);
    } else {
      setLaunchesError(getCleanErrorMessage(results[0].reason, 'Launch schedule is'));
    }
    setLaunchesLoading(false);

    // Handle ISS Telemetry result
    if (results[1].status === 'fulfilled') {
      setIssData(results[1].value);
    } else {
      setIssError(getCleanErrorMessage(results[1].reason, 'ISS telemetry is'));
    }
    setIssLoading(false);

    // Handle NASA NEO result
    if (results[2].status === 'fulfilled') {
      setMeteors(results[2].value);
    } else {
      setNeoError(getCleanErrorMessage(results[2].reason, 'Near-Earth Object feed is'));
    }
    setNeoLoading(false);

    // Handle Space News result
    if (results[3].status === 'fulfilled') {
      setNews(results[3].value);
    } else {
      setNewsError(getCleanErrorMessage(results[3].reason, 'Space news is'));
    }
    setNewsLoading(false);

    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData(true);
  };

  // Helper countdown formatter
  const formatCountdown = (netIso?: string) => {
    if (!netIso) return 'T - TBD';
    const targetMs = new Date(netIso).getTime();
    const diffMs = targetMs - nowMs;

    if (diffMs <= 0) return 'T - LIVE / LAUNCHED';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (days > 0) return `T - ${days}d ${hours}h ${minutes}m`;
    return `T - ${hours}h ${minutes}m ${seconds}s`;
  };

  // Formatted date string for Today header
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate NEO summary metrics
  const hazardousCount = meteors.filter((m) => m.is_potentially_hazardous_asteroid || (m.threatScore || 0) > 75).length;
  const closestMeteor = meteors.length > 0 ? meteors[0] : null;
  const closestMissKm = closestMeteor?.current_approach?.miss_distance?.kilometers
    ? Math.round(parseFloat(closestMeteor.current_approach.miss_distance.kilometers)).toLocaleString()
    : 'N/A';

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../../assets/bg_image.png')} style={styles.background} resizeMode="cover">
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryAccent} colors={[colors.primaryAccent]} />
          }
        >
          {/* DASHBOARD HEADER */}
          <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>TODAY IN SPACE</Text>
            <Text style={[styles.headerDate, { color: colors.primaryAccent }]}>{todayFormatted}</Text>
          </View>

          {/* SECTION 1: TODAY'S LAUNCHES */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>UPCOMING SPACE LAUNCHES</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LaunchTracker')}>
                <Text style={[styles.sectionActionText, { color: colors.textMuted }]}>View All ({launches.length}) &rarr;</Text>
              </TouchableOpacity>
            </View>

            {launchesLoading && (
              <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color={colors.primaryAccent} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Fetching launch manifests...</Text>
              </View>
            )}

            {launchesError && !launchesLoading && (
              <Text style={styles.sectionError}>{launchesError}</Text>
            )}

            {!launchesLoading && !launchesError && launches.length === 0 && (
              <Text style={[styles.sectionEmpty, { color: colors.textMuted }]}>No upcoming launch manifests recorded for today.</Text>
            )}

            {!launchesLoading && !launchesError && launches.slice(0, 2).map((launch) => (
              <TouchableOpacity
                key={launch.id}
                style={[styles.launchCard, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('LaunchDetails', { launch })}
              >
                <View style={styles.launchCardHeader}>
                  <Text style={[styles.launchName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {launch.name}
                  </Text>
                  <Text style={[styles.launchCountdown, { color: colors.primaryAccent }]}>{formatCountdown(launch.net)}</Text>
                </View>
                <Text style={[styles.launchMeta, { color: colors.textMuted }]}>
                  {launch.providerName} • {launch.rocketName}
                </Text>
                <Text style={[styles.launchTime, { color: colors.textSecondary }]}>
                  NET: {new Date(launch.net).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SECTION 2: ISS LIVE STATUS */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>ISS LIVE ORBITAL STATUS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ISSlocator')}>
                <Text style={[styles.sectionActionText, { color: colors.textMuted }]}>Live Tracker Map &rarr;</Text>
              </TouchableOpacity>
            </View>

            {issLoading && (
              <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color={colors.primaryAccent} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Connecting to ISS telemetry node...</Text>
              </View>
            )}

            {issError && !issLoading && (
              <Text style={styles.sectionError}>{issError}</Text>
            )}

            {!issLoading && !issError && issData && (
              <View style={[styles.issGrid, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                <View style={styles.issGridItem}>
                  <Text style={[styles.issLabel, { color: colors.textMuted }]}>Latitude</Text>
                  <Text style={[styles.issValue, { color: colors.textPrimary }]}>{issData.latitude.toFixed(2)}° N</Text>
                </View>
                <View style={styles.issGridItemCenter}>
                  <Text style={[styles.issLabel, { color: colors.textMuted }]}>Longitude</Text>
                  <Text style={[styles.issValue, { color: colors.textPrimary }]}>{issData.longitude.toFixed(2)}° E</Text>
                </View>
                <View style={styles.issGridItemRight}>
                  <Text style={[styles.issLabel, { color: colors.textMuted }]}>Altitude</Text>
                  <Text style={[styles.issValueHighlight, { color: colors.primaryAccent }]}>{Math.round(issData.altitude)} km</Text>
                </View>
              </View>
            )}
          </View>

          {/* SECTION 3: ASTEROID / NEO RADAR */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>ASTEROID RADAR SUMMARY</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Meteor')}>
                <Text style={[styles.sectionActionText, { color: colors.textMuted }]}>Radar Feed &rarr;</Text>
              </TouchableOpacity>
            </View>

            {neoLoading && (
              <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color={colors.primaryAccent} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Analyzing NASA NEO radar stream...</Text>
              </View>
            )}

            {neoError && !neoLoading && (
              <Text style={styles.sectionError}>{neoError}</Text>
            )}

            {!neoLoading && !neoError && (
              <View style={styles.neoSummaryRow}>
                <View style={[styles.neoStatCard, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.neoStatValue, { color: colors.textPrimary }]}>{meteors.length}</Text>
                  <Text style={[styles.neoStatLabel, { color: colors.textMuted }]}>NEO Approaches</Text>
                </View>

                <View style={[styles.neoStatCard, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.neoStatValue, { color: colors.textPrimary }, hazardousCount > 0 && styles.textHazardous]}>
                    {hazardousCount}
                  </Text>
                  <Text style={[styles.neoStatLabel, { color: colors.textMuted }]}>Hazardous Risks</Text>
                </View>

                <View style={[styles.neoStatCardLarge, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.neoStatLabel, { color: colors.textMuted }]}>Closest Miss Distance</Text>
                  <Text style={[styles.neoStatValueHighlight, { color: colors.primaryAccent }]}>{closestMissKm} km</Text>
                  <Text style={[styles.neoStatSub, { color: colors.textMuted }]} numberOfLines={1}>
                    {closestMeteor ? closestMeteor.name : 'N/A'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* SECTION 4: LATEST SPACE NEWS */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.primaryAccent }]}>LATEST SPACE NEWS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SpaceNews')}>
                <Text style={[styles.sectionActionText, { color: colors.textMuted }]}>Full Feed &rarr;</Text>
              </TouchableOpacity>
            </View>

            {newsLoading && (
              <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color={colors.primaryAccent} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Fetching Spaceflight News...</Text>
              </View>
            )}

            {newsError && !newsLoading && (
              <Text style={[styles.sectionUnavailable, { color: colors.textMuted }]}>{newsError}</Text>
            )}

            {!newsLoading && !newsError && news.length === 0 && (
              <Text style={[styles.sectionEmpty, { color: colors.textMuted }]}>No spaceflight articles available right now.</Text>
            )}

            {!newsLoading && !newsError && news.slice(0, 4).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.newsCard, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}
                activeOpacity={0.8}
                onPress={() => Linking.openURL(item.url).catch(() => {})}
              >
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={[styles.newsImage, { backgroundColor: colors.surface }]} />
                ) : (
                  <View style={[styles.newsImagePlaceholder, { backgroundColor: colors.surface }]} />
                )}

                <View style={styles.newsContent}>
                  <Text style={[styles.newsTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.newsMeta, { color: colors.primaryAccent }]}>
                    {item.news_site} • {new Date(item.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  headerCard: {
    backgroundColor: '#161936',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerDate: {
    color: '#5B9CFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
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
  sectionActionText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 10,
  },
  sectionError: {
    color: '#ff4d4d',
    fontSize: 12,
    paddingVertical: 8,
  },
  sectionUnavailable: {
    color: '#94a3b8',
    fontSize: 12,
    paddingVertical: 8,
    fontStyle: 'italic',
  },
  sectionEmpty: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  launchCard: {
    backgroundColor: '#0b0d1b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  launchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  launchName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  launchCountdown: {
    color: '#5B9CFF',
    fontSize: 11,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  launchMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 2,
  },
  launchTime: {
    color: '#cbd5e1',
    fontSize: 10,
  },
  issGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0b0d1b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  issGridItem: {
    flex: 1,
  },
  issGridItemCenter: {
    flex: 1,
    alignItems: 'center',
  },
  issGridItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  issLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  issValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  issValueHighlight: {
    color: '#5B9CFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  neoSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  neoStatCard: {
    backgroundColor: '#0b0d1b',
    borderRadius: 12,
    padding: 10,
    width: '28%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  neoStatCardLarge: {
    backgroundColor: '#0b0d1b',
    borderRadius: 12,
    padding: 10,
    width: '40%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.2)',
  },
  neoStatValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  neoStatValueHighlight: {
    color: '#5B9CFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  neoStatLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  neoStatSub: {
    color: '#94a3b8',
    fontSize: 9,
    marginTop: 1,
  },
  textHazardous: {
    color: '#ef4444',
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#0b0d1b',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  newsImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#161936',
  },
  newsImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#161936',
  },
  newsContent: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  newsTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 16,
  },
  newsMeta: {
    color: '#5B9CFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
