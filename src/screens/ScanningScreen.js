import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, TouchableOpacity, Modal, Button } from 'react-native';
import { db } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

const ScanningScreen = ({ navigation }) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const { user } = useAuth();
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingSale, setPendingSale] = useState(null); // {product, quantity, price, inventoryAfter, date}

  const handleBarcodeScanned = async (barcode) => {
    try {
      const product = await db.getProductByBarcode(barcode, user.id);

      if (product) {
        // Prompt for quantity
        Alert.prompt(
          'Sell Product',
          `Enter quantity to sell for "${product.product_name}" (Available: ${product.quantity ?? 1})`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Next',
              onPress: (qty) => {
                const quantityToSell = parseInt(qty, 10) || 1;
                if (isNaN(quantityToSell) || quantityToSell < 1) {
                  Alert.alert('Error', 'Please enter a valid quantity.');
                  return;
                }
                // Prompt for price
                Alert.prompt(
                  'Sale Price',
                  `Enter sale price for "${product.product_name}" (Default: ${product.price ?? 0})`,
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Review',
                      onPress: (enteredPrice) => {
                        const salePrice = parseFloat(enteredPrice);
                        const storedPrice = parseFloat(product.price) || 0;
                        if (isNaN(salePrice) || salePrice < 0) {
                          Alert.alert('Error', 'Please enter a valid price.');
                          return;
                        }
                        if (salePrice !== storedPrice) {
                          Alert.alert('Warning', 'Entered price does not match the product price. Please double-check for accuracy.');
                        }
                        // Prepare confirmation modal
                        const currentQty = product.quantity ?? 1;
                        if (quantityToSell > currentQty) {
                          Alert.alert('Error', 'Not enough quantity in stock.');
                          return;
                        }
                        setPendingSale({
                          product,
                          quantity: quantityToSell,
                          price: salePrice,
                          inventoryAfter: Math.max(currentQty - quantityToSell, 0),
                          date: new Date(),
                        });
                        setConfirmModalVisible(true);
                      },
                    },
                  ],
                  'plain-text',
                  String(product.price ?? 0)
                );
              },
            },
          ],
          'plain-text',
          '1'
        );
      } else {
        Alert.alert('Product Not Found', 'This barcode is not in your inventory. Add it now?', [
          { text: 'Yes', onPress: () => navigation.navigate('ProductManagement', { scannedBarcode: barcode }) },
          { text: 'No', onPress: () => setBarcodeInput('') }, // Clear input
        ]);
      }
    } catch (error) {
      console.error('Error in handleBarcodeScanned:', error);
      Alert.alert('Error', 'An error occurred while processing the barcode. Please try again.');
    }
  };

  const handleConfirmSale = async () => {
    if (!pendingSale) return;
    const { product, quantity, price, inventoryAfter, date } = pendingSale;
    try {
      // Fetch latest product data
      const latest = await db.getProductById(product.id);
      const currentQty = latest?.quantity ?? 1;
      if (quantity > currentQty) {
        Alert.alert('Error', 'Not enough quantity in stock.');
        setConfirmModalVisible(false);
        setPendingSale(null);
        return;
      }
      // Update product quantity
      await db.updateProduct(product.id, {
        quantity: inventoryAfter,
      });
      // Log the sale with price and quantity
      const saleRecord = await db.addSale({
        product_id: product.id,
        product_name: product.product_name,
        barcode: product.barcode,
        user_id: user.id,
        category: product.category,
        price,
        quantity,
      });
      setConfirmModalVisible(false);
      setPendingSale(null);
      Alert.alert(
        'Sale Completed',
        `Sale completed! ${quantity} units of ${product.product_name} sold at $${price.toFixed(2)} each.\nInventory updated and transaction recorded.\n\nTransaction ID: ${saleRecord?.id || 'N/A'}\nDate/Time: ${date.toLocaleString()}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to complete sale.');
      setConfirmModalVisible(false);
      setPendingSale(null);
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
      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Sale</Text>
            {pendingSale && (
              <>
                <Text style={styles.modalText}>Product Sold: {pendingSale.product.product_name}</Text>
                <Text style={styles.modalText}>Quantity Sold: {pendingSale.quantity}</Text>
                <Text style={styles.modalText}>Sale Price (per unit): ${pendingSale.price.toFixed(2)}</Text>
                <Text style={styles.modalText}>Total Sale Amount: ${(pendingSale.quantity * pendingSale.price).toFixed(2)}</Text>
                <Text style={styles.modalText}>Inventory Deducted: {pendingSale.quantity}</Text>
                <Text style={styles.modalText}>Inventory Remaining: {pendingSale.inventoryAfter}</Text>
                <Text style={styles.modalText}>Date/Time: {pendingSale.date.toLocaleString()}</Text>
              </>
            )}
            <View style={styles.modalButtonRow}>
              <Button title="Cancel" onPress={() => { setConfirmModalVisible(false); setPendingSale(null); }} color="#888" />
              <Button title="Confirm" onPress={handleConfirmSale} color="#007AFF" />
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    alignItems: 'flex-start',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    alignSelf: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 6,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 18,
  },
});

export default ScanningScreen;
