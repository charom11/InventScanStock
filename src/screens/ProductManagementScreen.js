import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Alert, Image, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db, storage } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import ProductDetailsScreen from './ProductDetailsScreen'; // Only needed if you want to use it directly
// import ImagePicker from 'react-native-image-picker'; // Uncomment if installed

const CATEGORIES = ['All', 'Electronics', 'Groceries', 'Clothing', 'Books', 'Other'];

const ProductManagementScreen = ({ route, navigation }) => {
  const [productName, setProductName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Other');
  const [products, setProducts] = useState([]);
  const [imageUri, setImageUri] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const { user } = useAuth();

  const loadProducts = useCallback(async () => {
    try {
      const productList = await db.getProducts(user.id);
      setProducts(productList);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }, [user.id]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (route.params?.scannedBarcode) {
      setBarcode(route.params.scannedBarcode);
    }
  }, [route.params?.scannedBarcode]);

  // Placeholder for image picker
  const handlePickImage = async () => {
    // Use react-native-image-picker or similar here
    // Example:
    // ImagePicker.launchImageLibrary({}, async (response) => {
    //   if (!response.didCancel && !response.error) {
    //     setImageUri(response.uri);
    //   }
    // });
    Alert.alert('Image Picker', 'Image picker integration goes here.');
  };

  const handleAddOrEditProduct = async () => {
    if (!productName.trim() || !barcode.trim()) {
      Alert.alert('Validation Error', 'Please enter both product name and barcode.');
      return;
    }
    let imageUrl = '';
    try {
      if (imageUri) {
        const filename = `products/${Date.now()}_${barcode}.jpg`;
        await storage.uploadFile('product-images', user.id, filename, imageUri);
        imageUrl = storage.getPublicUrl('product-images', `${user.id}/${filename}`);
      }
      if (editingProduct) {
        // Update product
        await db.updateProduct(editingProduct.id, {
          product_name: productName,
          barcode,
          image_url: imageUrl || editingProduct.image_url || '',
          category,
        });
        Alert.alert('Success', 'Product updated successfully.');
      } else {
        // Add product
        await db.addProduct({
          product_name: productName,
          barcode,
          image_url: imageUrl,
          user_id: user.id,
          category,
        });
        // Log a sale
        await db.addSale({
          product_name: productName,
          barcode,
          user_id: user.id,
          category,
        });
        Alert.alert('Success', 'Product added and sale logged.');
      }
      setProductName('');
      setBarcode('');
      setImageUri(null);
      setEditingProduct(null);
      setCategory('Other');
      loadProducts();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add or update product.');
    }
  };

  const handleDeleteProduct = async (product) => {
    try {
      await db.deleteProduct(product.id);
      // Optionally delete image from Storage if exists
      if (product.image_url) {
        // Extract filename from URL
        const path = product.image_url.split('/').slice(-2).join('/');
        await storage.deleteFile('product-images', `${product.user_id}/${path}`);
      }
      loadProducts();
      Alert.alert('Deleted', 'Product deleted successfully.');
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', 'Failed to delete product.');
    }
  };

  const handleEditProduct = (product) => {
    setProductName(product.product_name);
    setBarcode(product.barcode);
    setImageUri(null); // Optionally set to product.imageUrl if you want to allow image editing
    setEditingProduct(product);
    setCategory(product.category || 'Other');
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetails', { product });
  };

  // Filter and search logic
  const filteredProducts = products.filter(item => {
    const matchesSearch =
      item.product_name.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      filterCategory === 'All' || (item.category || 'Other') === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleProductPress(item)} style={{ flex: 1 }}>
      <View style={styles.itemContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}><Text>📦</Text></View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.itemText}>{item.product_name}</Text>
          <Text style={styles.itemText}>{item.barcode}</Text>
          <Text style={styles.categoryText}>{item.category || 'Other'}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEditProduct(item)}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProduct(item)}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{editingProduct ? 'Edit Product' : 'Add New Product'}</Text>
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
      <Picker
        selectedValue={category}
        style={styles.picker}
        onValueChange={setCategory}
      >
        {CATEGORIES.filter(c => c !== 'All').map(cat => (
          <Picker.Item key={cat} label={cat} value={cat} />
        ))}
      </Picker>
      <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
        <Text style={styles.imagePickerButtonText}>{imageUri ? 'Image Selected' : 'Pick Image'}</Text>
      </TouchableOpacity>
      <Button title={editingProduct ? 'Update Product' : 'Add Product'} onPress={handleAddOrEditProduct} />
      <Text style={styles.title}>Existing Products</Text>
      <TextInput
        style={styles.input}
        placeholder="Search by name or barcode"
        value={search}
        onChangeText={setSearch}
      />
      <Picker
        selectedValue={filterCategory}
        style={styles.picker}
        onValueChange={setFilterCategory}
      >
        {CATEGORIES.map(cat => (
          <Picker.Item key={cat} label={cat} value={cat} />
        ))}
      </Picker>
      <FlatList
        data={filteredProducts}
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
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  editButton: {
    backgroundColor: '#FFD600',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  editButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ProductManagementScreen;
