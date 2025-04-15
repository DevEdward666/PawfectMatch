import { useIonToast } from '@ionic/react';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Product, ProductForm } from '../models/product.model';
import api from '../services/api';

interface ProductContextProps {
  products: Product[];
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: number) => Promise<void>;
  createProduct: (productData: ProductForm) => Promise<void>;
  updateProduct: (id: number, productData: ProductForm) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
}

const ProductContext = createContext<ProductContextProps | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [present] = useIonToast();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    present({
      message,
      duration: 3000,
      position: 'bottom',
      color: type === 'success' ? 'success' : 'danger'
    });
  };

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/products');
      setProducts(response.data.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch products.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  },[showToast]);

  const fetchProductById = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/products/${id}`);
      setProduct(response.data.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch product details.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  },[showToast]);

  const createProduct = async (productData: ProductForm) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'image' && value instanceof File) {
            formData.append('image', value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      const response = await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProducts([response.data.data, ...products]);
      showToast('Product added successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create product.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (id: number, productData: ProductForm) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'image' && value instanceof File) {
            formData.append('image', value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      const response = await api.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProducts(products.map(p => p.id === id ? response.data.data : p));
      setProduct(response.data.data);
      showToast('Product updated successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update product.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.delete(`/products/${id}`);
      
      setProducts(products.filter(p => p.id !== id));
      if (product && product.id === id) {
        setProduct(null);
      }
      showToast('Product deleted successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete product.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        product,
        isLoading,
        error,
        fetchProducts,
        fetchProductById,
        createProduct,
        updateProduct,
        deleteProduct
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = (): ProductContextProps => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};