import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  RootStackParamList,
  SpacecraftItem,
  SpacecraftOrbitRegion,
} from '../types';
import { SPACECRAFT_DATA } from '../data/spacecraftData';
import { useTheme } from '../context/ThemeContext';
import { getAgencyIcon } from '../utils/agencyIcons';

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
  const { colors, activeTheme } = useTheme();
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
          <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>SPACECRAFT TRACKER</Text>
            <Text style={[styles.headerSubtitle, { color: colors.primaryAccent }]}>
              Real Orbital Telemetry & Trajectories of Deep Space Probes & Observatories
            </Text>
          </View>

          {/* SEARCH BAR */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search spacecraft, mission, agency, or target..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Text style={[styles.clearText, { color: colors.textMuted }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ORBIT REGION FILTERS */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textMuted }]}>ORBITAL REGION</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {REGION_FILTERS.map((reg) => {
                const active = selectedRegion === reg;
                return (
                  <TouchableOpacity
                    key={reg}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.selectedSurface : colors.surface,
                        borderColor: active ? colors.selectedIndicator : colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => setSelectedRegion(reg)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.selectedText : colors.textMuted },
                      ]}
                    >
                      {reg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* STATUS FILTERS */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textMuted }]}>STATUS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {STATUS_FILTERS.map((st) => {
                const active = selectedStatus === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.selectedSurface : colors.surface,
                        borderColor: active ? colors.selectedIndicator : colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => setSelectedStatus(st)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.selectedText : colors.textMuted },
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* SPACECRAFT CATALOG LIST */}
          {filteredSpacecraft.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Spacecraft Found</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No spacecraft match your current query and filters. Try clearing search or choosing another filter.
              </Text>
            </View>
          ) : (
            filteredSpacecraft.map((sc: SpacecraftItem) => {
              const isLive = sc.hasLiveTracking;
              const hasSpacecraftPhoto = Boolean(sc.imageUrl);
              const agencyIcon = getAgencyIcon(sc.agencyAbbrev || sc.agency);

              return (
                <TouchableOpacity
                  key={sc.id}
                  style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('SpacecraftDetails', { spacecraft: sc })}
                >
                  {hasSpacecraftPhoto ? (
                    <View style={styles.cardImageArea}>
                      <Image source={{ uri: sc.imageUrl }} style={styles.cardSpacecraftPhoto} resizeMode="cover" />
                    </View>
                  ) : agencyIcon ? (
                    <View style={[styles.cardImageArea, styles.cardAgencyFallbackArea, { backgroundColor: colors.raisedSurface }]}>
                      <Image source={agencyIcon} style={styles.cardFallbackAgencyIcon} resizeMode="contain" />
                    </View>
                  ) : null}

                  <View style={styles.cardContentPadding}>
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.badgeGroup}>
                        <View style={[styles.agencyBadge, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                          <Text style={[styles.agencyBadgeText, { color: colors.primaryAccent }]}>{sc.agencyAbbrev}</Text>
                        </View>
                        <View style={[styles.regionBadge, { backgroundColor: colors.raisedSurface }]}>
                          <Text style={[styles.regionBadgeText, { color: colors.textSecondary }]}>{sc.region}</Text>
                        </View>
                      </View>

                      <View style={[styles.trackingPill, { borderColor: isLive ? colors.liveMuted : colors.surfaceBorder, backgroundColor: isLive ? colors.liveMuted : colors.raisedSurface }]}>
                        <View style={[styles.statusDot, { backgroundColor: isLive ? colors.live : colors.primaryAccent }]} />
                        <Text style={[styles.trackingText, { color: isLive ? colors.live : colors.primaryAccent }]}>
                          {isLive ? 'LIVE TELEMETRY' : 'TRAJECTORY VIEW'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.spacecraftName, { color: colors.textPrimary }]}>{sc.name}</Text>
                    <Text style={[styles.missionText, { color: colors.primaryAccent }]}>{sc.mission}</Text>
                    <Text style={[styles.destinationText, { color: colors.textMuted }]} numberOfLines={1}>
                      Target: {sc.destination}
                    </Text>

                    <View style={[styles.cardFooter, { borderTopColor: colors.surfaceBorder }]}>
                      <Text style={[styles.launchDateText, { color: colors.textMuted }]}>Launched: {sc.launchDate}</Text>
                      <Text style={[styles.detailsLink, { color: colors.primaryAccent }]}>Track Spacecraft &rarr;</Text>
                    </View>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 13,
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
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
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardContainer: {
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImageArea: {
    width: '100%',
    height: 130,
    overflow: 'hidden',
  },
  cardSpacecraftPhoto: {
    width: '100%',
    height: '100%',
  },
  cardAgencyFallbackArea: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  cardFallbackAgencyIcon: {
    width: 130,
    height: 75,
  },
  cardContentPadding: {
    padding: 16,
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
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  agencyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  regionBadge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  regionBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  trackingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
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
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  missionText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  destinationText: {
    fontSize: 12,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  launchDateText: {
    fontSize: 11,
  },
  detailsLink: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
