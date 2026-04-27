import React from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { configurePlatformApiRuntime } from '../lib/session';
import { nativeSessionConfig } from '../lib/platform/native/sessionConfig';
import { nativeSessionStorage } from '../lib/platform/native/sessionStorageAdapter';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import DiaryScreen from '../screens/main/DiaryScreen';
import SearchScreen from '../screens/main/SearchScreen';
import HomeScreen from '../screens/main/HomeScreen';
import NetworkScreen from '../screens/main/NetworkScreen';
import ActivityScreen from '../screens/main/ActivityScreen';
import ListsScreen from '../screens/main/ListsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import PublicProfileScreen from '../screens/main/PublicProfileScreen';
import FollowersScreen from '../screens/main/FollowersScreen';
import FollowingScreen from '../screens/main/FollowingScreen';
import LogEntryNotesScreen from '../screens/main/LogEntryNotesScreen';
import AlbumPageScreen from '../screens/main/AlbumPageScreen';
import ArtistPageScreen from '../screens/main/ArtistPageScreen';
import MyReviewsScreen from '../screens/main/MyReviewsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

configurePlatformApiRuntime({
  baseUrl: nativeSessionConfig.baseUrl,
  sessionStorage: nativeSessionStorage,
});

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.mist,
    text: colors.foreground,
    border: colors.cardBorder,
    primary: colors.accent,
  },
};

function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.loadingText}>Loading your music diary…</Text>
    </View>
  );
}

function screenHeaderOptions(title) {
  return {
    title,
    headerStyle: { backgroundColor: colors.mist },
    headerTintColor: colors.foreground,
    headerTitleStyle: { fontWeight: '700' },
    contentStyle: { backgroundColor: colors.background },
  };
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(202, 210, 197, 0.94)',
          borderTopColor: colors.cardBorder,
          height: 78,
          paddingTop: 10,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.foregroundMuted,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Search' }} />
      <Tab.Screen name="NetworkTab" component={NetworkScreen} options={{ title: 'Network' }} />
      <Tab.Screen name="ActivityTab" component={ActivityScreen} options={{ title: 'Activity' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={screenHeaderOptions('Music Diary')}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={screenHeaderOptions('Music Diary')}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Diary" component={DiaryScreen} options={{ title: 'Diary' }} />
      <Stack.Screen name="Lists" component={ListsScreen} options={{ title: 'Lists' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Followers" component={FollowersScreen} options={{ title: 'Followers' }} />
      <Stack.Screen name="Following" component={FollowingScreen} options={{ title: 'Following' }} />
      <Stack.Screen name="LogEntryNotes" component={LogEntryNotesScreen} options={{ title: 'Add Note' }} />
      <Stack.Screen name="AlbumPage" component={AlbumPageScreen} options={{ title: 'Album' }} />
      <Stack.Screen name="ArtistPage" component={ArtistPageScreen} options={{ title: 'Artist' }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: 'My Reviews' }} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading, authDisabled } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user && !authDisabled) {
    return <AuthNavigator />;
  }

  return <AppNavigator />;
}

export default function NativeApp() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    color: colors.foreground,
    fontSize: 16,
    textAlign: 'center',
  },
});
