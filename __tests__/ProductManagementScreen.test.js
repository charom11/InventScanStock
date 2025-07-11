import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

// Mock Supabase utils before importing the screen
jest.mock('../src/utils/supabase', () => ({
  db: {
    getProducts: jest.fn().mockResolvedValue([]),
    addProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    getProductByBarcode: jest.fn(),
    addSale: jest.fn(),
    getSales: jest.fn().mockResolvedValue([]),
  },
  storage: {
    uploadFile: jest.fn(),
    getPublicUrl: jest.fn().mockReturnValue('mock-url'),
    deleteFile: jest.fn(),
  },
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        subscription: { unsubscribe: jest.fn() }
      })),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      updateUser: jest.fn(),
    }
  },
}));

import ProductManagementScreen from '../src/screens/ProductManagementScreen';
import { AuthProvider } from '../src/context/AuthContext';

// Mock navigation and route
const navigation = { navigate: jest.fn() };
const route = { params: {} };

// Mock useAuth to provide a fake user
jest.mock('../src/context/AuthContext', () => {
  const actual = jest.requireActual('../src/context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({ user: { id: 'test-user-id', email: 'test@example.com' } }),
    AuthProvider: actual.AuthProvider,
  };
});

describe('ProductManagementScreen', () => {
  it('renders Add New Product form', async () => {
    const { findByPlaceholderText, findByText, getAllByPlaceholderText } = render(
      <AuthProvider>
        <ProductManagementScreen navigation={navigation} route={route} />
      </AuthProvider>
    );
    await waitFor(async () => {
      expect(await findByText(/Add New Product/i)).toBeTruthy();
      expect(await findByPlaceholderText(/Product Name/i)).toBeTruthy();
      expect(getAllByPlaceholderText(/Barcode/i).length).toBeGreaterThan(0);
    });
  });
}); 