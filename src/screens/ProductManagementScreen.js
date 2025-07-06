import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Alert, Image } from 'react-native';
import { firestore } from '../utils/firebase';

const ProductManagementScreen = ({ route }) => {
  const [productName, setProductName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [products, setProducts] = useState([]);

  const loadProducts = useCallback(async () => {
    try {
      const snapshot = await firestore().collection('products').get();
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (route.params?.scannedBarcode) {
      setBarcode(route.params.scannedBarcode);
    }
  }, [route.params?.scannedBarcode]);

  const handleAddProduct = async () => {
    if (!productName.trim() || !barcode.trim()) {
      Alert.alert('Validation Error', 'Please enter both product name and barcode.');
      return;
    }
    try {
      await firestore().collection('products').add({
        product_name: productName,
        barcode,
        // Optionally add more fields
      });
      setProductName('');
      setBarcode('');
      loadProducts(); // Refresh the list
      Alert.alert('Success', 'Product added successfully.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add product.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.product_name}</Text>
      <Text style={styles.itemText}>{item.barcode}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Product</Text>
      <TextInput
        style={styles.input}
        placeholder="Product Name"
        value={productName}
        onChangeText={setProductName}
      />
      <TextInput
        style={styles.input}
        placeholder="Barcode"
        value={barcode}
        onChangeText={setBarcode}
      />
      <Button title="Add Product" onPress={handleAddProduct} />
      <Text style={styles.title}>Existing Products</Text>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
  },
});

export default ProductManagementScreen;
