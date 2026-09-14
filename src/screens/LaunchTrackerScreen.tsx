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
  fetchUpcomingLaunches,
  calculateLaunchCountdown,
} from '../services/launchService';
import { LaunchItem, RootStackParamList } from '../types';
import { getCleanErrorMessage } from '../utils/errorUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'LaunchTracker'>;

type FilterCategory = 'all' | '24h' | 'week';

const FILTERS: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'All Upcoming' },
  { id: '24h', label: 'Next 24 Hours' },
  { id: 'week', label: 'This Week' },
];

export default function LaunchTrackerScreen({ navigation }: Props) {
  const [launches, setLaunches] = useState<LaunchItem[]>([]);
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
      const data = await fetchUpcomingLaunches();
      setLaunches(data);
      // Background prefetch launch images for instant display when tapped
      data.forEach((item) => {
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
        style={styles.launchCard}
        activeOpacity={0.8}
        onPress={() => handleCardPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.providerBadge}>
            <Text style={styles.providerText} numberOfLines={1}>
              {item.providerName}
            </Text>
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
              {item.statusAbbrev.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.launchName} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.countdownRow}>
          <Text style={styles.countdownLabel}>COUNTDOWN</Text>
          <Text
            style={[
              styles.countdownValue,
              countdown.isPastOrLive && styles.countdownValueLive,
            ]}
          >
            {countdown.countdownText}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Rocket</Text>
            <Text style={styles.footerValue} numberOfLines={1}>
              {item.rocketName}
            </Text>
          </View>

          <View style={styles.footerItemRight}>
            <Text style={styles.footerLabel}>Launch Time</Text>
            <Text style={styles.footerValue} numberOfLines={1}>
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
        <View style={styles.chipRow}>
          {FILTERS.map((f) => {
            const active = f.id === category;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategory(f.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loading View */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00d4ff" />
            <Text style={styles.loadingText}>Fetching Live Launch Schedule...</Text>
          </View>
        )}

        {/* Error View */}
        {error && !loading && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryText}>Retry Fetching Launches</Text>
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
                tintColor="#00d4ff"
                colors={['#00d4ff']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Launches Found</Text>
                <Text style={styles.emptySub}>
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
    backgroundColor: '#0b0d1b',
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
    backgroundColor: 'rgba(11, 13, 27, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.15)',
  },
  chip: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 8,
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
    padding: 24,
  },
  loadingText: {
    color: '#00d4ff',
    fontSize: 16,
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
  },
  retryButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  retryText: {
    color: '#0b0d1b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  launchCard: {
    backgroundColor: '#161936',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  providerBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    maxWidth: '70%',
  },
  providerText: {
    color: '#00d4ff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
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
  launchName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  countdownRow: {
    backgroundColor: '#0b0d1b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
  },
  countdownLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countdownValue: {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  countdownValueLive: {
    color: '#22c55e',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
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
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footerValue: {
    color: '#e2e8f0',
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
