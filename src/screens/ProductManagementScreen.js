import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Alert, Image, TouchableOpacity, Platform, Modal } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Picker } from '@react-native-picker/picker';
import { db, storage } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import ImagePicker from 'react-native-image-picker';

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
  const [quantity, setQuantity] = useState('1');
  const [sellQuantity, setSellQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingSale, setPendingSale] = useState(null); // {product, quantity, price, inventoryAfter, date}
  const { user } = useAuth();

  // Dropdown state for react-native-dropdown-picker
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [filterCategoryOpen, setFilterCategoryOpen] = useState(false);
  const [categoryItems, setCategoryItems] = useState(CATEGORIES.filter(c => c !== 'All').map(cat => ({ label: cat, value: cat })));
  const [filterCategoryItems, setFilterCategoryItems] = useState(CATEGORIES.map(cat => ({ label: cat, value: cat })));

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

  // Image picker functionality
  const handlePickImage = async () => {
    const options = {
      title: 'Select Product Image',
      cancelButtonTitle: 'Cancel',
      takePhotoButtonTitle: 'Take Photo',
      chooseFromLibraryButtonTitle: 'Choose from Library',
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: false,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      } else if (response.assets && response.assets[0]) {
        setImageUri(response.assets[0].uri);
      }
    });
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
          quantity: parseInt(quantity, 10) || 1,
          price: parseFloat(price) || 0,
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
          quantity: parseInt(quantity, 10) || 1,
          price: parseFloat(price) || 0,
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
      setQuantity('1');
      setPrice('');
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
    setQuantity(product.quantity ? String(product.quantity) : '1');
    setPrice(product.price ? String(product.price) : '');
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetails', { product });
  };

  const handleSellProduct = (product) => {
    setSellQuantity('1');
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
  };

  // Confirm sale handler
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
        product_name: product.product_name,
        barcode: product.barcode,
        user_id: product.user_id,
        category: product.category,
        price,
        quantity,
      });
      loadProducts();
      setConfirmModalVisible(false);
      setPendingSale(null);
      Alert.alert(
        'Sale Completed',
        `Sale completed! ${quantity} units of ${product.product_name} sold at $${price.toFixed(2)} each.\nInventory updated and transaction recorded.\n\nTransaction ID: ${saleRecord?.id || 'N/A'}\nDate/Time: ${date.toLocaleString()}`
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to complete sale.');
      setConfirmModalVisible(false);
      setPendingSale(null);
    }
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
    <TouchableOpacity onPress={() => handleProductPress(item)} style={styles.flexOne}>
      <View style={styles.itemContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}><Text>📦</Text></View>
        )}
        <View style={styles.flexOne}>
          <Text style={styles.itemText}>{item.product_name}</Text>
          <Text style={styles.itemText}>{item.barcode}</Text>
          <Text style={styles.categoryText}>{item.category || 'Other'}</Text>
          <Text style={styles.quantityText}>Qty: {item.quantity ?? 1}</Text>
          <Text style={styles.priceText}>Price: ${item.price ? Number(item.price).toFixed(2) : '0.00'}</Text>
        </View>
        <TouchableOpacity style={styles.sellButton} onPress={() => handleSellProduct(item)}>
          <Text style={styles.sellButtonText}>Sell</Text>
        </TouchableOpacity>
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
      <DropDownPicker
        open={categoryOpen}
        value={category}
        items={categoryItems}
        setOpen={setCategoryOpen}
        setValue={setCategory}
        setItems={setCategoryItems}
        placeholder="Select category"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        zIndex={3000}
        zIndexInverse={1000}
      />
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
      <DropDownPicker
        open={filterCategoryOpen}
        value={filterCategory}
        items={filterCategoryItems}
        setOpen={setFilterCategoryOpen}
        setValue={setFilterCategory}
        setItems={setFilterCategoryItems}
        placeholder="Filter by category"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        zIndex={2000}
        zIndexInverse={2000}
      />
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
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
  dropdown: {
    marginBottom: 10,
    minHeight: 40,
  },
  dropdownContainer: {
    marginBottom: 10,
    zIndex: 3000,
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
  flexOne: {
    flex: 1,
  },
  quantityText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  sellButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  sellButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  priceText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
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

export default ProductManagementScreen;
