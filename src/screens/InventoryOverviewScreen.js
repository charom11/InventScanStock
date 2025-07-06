import React from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

const InventoryOverviewScreen = ({ navigation }) => {
  const { user, logOut } = useAuth();

  const handleLogout = () => {
    logOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory Overview</Text>
      {user && (
        <Text style={styles.welcomeText}>Welcome, {user.username}!</Text>
      )}
      <View style={styles.buttonContainer}>
        <Button
          title="Scan Barcode"
          onPress={() => navigation.navigate('Scanning')}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="View Sales History"
          onPress={() => navigation.navigate('SalesHistory')}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Manage Products"
          onPress={() => navigation.navigate('ProductManagement')}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="User Profile"
          onPress={() => navigation.navigate('UserProfile')}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Debug Console"
          onPress={() => navigation.navigate('Debug')}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '80%',
    marginVertical: 10,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InventoryOverviewScreen;
