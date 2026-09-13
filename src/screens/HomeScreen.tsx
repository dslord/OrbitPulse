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

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/bg_image.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 16) + 12 },
          ]}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.titleText}>OrbitPulse</Text>
            <Text style={styles.subtitleText}>Real-Time ISS & Space Telemetry</Text>
          </View>

          {/* Option 1: Space Agencies */}
          <TouchableOpacity
            style={styles.routeCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SpaceAgencies')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={styles.routeTitle}>Space Agencies</Text>
              <Text style={styles.routeSubtitle}>Global Space Organizations Directory</Text>
              <Text style={styles.knowMoreText}>Explore Directory &rarr;</Text>
            </View>
            <Text style={styles.numberBadge}>1</Text>
            <Image
              source={require('../../assets/space_agencies.png')}
              style={styles.cardIconRocket}
            />
          </TouchableOpacity>

          {/* Option 2: Mission Explorer */}
          <TouchableOpacity
            style={styles.routeCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MissionExplorer')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={styles.routeTitle}>Mission Explorer</Text>
              <Text style={styles.routeSubtitle}>Browse Deep Space & Lunar Probes</Text>
              <Text style={styles.knowMoreText}>Explore Missions &rarr;</Text>
            </View>
            <Text style={styles.numberBadge}>2</Text>
            <Image
              source={require('../../assets/mission_explorer.png')}
              style={styles.cardIconRocket}
            />
          </TouchableOpacity>

          {/* Option 3: Today in Space */}
          <TouchableOpacity
            style={styles.routeCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('TodayInSpace')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={styles.routeTitle}>Today in Space</Text>
              <Text style={styles.routeSubtitle}>Daily Missions, ISS & News Snapshot</Text>
              <Text style={styles.knowMoreText}>Open Dashboard &rarr;</Text>
            </View>
            <Text style={styles.numberBadge}>3</Text>
            <Image
              source={require('../../assets/blog_icon.png')}
              style={styles.cardIconRocket}
            />
          </TouchableOpacity>

          {/* Option 4: ISS Location */}
          <TouchableOpacity
            style={styles.routeCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ISSlocator')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={styles.routeTitle}>ISS Location</Text>
              <Text style={styles.routeSubtitle}>Live Satellite Tracking</Text>
              <Text style={styles.knowMoreText}>Explore Map &rarr;</Text>
            </View>
            <Text style={styles.numberBadge}>4</Text>
            <Image
              source={require('../../assets/iss_icon.png')}
              style={styles.cardIconIss}
            />
          </TouchableOpacity>

          {/* Option 5: ISS Next-Pass */}
          <TouchableOpacity
            style={styles.routeCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ISSPass')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={styles.routeTitle}>ISS Next-Pass</Text>
              <Text style={styles.routeSubtitle}>Pass Times & Horizon Visibility</Text>
              <Text style={styles.knowMoreText}>Calculate Pass &rarr;</Text>
            </View>
            <Text style={styles.numberBadge}>5</Text>
            <Image
              source={require('../../assets/next_pass.png')}
              style={styles.cardIconPass}
            />
          </TouchableOpacity>

          {/* Option 6: Launch Tracker */}
          <TouchableOpacity
            style={styles.routeCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('LaunchTracker')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={styles.routeTitle}>Launch Tracker</Text>
              <Text style={styles.routeSubtitle}>Live Space Missions & Schedules</Text>
              <Text style={styles.knowMoreText}>View Launches &rarr;</Text>
            </View>
            <Text style={styles.numberBadge}>6</Text>
            <Image
              source={require('../../assets/launch_icon.png')}
              style={styles.cardIconLaunch}
            />
          </TouchableOpacity>

          {/* Option 7: Satellite Explorer */}
          <TouchableOpacity
            style={styles.routeCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SatelliteExplorer')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={styles.routeTitle}>Satellite Explorer</Text>
              <Text style={styles.routeSubtitle}>Browse & Track Satellites</Text>
              <Text style={styles.knowMoreText}>Explore Satellites &rarr;</Text>
            </View>
            <Text style={styles.numberBadge}>7</Text>
            <Image
              source={require('../../assets/satellite_explorer.png')}
              style={styles.cardIconRocket}
            />
          </TouchableOpacity>

          {/* Option 8: Meteor Threat Feed */}
          <TouchableOpacity
            style={styles.routeCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Meteor')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={styles.routeTitle}>Meteor Feed</Text>
              <Text style={styles.routeSubtitle}>NASA Near-Earth Objects</Text>
              <Text style={styles.knowMoreText}>Analyze Threats &rarr;</Text>
            </View>
            <Text style={styles.numberBadge}>8</Text>
            <Image
              source={require('../../assets/meteor_icon.png')}
              style={styles.cardIconMeteor}
            />
          </TouchableOpacity>

          {/* Option 9: Space Updates */}
          <TouchableOpacity
            style={styles.routeCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Updates')}
          >
            <View style={styles.cardTextContainer}>
              <Text style={styles.routeTitle}>Space Updates</Text>
              <Text style={styles.routeSubtitle}>Live Telemetry & News</Text>
              <Text style={styles.knowMoreText}>Read Updates &rarr;</Text>
            </View>
            <Text style={styles.numberBadge}>9</Text>
            <Image
              source={require('../../assets/rocket_icon.png')}
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
    backgroundColor: '#0b0d1b',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'stretch',
  },
  headerContainer: {
    marginTop: 0,
    marginBottom: 25,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 34,
    color: '#ffffff',
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 212, 255, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitleText: {
    fontSize: 14,
    color: '#00d4ff',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.8,
  },
  routeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    minHeight: 140,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'visible',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  cardTextContainer: {
    flex: 1,
    paddingRight: 60,
    zIndex: 2,
  },
  routeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0b0d1b',
  },
  routeSubtitle: {
    fontSize: 13,
    color: '#4a5568',
    marginTop: 4,
    fontWeight: '500',
  },
  knowMoreText: {
    marginTop: 15,
    fontSize: 14,
    color: '#e53e3e',
    fontWeight: 'bold',
  },
  numberBadge: {
    fontSize: 60,
    color: 'rgba(0, 0, 0, 0.08)',
    fontWeight: '900',
    position: 'absolute',
    right: 15,
    bottom: 5,
    zIndex: 1,
  },
  cardIconIss: {
    resizeMode: 'contain',
    height: 90,
    width: 90,
    position: 'absolute',
    right: 10,
    top: -25,
    zIndex: 3,
  },
  cardIconMeteor: {
    resizeMode: 'contain',
    height: 110,
    width: 110,
    position: 'absolute',
    right: 0,
    top: -30,
    zIndex: 3,
  },
  cardIconRocket: {
    resizeMode: 'contain',
    height: 100,
    width: 100,
    position: 'absolute',
    right: 5,
    top: -25,
    zIndex: 3,
  },
  cardIconLaunch: {
    resizeMode: 'contain',
    height: 120,
    width: 120,
    position: 'absolute',
    right: 0,
    top: -30,
    zIndex: 3,
  },
  cardIconPass: {
    resizeMode: 'contain',
    height: 115,
    width: 115,
    position: 'absolute',
    right: 0,
    top: -25,
    zIndex: 3,
  },
});
