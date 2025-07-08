import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, Alert, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db, storage } from '../utils/supabase';

const CATEGORIES = ['Electronics', 'Groceries', 'Clothing', 'Books', 'Other'];

const ProductDetailsScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const [productName, setProductName] = useState(product.product_name);
  const [barcode, setBarcode] = useState(product.barcode);
  const [category, setCategory] = useState(product.category || 'Other');
  const [imageUrl, setImageUrl] = useState(product.image_url || '');
  const [imageUri, setImageUri] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    // Load sales for this product from Supabase
    const loadSales = async () => {
      try {
        const salesList = await db.getSales(product.user_id);
        const productSales = salesList.filter(sale => sale.barcode === product.barcode);
        setSales(productSales);
      } catch (error) {
        console.error('Error loading sales:', error);
      }
    };
    loadSales();
  }, [product.barcode, product.user_id]);

  // Placeholder for image picker
  const handlePickImage = async () => {
    Alert.alert('Image Picker', 'Image picker integration goes here.');
  };

  const handleSave = async () => {
    try {
      let newImageUrl = imageUrl;
      if (imageUri) {
        const filename = `products/${Date.now()}_${barcode}.jpg`;
        await storage.uploadFile('product-images', filename, imageUri);
        newImageUrl = storage.getPublicUrl('product-images', filename);
      }
      await db.updateProduct(product.id, {
        product_name: productName,
        barcode,
        category,
        image_url: newImageUrl,
      });
      setImageUrl(newImageUrl);
      setIsEditing(false);
      Alert.alert('Success', 'Product updated successfully.');
      navigation.setParams({ product: { ...product, product_name: productName, barcode, category, image_url: newImageUrl } });
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Product Details</Text>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.productImage} />
      ) : (
        <View style={styles.imagePlaceholder}><Text>📦</Text></View>
      )}
      {isEditing ? (
        <>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="Product Name"
          />
          <TextInput
            style={styles.input}
            value={barcode}
            onChangeText={setBarcode}
            placeholder="Barcode"
          />
          <Picker
            selectedValue={category}
            style={styles.picker}
            onValueChange={setCategory}
          >
            {CATEGORIES.map(cat => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
          <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
            <Text style={styles.imagePickerButtonText}>{imageUri ? 'Image Selected' : 'Pick Image'}</Text>
          </TouchableOpacity>
          <Button title="Save" onPress={handleSave} />
          <Button title="Cancel" onPress={() => setIsEditing(false)} color="#888" />
        </>
      ) : (
        <>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{productName}</Text>
          <Text style={styles.label}>Barcode:</Text>
          <Text style={styles.value}>{barcode}</Text>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{category}</Text>
          <Button title="Edit" onPress={() => setIsEditing(true)} />
        </>
      )}
      <Text style={styles.salesTitle}>Sales History</Text>
      <FlatList
        data={sales}
        renderItem={({ item }) => (
          <View style={styles.saleItem}>
            <Text style={styles.saleText}>{item.product_name}</Text>
            <Text style={styles.saleText}>{item.sale_timestamp ? new Date(item.sale_timestamp).toLocaleString() : ''}</Text>
          </View>
        )}
        keyExtractor={item => item.id}
        style={styles.salesList}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  picker: {
    height: 40,
    marginBottom: 10,
  },
  imagePickerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePickerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginBottom: 5,
  },
  salesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
  },
  salesList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  saleItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  saleText: {
    fontSize: 14,
    color: '#333',
  },
});

export default ProductDetailsScreen; 