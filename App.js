import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import LoginScreen from './src/screens/auth/LoginScreen';
import DiaryScreen from './src/screens/main/DiaryScreen';
import SearchScreen from './src/screens/main/SearchScreen';
import LogEntryNotesScreen from './src/screens/main/LogEntryNotesScreen';

import { colors } from './src/theme/colors';
import { AUTH_DISABLED } from './src/utils/config';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

const DevSetupScreen = () => (
  <View style={[styles.loadingContainer, styles.setupPad]}>
    <Text style={styles.setupTitle}>Could not load profile</Text>
    <Text style={styles.setupText}>
      Start the backend and MongoDB, and ensure src/utils/config.js API_BASE_URL matches your API
      (e.g. http://localhost:5001). The dev user is created automatically on first request.
    </Text>
  </View>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarStyle: {
        backgroundColor: colors.background,
        borderTopColor: colors.cardBorder,
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.foregroundMuted,
      headerStyle: {
        backgroundColor: colors.background,
        borderBottomColor: colors.cardBorder,
        borderBottomWidth: 1,
      },
      headerTintColor: colors.foreground,
    }}
  >
    <Tab.Screen
      name="Diary"
      component={DiaryScreen}
      options={{
        title: 'Diary',
      }}
    />
    <Tab.Screen
      name="Search"
      component={SearchScreen}
      options={{
        title: 'Search',
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (AUTH_DISABLED) {
    if (!user) {
      return <DevSetupScreen />;
    }
    return (
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
            borderBottomColor: colors.cardBorder,
            borderBottomWidth: 1,
          },
          headerTintColor: colors.foreground,
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="LogEntryNotes"
          component={LogEntryNotesScreen}
          options={{ title: 'Note' }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomColor: colors.cardBorder,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.foreground,
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="LogEntryNotes"
            component={LogEntryNotesScreen}
            options={{ title: 'Note' }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.foregroundMuted,
    marginTop: 10,
    fontSize: 16,
  },
  setupPad: {
    paddingHorizontal: 24,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 12,
    textAlign: 'center',
  },
  setupText: {
    color: colors.foregroundMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default App;
