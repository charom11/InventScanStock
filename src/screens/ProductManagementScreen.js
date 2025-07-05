import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Alert } from 'react-native';
import { getDBConnection, getProducts, addProduct } from '../database/database';

const ProductManagementScreen = ({ route }) => {
  const [productName, setProductName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [products, setProducts] = useState([]);

  const loadProducts = useCallback(async () => {
    try {
      const db = await getDBConnection();
      const storedProducts = await getProducts(db);
      setProducts(storedProducts);
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
      const db = await getDBConnection();
      await addProduct(db, { productName, barcode });
      setProductName('');
      setBarcode('');
      loadProducts(); // Refresh the list
      Alert.alert('Success', 'Product added successfully.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add product. The barcode might already exist.');
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
        keyExtractor={(item) => item.product_id.toString()}
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
