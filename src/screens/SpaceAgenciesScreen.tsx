import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { SPACE_AGENCIES, SpaceAgency } from '../data/spaceAgenciesData';
import { useTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'SpaceAgencies'>;

export default function SpaceAgenciesScreen({ navigation }: Props) {
  const { colors, activeTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter agencies based on query (name, abbreviation, or country/region)
  const filteredAgencies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return SPACE_AGENCIES;

    return SPACE_AGENCIES.filter(
      (agency) =>
        agency.name.toLowerCase().includes(query) ||
        agency.abbreviation.toLowerCase().includes(query) ||
        agency.countryOrRegion.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleOpenWebsite = (url: string) => {
    Linking.openURL(url).catch(() => {});
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
          {/* HEADER CARD */}
          <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>GLOBAL SPACE AGENCIES</Text>
            <Text style={[styles.headerSubtitle, { color: colors.primaryAccent }]}>
              Curated Directory of Real-World Civil Space & Research Organizations
            </Text>
          </View>

          {/* SEARCH INPUT BAR */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search agency name, abbreviation, or country..."
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

          {/* AGENCY CARDS LIST */}
          {filteredAgencies.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Agencies Found</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No space agencies match "{searchQuery}". Try searching for another agency name or country.
              </Text>
            </View>
          ) : (
            filteredAgencies.map((agency: SpaceAgency) => {
              const isExpanded = expandedId === agency.id;

              return (
                <View key={agency.id} style={[styles.agencyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(agency.id)}
                    style={styles.cardHeaderRow}
                  >
                    <View style={[styles.avatarBadge, { backgroundColor: agency.badgeColor }]}>
                      <Text style={styles.avatarText}>{agency.abbreviation}</Text>
                    </View>

                    <View style={styles.agencyHeaderContent}>
                      <Text style={[styles.agencyAbbrev, { color: colors.textPrimary }]}>{agency.abbreviation}</Text>
                      <Text style={[styles.agencyFullName, { color: colors.textMuted }]} numberOfLines={2}>
                        {agency.name}
                      </Text>
                      <Text style={[styles.agencyCountry, { color: colors.primaryAccent }]}>{agency.countryOrRegion}</Text>
                    </View>

                    <Text style={[styles.expandToggleText, { color: colors.primaryAccent }]}>
                      {isExpanded ? 'Hide ▲' : 'Details ▼'}
                    </Text>
                  </TouchableOpacity>

                  {/* EXPANDABLE DETAILS */}
                  {isExpanded && (
                    <View style={[styles.detailsContainer, { borderTopColor: colors.surfaceBorder }]}>
                      <View style={styles.metaRow}>
                        <View style={[styles.metaBadge, { backgroundColor: colors.raisedSurface }]}>
                          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Est. Year</Text>
                          <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{agency.establishedYear}</Text>
                        </View>
                        <View style={[styles.metaBadge, styles.metaBadgeFlex, { backgroundColor: colors.raisedSurface }]}>
                          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Headquarters</Text>
                          <Text style={[styles.metaValue, { color: colors.textPrimary }]} numberOfLines={1}>
                            {agency.headquarters}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{agency.description}</Text>

                      <TouchableOpacity
                        style={[styles.websiteButton, { borderColor: agency.badgeColor, backgroundColor: colors.surface }]}
                        activeOpacity={0.8}
                        onPress={() => handleOpenWebsite(agency.websiteUrl)}
                      >
                        <Text style={[styles.websiteButtonText, { color: colors.primaryAccent }]}>
                          Visit Official Website &rarr;
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
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
    backgroundColor: 'rgba(18, 22, 44, 0.92)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: '#5B9CFF',
    fontSize: 12,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 22, 44, 0.85)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.2)',
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#f8fafc',
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
  emptyContainer: {
    backgroundColor: 'rgba(18, 22, 44, 0.88)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.18)',
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  agencyCard: {
    backgroundColor: 'rgba(18, 22, 44, 0.92)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.18)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBadge: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  agencyHeaderContent: {
    flex: 1,
    marginRight: 10,
  },
  agencyAbbrev: {
    color: '#5B9CFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  agencyFullName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
  agencyCountry: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  expandToggleText: {
    color: '#5B9CFF',
    fontSize: 11,
    fontWeight: '700',
  },
  detailsContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  metaBadge: {
    backgroundColor: 'rgba(11, 13, 27, 0.85)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.15)',
  },
  metaBadgeFlex: {
    flex: 1,
    marginRight: 0,
  },
  metaLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 1,
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  websiteButton: {
    backgroundColor: 'rgba(11, 13, 27, 0.85)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  websiteButtonText: {
    color: '#5B9CFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
