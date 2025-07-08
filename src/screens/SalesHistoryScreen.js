import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

const SalesHistoryScreen = () => {
  const [sales, setSales] = useState([]);
  const { user } = useAuth();

  const loadSales = useCallback(async () => {
    try {
      const salesList = await db.getSales(user.id);
      setSales(salesList); // Already ordered by created_at desc
    } catch (error) {
      console.error('Error loading sales history:', error);
    }
  }, [user.id]);

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales])
  );

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.product_name || 'Unknown Product'}</Text>
      <Text style={styles.itemText}>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</Text>
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
