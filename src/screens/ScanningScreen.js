import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, TouchableOpacity } from 'react-native';
import { getDBConnection, getProductByBarcode, addSale } from '../database/database';
import { useAuth } from '../context/AuthContext';

const ScanningScreen = ({ navigation }) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const { user } = useAuth();

  const handleBarcodeScanned = async (barcode) => {
    try {
      const db = await getDBConnection();
      const product = await getProductByBarcode(db, barcode);

      if (product) {
        await addSale(db, { productId: product.product_id, userId: user.id });
        Alert.alert('Sale Logged', `${product.product_name} sold.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Product Not Found', 'This barcode is not in your inventory. Add it now?', [
          { text: 'Yes', onPress: () => navigation.navigate('ProductManagement', { scannedBarcode: barcode }) },
          { text: 'No', onPress: () => setBarcodeInput('') }, // Clear input
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while processing the barcode.');
    }
  };

  const handleManualScan = () => {
    if (barcodeInput.trim()) {
      handleBarcodeScanned(barcodeInput.trim());
    } else {
      Alert.alert('Error', 'Please enter a barcode');
  }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Barcode Entry</Text>
      <Text style={styles.subtitle}>Enter barcode manually (camera scanning temporarily disabled)</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter barcode"
          value={barcodeInput}
          onChangeText={setBarcodeInput}
          keyboardType="numeric"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.scanButton} onPress={handleManualScan}>
          <Text style={styles.scanButtonText}>Process Barcode</Text>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScanningScreen;
