import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Modal, Alert, TextInput } from 'react-native';
import { db } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import DropDownPicker from 'react-native-dropdown-picker';

const SellProductScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingSale, setPendingSale] = useState(null);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productDropdownItems, setProductDropdownItems] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productList = await db.getProducts(user.id);
        setProducts(productList);
        setProductDropdownItems(productList.map(p => ({ label: p.product_name, value: p.id })));
      } catch (error) {
        Alert.alert('Error', 'Failed to load products.');
      }
    };
    loadProducts();
  }, [user.id]);

  const handleReview = () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product.');
      return;
    }
    const product = products.find(p => p.id === selectedProduct);
    const quantityToSell = parseInt(quantity, 10) || 1;
    const salePrice = parseFloat(price);
    if (isNaN(quantityToSell) || quantityToSell < 1) {
      Alert.alert('Error', 'Please enter a valid quantity.');
      return;
    }
    if (isNaN(salePrice) || salePrice < 0) {
      Alert.alert('Error', 'Please enter a valid price.');
      return;
    }
    if (salePrice !== parseFloat(product.price)) {
      Alert.alert('Warning', 'Entered price does not match the product price. Please double-check for accuracy.');
    }
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
      Alert.alert('Error', 'Failed to complete sale.');
      setConfirmModalVisible(false);
      setPendingSale(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sell Product</Text>
      <DropDownPicker
        open={productDropdownOpen}
        value={selectedProduct}
        items={productDropdownItems}
        setOpen={setProductDropdownOpen}
        setValue={setSelectedProduct}
        setItems={setProductDropdownItems}
        placeholder="Select product"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />
      <TextInput
        style={styles.input}
        placeholder="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      <Button title="Review Sale" onPress={handleReview} color="#007AFF" />
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
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  dropdown: {
    marginBottom: 10,
    minHeight: 40,
  },
  dropdownContainer: {
    marginBottom: 10,
    zIndex: 3000,
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

export default SellProductScreen; 