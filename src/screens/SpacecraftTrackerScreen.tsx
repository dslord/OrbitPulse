import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  RootStackParamList,
  SpacecraftItem,
  SpacecraftOrbitRegion,
} from '../types';
import { SPACECRAFT_DATA } from '../data/spacecraftData';

type Props = NativeStackScreenProps<RootStackParamList, 'SpacecraftTracker'>;

const REGION_FILTERS: (SpacecraftOrbitRegion | 'All')[] = [
  'All',
  'Earth Orbit',
  'Deep Space',
  'Lunar Orbit',
  'Mars Orbit',
  'Jovian System',
  'Solar Orbit',
];

const STATUS_FILTERS: ('All' | 'Active' | 'En Route' | 'Completed')[] = [
  'All',
  'Active',
  'En Route',
  'Completed',
];

export default function SpacecraftTrackerScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<SpacecraftOrbitRegion | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'En Route' | 'Completed'>('All');

  // Filter spacecraft based on search query and filter chips
  const filteredSpacecraft = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return SPACECRAFT_DATA.filter((sc) => {
      // 1. Region Filter
      if (selectedRegion !== 'All' && sc.region !== selectedRegion) {
        return false;
      }

      // 2. Status Filter
      if (selectedStatus !== 'All' && sc.status !== selectedStatus) {
        return false;
      }

      // 3. Search Query Filter
      if (!query) return true;

      const nameMatch = sc.name.toLowerCase().includes(query);
      const missionMatch = sc.mission.toLowerCase().includes(query);
      const agencyMatch =
        sc.agency.toLowerCase().includes(query) ||
        sc.agencyAbbrev.toLowerCase().includes(query);
      const destMatch = sc.destination.toLowerCase().includes(query);

      return nameMatch || missionMatch || agencyMatch || destMatch;
    });
  }, [searchQuery, selectedRegion, selectedStatus]);

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
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER BANNER */}
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>SPACECRAFT TRACKER</Text>
            <Text style={styles.headerSubtitle}>
              Real Orbital Telemetry & Trajectories of Deep Space Probes & Observatories
            </Text>
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search spacecraft, mission, agency, or target..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ORBIT REGION FILTERS */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>ORBITAL REGION</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {REGION_FILTERS.map((reg) => {
                const active = selectedRegion === reg;
                return (
                  <TouchableOpacity
                    key={reg}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedRegion(reg)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{reg}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* STATUS FILTERS */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>STATUS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {STATUS_FILTERS.map((st) => {
                const active = selectedStatus === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedStatus(st)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{st}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* SPACECRAFT CATALOG LIST */}
          {filteredSpacecraft.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Spacecraft Found</Text>
              <Text style={styles.emptyText}>
                No spacecraft match your current query and filters. Try clearing search or choosing another filter.
              </Text>
            </View>
          ) : (
            filteredSpacecraft.map((sc: SpacecraftItem) => {
              const isLive = sc.hasLiveTracking;

              return (
                <TouchableOpacity
                  key={sc.id}
                  style={styles.cardContainer}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('SpacecraftDetails', { spacecraft: sc })}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.badgeGroup}>
                      <View style={styles.agencyBadge}>
                        <Text style={styles.agencyBadgeText}>{sc.agencyAbbrev}</Text>
                      </View>
                      <View style={styles.regionBadge}>
                        <Text style={styles.regionBadgeText}>{sc.region}</Text>
                      </View>
                    </View>

                    <View style={[styles.trackingPill, isLive ? styles.livePill : styles.staticPill]}>
                      <View style={[styles.statusDot, { backgroundColor: isLive ? '#10b981' : '#00d4ff' }]} />
                      <Text style={[styles.trackingText, { color: isLive ? '#10b981' : '#00d4ff' }]}>
                        {isLive ? 'LIVE TELEMETRY' : 'TRAJECTORY VIEW'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.spacecraftName}>{sc.name}</Text>
                  <Text style={styles.missionText}>{sc.mission}</Text>
                  <Text style={styles.destinationText} numberOfLines={1}>
                    Target: {sc.destination}
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.launchDateText}>Launched: {sc.launchDate}</Text>
                    <Text style={styles.detailsLink}>Track Spacecraft &rarr;</Text>
                  </View>
                </TouchableOpacity>
              );
            })
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
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161936',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: '#ffffff',
    fontSize: 13,
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  clearText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 2,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#161936',
    marginRight: 8,
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
  emptyContainer: {
    backgroundColor: '#161936',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardContainer: {
    backgroundColor: '#161936',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  agencyBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  agencyBadgeText: {
    color: '#00d4ff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  regionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  regionBadgeText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
  trackingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  livePill: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  staticPill: {
    borderColor: 'rgba(0, 212, 255, 0.3)',
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  trackingText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  spacecraftName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  missionText: {
    color: '#00d4ff',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  destinationText: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  launchDateText: {
    color: '#64748b',
    fontSize: 11,
  },
  detailsLink: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
