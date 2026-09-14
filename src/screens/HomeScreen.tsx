import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { themeMode, activeTheme, colors, setThemeMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={require('../../assets/bg_image.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 16) + 8 },
          ]}
        >
          {/* TOP BAR WITH THEME SWITCHER */}
          <View style={styles.topBar}>
            <View style={styles.headerContainer}>
              <Text style={[styles.titleText, { color: '#FFFFFF' }]}>OrbitPulse</Text>
              <Text style={[styles.subtitleText, { color: colors.primaryAccent }]}>
                Real-Time Space Telemetry
              </Text>
            </View>

            {/* COMPACT SEGMENTED THEME SWITCHER */}
            <View
              style={[
                styles.themeSwitcher,
                {
                  backgroundColor: colors.raisedSurface,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => {
                const isActive = themeMode === mode;
                const label = mode === 'system' ? 'Sys' : mode === 'light' ? 'Light' : 'Dark';
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setThemeMode(mode)}
                    activeOpacity={0.7}
                    style={[
                      styles.themeTab,
                      isActive && {
                        backgroundColor: colors.selectedSurface,
                        borderColor: colors.selectedIndicator,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.themeTabText,
                        { color: isActive ? colors.selectedText : colors.textMuted },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Option 1: Space Agencies */}
          <TouchableOpacity
            style={[
              styles.routeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SpaceAgencies')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>Space Agencies</Text>
              <Text style={[styles.routeSubtitle, { color: colors.textMuted }]}>
                Global Space Organizations Directory
              </Text>
              <Text style={[styles.knowMoreText, { color: colors.primaryAccent }]}>
                Explore Directory &rarr;
              </Text>
            </View>
            <Text style={[styles.numberBadge, { color: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>1</Text>
            <Image
              source={require('../../assets/space_agencies.png')}
              style={styles.cardIconRocket}
            />
          </TouchableOpacity>

          {/* Option 2: Mission Explorer */}
          <TouchableOpacity
            style={[
              styles.routeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MissionExplorer')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>Mission Explorer</Text>
              <Text style={[styles.routeSubtitle, { color: colors.textMuted }]}>
                Browse Deep Space & Lunar Probes
              </Text>
              <Text style={[styles.knowMoreText, { color: colors.primaryAccent }]}>
                Explore Missions &rarr;
              </Text>
            </View>
            <Text style={[styles.numberBadge, { color: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>2</Text>
            <Image
              source={require('../../assets/mission_explorer.png')}
              style={styles.cardIconRocket}
            />
          </TouchableOpacity>

          {/* Option 3: Today in Space */}
          <TouchableOpacity
            style={[
              styles.routeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('TodayInSpace')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>Today in Space</Text>
              <Text style={[styles.routeSubtitle, { color: colors.textMuted }]}>
                Daily Missions, ISS & News Snapshot
              </Text>
              <Text style={[styles.knowMoreText, { color: colors.primaryAccent }]}>
                Open Dashboard &rarr;
              </Text>
            </View>
            <Text style={[styles.numberBadge, { color: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>3</Text>
            <Image
              source={require('../../assets/today_in_space.png')}
              style={styles.cardIconRocket}
            />
          </TouchableOpacity>

          {/* Option 4: ISS Location */}
          <TouchableOpacity
            style={[
              styles.routeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ISSlocator')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>ISS Location</Text>
              <Text style={[styles.routeSubtitle, { color: colors.textMuted }]}>
                Live Satellite Tracking
              </Text>
              <Text style={[styles.knowMoreText, { color: colors.primaryAccent }]}>
                Explore Map &rarr;
              </Text>
            </View>
            <Text style={[styles.numberBadge, { color: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>4</Text>
            <Image
              source={require('../../assets/iss_location.png')}
              style={styles.cardIconIss}
            />
          </TouchableOpacity>

          {/* Option 5: ISS Next-Pass */}
          <TouchableOpacity
            style={[
              styles.routeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ISSPass')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>ISS Next-Pass</Text>
              <Text style={[styles.routeSubtitle, { color: colors.textMuted }]}>
                Pass Times & Horizon Visibility
              </Text>
              <Text style={[styles.knowMoreText, { color: colors.primaryAccent }]}>
                Calculate Pass &rarr;
              </Text>
            </View>
            <Text style={[styles.numberBadge, { color: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>5</Text>
            <Image
              source={require('../../assets/next_pass.png')}
              style={styles.cardIconPass}
            />
          </TouchableOpacity>

          {/* Option 6: Spacecraft Tracker */}
          <TouchableOpacity
            style={[
              styles.routeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SpacecraftTracker')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>Spacecraft Tracker</Text>
              <Text style={[styles.routeSubtitle, { color: colors.textMuted }]}>
                Deep Space Probes & Telemetry
              </Text>
              <Text style={[styles.knowMoreText, { color: colors.primaryAccent }]}>
                Track Spacecraft &rarr;
              </Text>
            </View>
            <Text style={[styles.numberBadge, { color: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>6</Text>
            <Image
              source={require('../../assets/spacecraft_tracker.png')}
              style={styles.cardIconRocket}
            />
          </TouchableOpacity>

          {/* Option 7: Launch Tracker */}
          <TouchableOpacity
            style={[
              styles.routeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('LaunchTracker')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>Launch Tracker</Text>
              <Text style={[styles.routeSubtitle, { color: colors.textMuted }]}>
                Live Space Missions & Schedules
              </Text>
              <Text style={[styles.knowMoreText, { color: colors.primaryAccent }]}>
                View Launches &rarr;
              </Text>
            </View>
            <Text style={[styles.numberBadge, { color: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>7</Text>
            <Image
              source={require('../../assets/launch_icon.png')}
              style={styles.cardIconLaunch}
            />
          </TouchableOpacity>

          {/* Option 8: Satellite Explorer */}
          <TouchableOpacity
            style={[
              styles.routeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SatelliteExplorer')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>Satellite Explorer</Text>
              <Text style={[styles.routeSubtitle, { color: colors.textMuted }]}>
                Browse & Track Satellites
              </Text>
              <Text style={[styles.knowMoreText, { color: colors.primaryAccent }]}>
                Explore Satellites &rarr;
              </Text>
            </View>
            <Text style={[styles.numberBadge, { color: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>8</Text>
            <Image
              source={require('../../assets/satellite_explorer.png')}
              style={styles.cardIconRocket}
            />
          </TouchableOpacity>

          {/* Option 9: Meteor Feed */}
          <TouchableOpacity
            style={[
              styles.routeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Meteor')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>Meteor Feed</Text>
              <Text style={[styles.routeSubtitle, { color: colors.textMuted }]}>
                NASA Near-Earth Objects
              </Text>
              <Text style={[styles.knowMoreText, { color: colors.primaryAccent }]}>
                Analyze Threats &rarr;
              </Text>
            </View>
            <Text style={[styles.numberBadge, { color: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>9</Text>
            <Image
              source={require('../../assets/meteor_feed.png')}
              style={styles.cardIconMeteor}
            />
          </TouchableOpacity>

          {/* Option 10: Space Updates */}
          <TouchableOpacity
            style={[
              styles.routeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Updates')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>Space Updates</Text>
              <Text style={[styles.routeSubtitle, { color: colors.textMuted }]}>
                Live Telemetry & News
              </Text>
              <Text style={[styles.knowMoreText, { color: colors.primaryAccent }]}>
                Read Updates &rarr;
              </Text>
            </View>
            <Text style={[styles.numberBadge, { color: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>10</Text>
            <Image
              source={require('../../assets/space_updates.png')}
              style={styles.cardIconRocket}
            />
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'stretch',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  themeSwitcher: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    marginLeft: 10,
    marginTop: 2,
  },
  themeTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeTabText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  routeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    minHeight: 125,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'visible',
    borderWidth: 1,
    position: 'relative',
  },
  cardTextContainer: {
    flex: 1,
    paddingRight: 60,
    zIndex: 2,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  routeSubtitle: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 16,
  },
  knowMoreText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  numberBadge: {
    fontSize: 50,
    fontWeight: '900',
    position: 'absolute',
    right: 12,
    bottom: 2,
    zIndex: 1,
  },
  cardIconIss: {
    resizeMode: 'contain',
    height: 85,
    width: 85,
    position: 'absolute',
    right: 8,
    top: -20,
    zIndex: 3,
  },
  cardIconMeteor: {
    resizeMode: 'contain',
    height: 100,
    width: 100,
    position: 'absolute',
    right: 0,
    top: -24,
    zIndex: 3,
  },
  cardIconRocket: {
    resizeMode: 'contain',
    height: 90,
    width: 90,
    position: 'absolute',
    right: 5,
    top: -20,
    zIndex: 3,
  },
  cardIconLaunch: {
    resizeMode: 'contain',
    height: 110,
    width: 110,
    position: 'absolute',
    right: 0,
    top: -24,
    zIndex: 3,
  },
  cardIconPass: {
    resizeMode: 'contain',
    height: 105,
    width: 105,
    position: 'absolute',
    right: 0,
    top: -20,
    zIndex: 3,
  },
});
