/**
 * Navigateur principal de l'application
 * Utilise des Material Top Tabs pour permettre la navigation
 * par swipe entre les 3 vues : Home, Record et RAVE
 */

import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import RecordScreen from '../screens/RecordScreen';
import RaveScreen from '../screens/RaveScreen';

const Tab = createMaterialTopTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: '#888',
        tabBarIndicatorStyle: { backgroundColor: '#6200EE' },
        tabBarShowIcon: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', textTransform: 'none' },
        tabBarStyle: { elevation: 4, shadowOpacity: 0.15 },
        swipeEnabled: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="mic" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RAVE"
        component={RaveScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="musical-notes" size={20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
