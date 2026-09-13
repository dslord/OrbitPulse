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

          {/* Option 1: ISS Location */}
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
            <Text style={styles.numberBadge}>1</Text>
            <Image
              source={require('../../assets/iss_icon.png')}
              style={styles.cardIconIss}
            />
          </TouchableOpacity>

          {/* Option 2: Meteor Threat Feed */}
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
            <Text style={styles.numberBadge}>2</Text>
            <Image
              source={require('../../assets/meteor_icon.png')}
              style={styles.cardIconMeteor}
            />
          </TouchableOpacity>

          {/* Option 3: Space Updates */}
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
            <Text style={styles.numberBadge}>3</Text>
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
});
