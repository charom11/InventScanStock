import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { database } from '../utils/firebase';

const SalesHistoryScreen = () => {
  const [sales, setSales] = useState([]);

  const loadSales = useCallback(async () => {
    try {
      const snapshot = await database().ref('/sales').once('value');
      const salesObj = snapshot.val() || {};
      // Convert to array
      const salesList = Object.keys(salesObj).map(key => ({ id: key, ...salesObj[key] }));
      setSales(salesList.reverse()); // Most recent first
    } catch (error) {
      console.error(error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales])
  );

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.product_name || 'Unknown Product'}</Text>
      <Text style={styles.itemText}>{item.sale_timestamp ? new Date(item.sale_timestamp).toLocaleString() : ''}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sales History</Text>
      <FlatList
        data={sales}
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
    marginBottom: 10,
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

export default SalesHistoryScreen;
