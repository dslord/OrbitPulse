import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  fetchUpcomingLaunchesWithMeta,
  calculateLaunchCountdown,
} from '../services/launchService';
import { LaunchItem, RootStackParamList } from '../types';
import { getCleanErrorMessage } from '../utils/errorUtils';
import { formatFreshnessLabel } from '../utils/timeUtils';
import { useTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'LaunchTracker'>;

type FilterCategory = 'all' | '24h' | 'week';

const FILTERS: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'All Upcoming' },
  { id: '24h', label: 'Next 24 Hours' },
  { id: 'week', label: 'This Week' },
];

export default function LaunchTrackerScreen({ navigation }: Props) {
  const { colors, activeTheme } = useTheme();
  const [launches, setLaunches] = useState<LaunchItem[]>([]);
  const [source, setSource] = useState<'live' | 'cache'>('live');
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<FilterCategory>('all');
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Ticker for dynamic countdown update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchUpcomingLaunchesWithMeta();
      setLaunches(res.data);
      setSource(res.source);
      setCachedAt(res.cachedAt || null);
      setLastUpdated(Date.now());

      // Background prefetch launch images for instant display when tapped
      res.data.forEach((item) => {
        if (item.imageUrl) {
          Image.prefetch(item.imageUrl).catch(() => {});
        }
      });
    } catch (err: any) {
      const cleanMsg = getCleanErrorMessage(err, 'Launch schedule is');
      setError(cleanMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Filter launches based on selected category chip
  const filteredLaunches = useMemo(() => {
    if (category === 'all') return launches;

    const msIn24H = 24 * 60 * 60 * 1000;
    const msInWeek = 7 * 24 * 60 * 60 * 1000;

    return launches.filter((item) => {
      const launchMs = new Date(item.net).getTime();
      const diff = launchMs - nowMs;

      if (category === '24h') {
        return diff >= 0 && diff <= msIn24H;
      }
      if (category === 'week') {
        return diff >= 0 && diff <= msInWeek;
      }
      return true;
    });
  }, [launches, category, nowMs]);

  const handleCardPress = (item: LaunchItem) => {
    if (item.imageUrl) {
      Image.prefetch(item.imageUrl).catch(() => {});
    }
    navigation.navigate('LaunchDetails', { launch: item });
  };

  const renderLaunchItem = ({ item }: { item: LaunchItem }) => {
    const countdown = calculateLaunchCountdown(item.net, nowMs);
    const dateFormatted = new Date(item.net).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return (
      <TouchableOpacity
        style={[styles.launchCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
        activeOpacity={0.8}
        onPress={() => handleCardPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.providerBadge, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.providerText, { color: colors.primaryAccent }]} numberOfLines={1}>
              {item.providerName}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: countdown.isPastOrLive ? colors.liveMuted : colors.raisedSurface },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: countdown.isPastOrLive ? colors.live : colors.textMuted },
              ]}
            >
              {item.statusAbbrev.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.launchName, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={[styles.countdownRow, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.countdownLabel, { color: colors.textMuted }]}>COUNTDOWN</Text>
          <Text
            style={[
              styles.countdownValue,
              { color: countdown.isPastOrLive ? colors.live : colors.primaryAccent },
            ]}
          >
            {countdown.countdownText}
          </Text>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.surfaceBorder }]}>
          <View style={styles.footerItem}>
            <Text style={[styles.footerLabel, { color: colors.textMuted }]}>Rocket</Text>
            <Text style={[styles.footerValue, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.rocketName}
            </Text>
          </View>

          <View style={styles.footerItemRight}>
            <Text style={[styles.footerLabel, { color: colors.textMuted }]}>Launch Time</Text>
            <Text style={[styles.footerValue, { color: colors.textPrimary }]} numberOfLines={1}>
              {dateFormatted}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/bg_image.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Category Chip Selector */}
        <View style={[styles.chipRow, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
          {FILTERS.map((f) => {
            const active = f.id === category;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.selectedSurface : colors.surface,
                    borderColor: active ? colors.selectedIndicator : colors.surfaceBorder,
                  },
                ]}
                onPress={() => setCategory(f.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.selectedText : colors.textMuted },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!loading && !error && (
          <View style={styles.freshnessContainer}>
            <Text style={[styles.freshnessText, { color: colors.textMuted }]}>
              {formatFreshnessLabel({ source, cachedAt, lastUpdated, prefix: 'Manifest' })}
            </Text>
          </View>
        )}

        {/* Loading View */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primaryAccent} />
            <Text style={[styles.loadingText, { color: colors.primaryAccent }]}>Fetching Live Launch Schedule...</Text>
          </View>
        )}

        {/* Error View */}
        {error && !loading && (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorTitle, { color: colors.critical }]}>Connection Error</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primaryAccent }]} onPress={onRefresh}>
              <Text style={[styles.retryText, { color: colors.background }]}>Retry Fetching Launches</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Launch List */}
        {!loading && !error && (
          <FlatList
            data={filteredLaunches}
            keyExtractor={(item) => item.id}
            renderItem={renderLaunchItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryAccent}
                colors={[colors.primaryAccent]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Launches Found</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  No upcoming launches fit the selected filter criteria.
                </Text>
              </View>
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
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  chip: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  retryText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  launchCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  providerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: '70%',
  },
  providerText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  launchName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  countdownRow: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  countdownLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  footerItem: {
    flex: 1,
    marginRight: 8,
  },
  footerItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footerValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
  freshnessContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
  },
  freshnessText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
