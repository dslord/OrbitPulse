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

type Props = NativeStackScreenProps<RootStackParamList, 'SpaceAgencies'>;

export default function SpaceAgenciesScreen({ navigation }: Props) {
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
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>GLOBAL SPACE AGENCIES</Text>
            <Text style={styles.headerSubtitle}>
              Curated Directory of Real-World Civil Space & Research Organizations
            </Text>
          </View>

          {/* SEARCH INPUT BAR */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search agency name, abbreviation, or country..."
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

          {/* AGENCY CARDS LIST */}
          {filteredAgencies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Agencies Found</Text>
              <Text style={styles.emptyText}>
                No space agencies match "{searchQuery}". Try searching for another agency name or country.
              </Text>
            </View>
          ) : (
            filteredAgencies.map((agency: SpaceAgency) => {
              const isExpanded = expandedId === agency.id;

              return (
                <View key={agency.id} style={styles.agencyCard}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(agency.id)}
                    style={styles.cardHeaderRow}
                  >
                    <View style={[styles.avatarBadge, { backgroundColor: agency.badgeColor }]}>
                      <Text style={styles.avatarText}>{agency.abbreviation}</Text>
                    </View>

                    <View style={styles.agencyHeaderContent}>
                      <Text style={styles.agencyAbbrev}>{agency.abbreviation}</Text>
                      <Text style={styles.agencyFullName} numberOfLines={2}>
                        {agency.name}
                      </Text>
                      <Text style={styles.agencyCountry}>{agency.countryOrRegion}</Text>
                    </View>

                    <Text style={styles.expandToggleText}>
                      {isExpanded ? 'Hide ▲' : 'Details ▼'}
                    </Text>
                  </TouchableOpacity>

                  {/* EXPANDABLE DETAILS */}
                  {isExpanded && (
                    <View style={styles.detailsContainer}>
                      <View style={styles.metaRow}>
                        <View style={styles.metaBadge}>
                          <Text style={styles.metaLabel}>Est. Year</Text>
                          <Text style={styles.metaValue}>{agency.establishedYear}</Text>
                        </View>
                        <View style={[styles.metaBadge, styles.metaBadgeFlex]}>
                          <Text style={styles.metaLabel}>Headquarters</Text>
                          <Text style={styles.metaValue} numberOfLines={1}>
                            {agency.headquarters}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.descriptionText}>{agency.description}</Text>

                      <TouchableOpacity
                        style={[styles.websiteButton, { borderColor: agency.badgeColor }]}
                        activeOpacity={0.8}
                        onPress={() => handleOpenWebsite(agency.websiteUrl)}
                      >
                        <Text style={styles.websiteButtonText}>
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
    marginBottom: 16,
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
  emptyContainer: {
    backgroundColor: '#161936',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
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
  },
  agencyCard: {
    backgroundColor: '#161936',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  agencyHeaderContent: {
    flex: 1,
    marginRight: 10,
  },
  agencyAbbrev: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  agencyFullName: {
    color: '#ffffff',
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
    color: '#00d4ff',
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
    backgroundColor: '#0b0d1b',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaBadgeFlex: {
    flex: 1,
    marginRight: 0,
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#ffffff',
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
    backgroundColor: '#0b0d1b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  websiteButtonText: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
