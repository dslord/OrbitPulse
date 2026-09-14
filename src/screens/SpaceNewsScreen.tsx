import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
  ListRenderItemInfo,
} from 'react-native';
import { fetchSpaceNewsWithMeta } from '../services/spaceNewsService';
import { SpaceNewsArticle } from '../types';
import { getCleanErrorMessage } from '../utils/errorUtils';

export default function SpaceNewsScreen() {
  const [articles, setArticles] = useState<SpaceNewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'isro'>('all');

  const loadArticles = useCallback(async (filter: 'all' | 'isro') => {
    setLoading(true);
    setError(null);
    try {
      const searchTerm = filter === 'isro' ? 'ISRO' : undefined;
      const res = await fetchSpaceNewsWithMeta(20, searchTerm);
      setArticles(res.data);
      setIsCached(res.source === 'cache');
    } catch (err: any) {
      console.error('Failed to load space news feed:', err.message || err);
      const cleanMsg = getCleanErrorMessage(err, 'Space news is');
      setError(cleanMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles(activeFilter);
  }, [activeFilter, loadArticles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArticles(activeFilter);
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

  const renderArticleCard = ({ item }: ListRenderItemInfo<SpaceNewsArticle>) => (
    <TouchableOpacity
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
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/bg_updates.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'all' && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === 'all' && styles.filterTextActive,
              ]}
            >
              Global Space News
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'isro' && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter('isro')}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === 'isro' && styles.filterTextActive,
              ]}
            >
              ISRO & India Focus
            </Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00d4ff" />
            <Text style={styles.loadingText}>Fetching Spaceflight Telemetry & News...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorTitle}>Feed Offline</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadArticles(activeFilter)}
            >
              <Text style={styles.retryText}>Retry Feed</Text>
            </TouchableOpacity>
          </View>
        ) : articles.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorTitle}>No Reports Found</Text>
            <Text style={styles.errorText}>
              {activeFilter === 'isro'
                ? 'No recent ISRO/India space reports found in current live feed.'
                : 'No spaceflight news reports currently available.'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadArticles(activeFilter)}
            >
              <Text style={styles.retryText}>Refresh Feed</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={articles}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderArticleCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#00d4ff"
                colors={['#00d4ff']}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  filterTabActive: {
    backgroundColor: '#00d4ff',
    borderColor: '#00d4ff',
  },
  filterText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  filterTextActive: {
    color: '#0b0d1b',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  newsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  newsThumbnail: {
    width: '100%',
    height: 150,
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
});
