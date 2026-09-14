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
import { RootStackParamList, MissionItem, MissionStatus } from '../types';
import { MISSIONS_DATA } from '../data/missionsData';
import { useTheme } from '../context/ThemeContext';
import { getAgencyIcon } from '../utils/agencyIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'MissionExplorer'>;

const STATUS_FILTERS: (MissionStatus | 'All')[] = ['All', 'Active', 'Completed', 'Upcoming'];
const AGENCY_FILTERS = ['All', 'NASA', 'ISRO', 'ESA', 'JAXA', 'CNSA'];

export default function MissionExplorerScreen({ navigation }: Props) {
  const { colors, activeTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<MissionStatus | 'All'>('All');
  const [selectedAgency, setSelectedAgency] = useState<string>('All');

  // Filter missions based on search query, status chip, and agency chip
  const filteredMissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return MISSIONS_DATA.filter((mission) => {
      // 1. Status Filter
      if (selectedStatus !== 'All' && mission.status !== selectedStatus) {
        return false;
      }

      // 2. Agency Filter
      if (selectedAgency !== 'All' && mission.agencyAbbrev !== selectedAgency) {
        return false;
      }

      // 3. Search Query Filter
      if (!query) return true;

      const nameMatch = mission.name.toLowerCase().includes(query);
      const agencyMatch =
        mission.agency.toLowerCase().includes(query) ||
        mission.agencyAbbrev.toLowerCase().includes(query);
      const targetMatch = mission.target.toLowerCase().includes(query);
      const categoryMatch = mission.category.toLowerCase().includes(query);

      return nameMatch || agencyMatch || targetMatch || categoryMatch;
    });
  }, [searchQuery, selectedStatus, selectedAgency]);

  const getStatusColor = (status: MissionStatus) => {
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
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>SPACE MISSION EXPLORER</Text>
            <Text style={[styles.headerSubtitle, { color: colors.primaryAccent }]}>
              Explore Deep Space Probes, Lunar Landers & Astronomical Observatories
            </Text>
          </View>

          {/* SEARCH INPUT BAR */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search mission name, agency, target, or category..."
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

          {/* STATUS FILTER CHIPS */}
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
                        { color: active ? colors.selectedIndicator : colors.textMuted, fontWeight: active ? 'bold' : '600' },
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* AGENCY FILTER CHIPS */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textMuted }]}>AGENCY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {AGENCY_FILTERS.map((ag) => {
                const active = selectedAgency === ag;
                return (
                  <TouchableOpacity
                    key={ag}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.selectedSurface : colors.surface,
                        borderColor: active ? colors.selectedIndicator : colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => setSelectedAgency(ag)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.selectedIndicator : colors.textMuted, fontWeight: active ? 'bold' : '600' },
                      ]}
                    >
                      {ag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* MISSIONS LIST */}
          {filteredMissions.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Missions Found</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No space missions match your current search and filter criteria. Try adjusting your query or resetting filters.
              </Text>
            </View>
          ) : (
            filteredMissions.map((mission: MissionItem) => {
              const statusColor = getStatusColor(mission.status);
              const hasMissionPhoto = Boolean(mission.imageUrl);
              const agencyIcon = getAgencyIcon(mission.agencyAbbrev || mission.agency);

              return (
                <TouchableOpacity
                  key={mission.id}
                  style={[styles.missionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('MissionDetails', { mission })}
                >
                  {hasMissionPhoto ? (
                    <View style={styles.cardImageArea}>
                      <Image source={{ uri: mission.imageUrl }} style={styles.cardMissionPhoto} resizeMode="cover" />
                    </View>
                  ) : agencyIcon ? (
                    <View style={[styles.cardImageArea, styles.cardAgencyFallbackArea, { backgroundColor: colors.raisedSurface }]}>
                      <Image source={agencyIcon} style={styles.cardFallbackAgencyIcon} resizeMode="contain" />
                    </View>
                  ) : null}

                  <View style={styles.cardContentPadding}>
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.agencyBadge, { backgroundColor: colors.raisedSurface, borderColor: colors.surfaceBorder }]}>
                          <Text style={[styles.agencyBadgeText, { color: colors.primaryAccent }]}>{mission.agencyAbbrev}</Text>
                        </View>
                        <View style={[styles.targetBadge, { backgroundColor: colors.raisedSurface }]}>
                          <Text style={[styles.targetBadgeText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {mission.target}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.statusPill, { borderColor: statusColor }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {mission.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.missionName, { color: colors.textPrimary }]}>{mission.name}</Text>
                    <Text style={[styles.categoryText, { color: colors.primaryAccent }]}>{mission.category}</Text>
                    <Text style={[styles.descriptionSnippet, { color: colors.textSecondary }]} numberOfLines={2}>
                      {mission.description}
                    </Text>

                    <View style={[styles.cardFooter, { borderTopColor: colors.surfaceBorder }]}>
                      <Text style={[styles.agencyFullName, { color: colors.textMuted }]} numberOfLines={1}>
                        {mission.agency}
                      </Text>
                      <Text style={[styles.detailsActionText, { color: colors.primaryAccent }]}>View Details &rarr;</Text>
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
    color: '#5B9CFF',
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
    backgroundColor: '#5B9CFF',
    borderColor: '#5B9CFF',
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
  missionCard: {
    backgroundColor: '#161936',
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cardImageArea: {
    width: '100%',
    height: 130,
    overflow: 'hidden',
  },
  cardMissionPhoto: {
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
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  agencyBadge: {
    backgroundColor: 'rgba(91, 156, 255, 0.15)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.3)',
  },
  agencyBadgeText: {
    color: '#5B9CFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  targetBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    flexShrink: 1,
  },
  targetBadgeText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  missionName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  categoryText: {
    color: '#5B9CFF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionSnippet: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
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
  agencyFullName: {
    color: '#64748b',
    fontSize: 11,
    flex: 1,
    marginRight: 10,
  },
  detailsActionText: {
    color: '#5B9CFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
