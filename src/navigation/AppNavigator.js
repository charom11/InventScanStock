import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginPage from '../screens/LoginPage';
import SignupPage from '../screens/SignupPage';
import ScanningScreen from '../screens/ScanningScreen';
import InventoryOverviewScreen from '../screens/InventoryOverviewScreen';
import SalesHistoryScreen from '../screens/SalesHistoryScreen';
import ProductManagementScreen from '../screens/ProductManagementScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

const Stack = createStackNavigator();

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
                headerRight: () => (
                  <LogoutButton />
                ),
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Logout button component
const LogoutButton = () => {
  const { logOut } = useAuth();
  
  return (
    <TouchableOpacity
      onPress={logOut}
      style={{ marginRight: 15 }}
    >
      <Text style={{ color: '#007AFF', fontSize: 16 }}>Logout</Text>
    </TouchableOpacity>
  );
};

export default AppNavigator;
