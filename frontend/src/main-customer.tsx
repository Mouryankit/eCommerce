import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { CustomerApp } from './CustomerApp';
import './index.css';
import './App.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <CustomerApp />
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>
);
