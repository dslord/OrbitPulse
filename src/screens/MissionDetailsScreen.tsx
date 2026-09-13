import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MissionDetails'>;

export default function MissionDetailsScreen({ route }: Props) {
  const { mission } = route.params;
  const [imageError, setImageError] = useState<boolean>(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#10b981';
      case 'Completed':
        return '#3b82f6';
      case 'Upcoming':
        return '#f59e0b';
      default:
        return '#94a3b8';
    }
  };

  const statusColor = getStatusColor(mission.status);

  const handleOpenWebsite = () => {
    if (mission.websiteUrl) {
      Linking.openURL(mission.websiteUrl).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/bg_image.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO IMAGE OR BANNER FALLBACK */}
          {mission.imageUrl && !imageError ? (
            <View style={styles.heroImageContainer}>
              <Image
                source={{ uri: mission.imageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
              <View style={styles.heroOverlay} />
            </View>
          ) : (
            <View style={styles.heroFallbackBanner}>
              <Text style={styles.heroFallbackText}>{mission.agencyAbbrev}</Text>
              <Text style={styles.heroFallbackSubtext}>{mission.category}</Text>
            </View>
          )}

          {/* MAIN HEADER */}
          <View style={styles.headerCard}>
            <View style={styles.headerTopRow}>
              <View style={styles.agencyBadge}>
                <Text style={styles.agencyBadgeText}>{mission.agencyAbbrev}</Text>
              </View>

              <View style={[styles.statusPill, { borderColor: statusColor }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {mission.status}
                </Text>
              </View>
            </View>

            <Text style={styles.titleText}>{mission.name}</Text>
            <Text style={styles.agencyFullName}>{mission.agency}</Text>
          </View>

          {/* METRICS GRID */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>MISSION SPECIFICATIONS</Text>

            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Destination / Target</Text>
                <Text style={styles.gridValue}>{mission.target}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Category</Text>
                <Text style={styles.gridValue}>{mission.category}</Text>
              </View>
            </View>

            {(mission.launchDate || mission.duration) && (
              <>
                <View style={styles.divider} />
                <View style={styles.gridRow}>
                  {mission.launchDate && (
                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>Launch Date</Text>
                      <Text style={styles.gridValue}>{mission.launchDate}</Text>
                    </View>
                  )}
                  {mission.duration && (
                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>Mission Duration</Text>
                      <Text style={styles.gridValue}>{mission.duration}</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>

          {/* OVERVIEW / DESCRIPTION */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>MISSION OVERVIEW</Text>
            <Text style={styles.descriptionText}>{mission.description}</Text>
          </View>

          {/* OBJECTIVES */}
          {mission.objectives && mission.objectives.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>KEY OBJECTIVES</Text>
              {mission.objectives.map((obj, index) => (
                <View key={index} style={styles.objectiveRow}>
                  <Text style={styles.objectiveBullet}>•</Text>
                  <Text style={styles.objectiveText}>{obj}</Text>
                </View>
              ))}
            </View>
          )}

          {/* OFFICIAL WEBSITE LINK BUTTON */}
          {mission.websiteUrl && (
            <TouchableOpacity
              style={styles.websiteButton}
              activeOpacity={0.8}
              onPress={handleOpenWebsite}
            >
              <Text style={styles.websiteButtonText}>Visit Official Mission Website &rarr;</Text>
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
  heroImageContainer: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 13, 27, 0.3)',
  },
  heroFallbackBanner: {
    height: 110,
    backgroundColor: '#161936',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  heroFallbackText: {
    color: '#00d4ff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  heroFallbackSubtext: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  headerCard: {
    backgroundColor: '#161936',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  agencyBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  agencyBadgeText: {
    color: '#00d4ff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  titleText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  agencyFullName: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
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
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontWeight: '700',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
  },
  objectiveRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  objectiveBullet: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    lineHeight: 18,
  },
  objectiveText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  websiteButton: {
    backgroundColor: '#0b0d1b',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d4ff',
    marginTop: 4,
  },
  websiteButtonText: {
    color: '#00d4ff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
