import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginPage from '../screens/LoginPage';
import SignupPage from '../screens/SignupPage';
import ScanningScreen from '../screens/ScanningScreen';
import InventoryOverviewScreen from '../screens/InventoryOverviewScreen';
import SalesHistoryScreen from '../screens/SalesHistoryScreen';
import ProductManagementScreen from '../screens/ProductManagementScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import DebugScreen from '../screens/DebugScreen';

const Stack = createStackNavigator();

// Logout button component
const LogoutButton = () => {
  const { logOut } = useAuth();
  
  return (
    <TouchableOpacity
      onPress={logOut}
      style={styles.logoutButton}
    >
      <Text style={styles.logoutButtonText}>Logout</Text>
    </TouchableOpacity>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Loading will be handled by AuthProvider
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginPage} />
            <Stack.Screen name="Signup" component={SignupPage} />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen 
              name="InventoryOverview" 
              component={InventoryOverviewScreen}
              options={{ 
                headerShown: true,
                title: 'Inventory',
                headerRight: LogoutButton,
              }}
            />
            <Stack.Screen 
              name="Scanning" 
              component={ScanningScreen}
              options={{ 
                headerShown: true,
                title: 'Scan Barcode',
              }}
            />
            <Stack.Screen 
              name="SalesHistory" 
              component={SalesHistoryScreen}
              options={{ 
                headerShown: true,
                title: 'Sales History',
              }}
            />
            <Stack.Screen 
              name="ProductManagement" 
              component={ProductManagementScreen}
              options={{ 
                headerShown: true,
                title: 'Manage Products',
              }}
            />
            <Stack.Screen 
              name="UserProfile" 
              component={UserProfileScreen}
              options={{ 
                headerShown: true,
                title: 'User Profile',
              }}
            />
            <Stack.Screen 
              name="Debug" 
              component={DebugScreen}
              options={{ 
                headerShown: true,
                title: 'Debug Console',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 15,
  },
  logoutButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default AppNavigator;
