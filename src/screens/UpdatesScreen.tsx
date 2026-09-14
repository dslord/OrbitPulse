import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useISSTelemetry } from '../hooks/useISSTelemetry';
import { fetchSpaceNews } from '../services/spaceNewsService';
import { RootStackParamList, SpaceNewsArticle } from '../types';
import { getCleanErrorMessage } from '../utils/errorUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'Updates'>;

export default function UpdatesScreen({ navigation }: Props) {
  const { telemetry, loading: telemetryLoading, error: telemetryError, refetch: refetchTelemetry } = useISSTelemetry(5000);
  const [articles, setArticles] = useState<SpaceNewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const data = await fetchSpaceNews(6);
      setArticles(data);
    } catch (err: any) {
      console.error('Failed to load space news:', err.message || err);
      const cleanMsg = getCleanErrorMessage(err, 'Space news is');
      setNewsError(cleanMsg);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const onManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTelemetry(), loadNews()]);
    setRefreshing(false);
  };

  const handleOpenArticle = async (url: string) => {
    if (!url || typeof url !== 'string') return;
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Error opening article URL:', err);
    }
  };

  const formatDate = (isoString: string): string => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/bg_updates.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onManualRefresh}
              tintColor="#00d4ff"
              colors={['#00d4ff']}
            />
          }
        >
          <View style={styles.headerBar}>
            <View style={styles.titleWrapper}>
              <Image
                source={require('../../assets/blog_icon.png')}
                style={styles.blogIcon}
              />
              <View>
                <Text style={styles.headerTitle}>Space Updates & Feed</Text>
                <Text style={styles.headerSubtitle}>Real-time ISS Orbit & News</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={onManualRefresh}>
              <Image
                source={require('../../assets/refresh_icon.png')}
                style={styles.refreshIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Live Telemetry Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>Live Orbital Telemetry</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            {telemetryLoading && !telemetry ? (
              <ActivityIndicator size="small" color="#00d4ff" style={{ marginVertical: 15 }} />
            ) : telemetryError && !telemetry ? (
              <Text style={styles.errorText}>{telemetryError}</Text>
            ) : (
              <View style={styles.telemetryGrid}>
                <View style={styles.gridBox}>
                  <Text style={styles.boxLabel}>Latitude</Text>
                  <Text style={styles.boxValue}>
                    {telemetry ? `${telemetry.latitude.toFixed(4)}°` : '--'}
                  </Text>
                </View>

                <View style={styles.gridBox}>
                  <Text style={styles.boxLabel}>Longitude</Text>
                  <Text style={styles.boxValue}>
                    {telemetry ? `${telemetry.longitude.toFixed(4)}°` : '--'}
                  </Text>
                </View>

                <View style={styles.gridBox}>
                  <Text style={styles.boxLabel}>Altitude</Text>
                  <Text style={styles.boxValue}>
                    {telemetry ? `${Math.round(telemetry.altitude)} km` : '--'}
                  </Text>
                </View>

                <View style={styles.gridBox}>
                  <Text style={styles.boxLabel}>Speed</Text>
                  <Text style={styles.boxValue}>
                    {telemetry ? `${Math.round(telemetry.velocity)} km/h` : '--'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* News & Bulletins Section */}
          <Text style={styles.sectionHeaderTitle}>Orbital Mission Reports</Text>

          {newsLoading && articles.length === 0 ? (
            <View style={styles.newsCenterContainer}>
              <ActivityIndicator size="large" color="#00d4ff" />
              <Text style={styles.loadingNewsText}>Fetching Live Space News...</Text>
            </View>
          ) : newsError && articles.length === 0 ? (
            <View style={styles.newsCenterContainer}>
              <Text style={styles.newsErrorTitle}>News Telemetry Offline</Text>
              <Text style={styles.newsErrorText}>{newsError}</Text>
              <TouchableOpacity style={styles.newsRetryBtn} onPress={loadNews}>
                <Text style={styles.newsRetryText}>Retry News Feed</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {articles.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.newsCard}
                  activeOpacity={0.85}
                  onPress={() => handleOpenArticle(item.url)}
                >
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.newsThumbnail}
                      resizeMode="cover"
                    />
                  ) : null}
                  <View style={styles.newsCardContent}>
                    <View style={styles.newsHeader}>
                      <Text style={styles.newsSource} numberOfLines={1}>
                        {item.news_site || 'Space News'} • {formatDate(item.published_at)}
                      </Text>
                      <Text style={styles.newsReadMore}>Read &rarr;</Text>
                    </View>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.summary ? (
                      <Text style={styles.newsSummary} numberOfLines={3}>
                        {item.summary}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.viewMoreBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('SpaceNews')}
              >
                <Text style={styles.viewMoreText}>View More Space News &rarr;</Text>
              </TouchableOpacity>
            </>
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
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blogIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#00d4ff',
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderRadius: 20,
  },
  refreshIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  card: {
    backgroundColor: 'rgba(11, 13, 27, 0.88)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  liveText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridBox: {
    width: '48%',
    backgroundColor: '#161936',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  boxLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  boxValue: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  errorText: {
    color: '#ff4d4d',
    textAlign: 'center',
    marginVertical: 10,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 14,
  },
  newsCenterContainer: {
    backgroundColor: 'rgba(11, 13, 27, 0.85)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    marginBottom: 16,
  },
  loadingNewsText: {
    color: '#00d4ff',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  newsErrorTitle: {
    color: '#ff4d4d',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  newsErrorText: {
    color: '#ffffff',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  newsRetryBtn: {
    backgroundColor: '#00d4ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  newsRetryText: {
    color: '#0b0d1b',
    fontWeight: 'bold',
    fontSize: 13,
  },
  newsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  newsThumbnail: {
    width: '100%',
    height: 140,
    backgroundColor: '#161936',
  },
  newsCardContent: {
    padding: 16,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  newsSource: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    flex: 1,
    marginRight: 8,
  },
  newsReadMore: {
    fontSize: 12,
    color: '#e53e3e',
    fontWeight: 'bold',
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b0d1b',
    marginBottom: 6,
  },
  newsSummary: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  viewMoreBtn: {
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  viewMoreText: {
    color: '#00d4ff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
