import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ISSlocatorScreen from '../screens/ISSlocatorScreen';
import MeteorScreen from '../screens/MeteorScreen';
import UpdatesScreen from '../screens/UpdatesScreen';
import SpaceNewsScreen from '../screens/SpaceNewsScreen';
import SatelliteExplorerScreen from '../screens/SatelliteExplorerScreen';
import LaunchTrackerScreen from '../screens/LaunchTrackerScreen';
import LaunchDetailsScreen from '../screens/LaunchDetailsScreen';
import ISSPassScreen from '../screens/ISSPassScreen';
import AsteroidDetailsScreen from '../screens/AsteroidDetailsScreen';
import TodayInSpaceScreen from '../screens/TodayInSpaceScreen';
import SpaceAgenciesScreen from '../screens/SpaceAgenciesScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0b0d1b',
          },
          headerTintColor: '#00d4ff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
            color: '#ffffff',
          },
          contentStyle: { backgroundColor: '#0b0d1b' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ISSlocator"
          component={ISSlocatorScreen}
          options={{
            title: 'ISS Location Tracker',
          }}
        />
        <Stack.Screen
          name="SatelliteExplorer"
          component={SatelliteExplorerScreen}
          options={{
            title: 'Satellite Explorer',
          }}
        />
        <Stack.Screen
          name="LaunchTracker"
          component={LaunchTrackerScreen}
          options={{
            title: 'Space Launch Tracker',
          }}
        />
        <Stack.Screen
          name="LaunchDetails"
          component={LaunchDetailsScreen}
          options={{
            title: 'Launch Details',
          }}
        />
        <Stack.Screen
          name="ISSPass"
          component={ISSPassScreen}
          options={{
            title: 'ISS Next-Pass & Visibility',
          }}
        />
        <Stack.Screen
          name="Meteor"
          component={MeteorScreen}
          options={{
            title: 'Meteor Threat Feed',
          }}
        />
        <Stack.Screen
          name="AsteroidDetails"
          component={AsteroidDetailsScreen}
          options={{
            title: 'Asteroid Radar & Details',
          }}
        />
        <Stack.Screen
          name="TodayInSpace"
          component={TodayInSpaceScreen}
          options={{
            title: 'Today in Space',
          }}
        />
        <Stack.Screen
          name="SpaceAgencies"
          component={SpaceAgenciesScreen}
          options={{
            title: 'Space Agencies Directory',
          }}
        />
        <Stack.Screen
          name="Updates"
          component={UpdatesScreen}
          options={{
            title: 'Space Telemetry & Updates',
          }}
        />
        <Stack.Screen
          name="SpaceNews"
          component={SpaceNewsScreen}
          options={{
            title: 'Spaceflight News',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
