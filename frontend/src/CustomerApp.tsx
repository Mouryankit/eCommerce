import React, { useState } from 'react';
import { ToastContainer } from './components/ToastContainer';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductGrid } from './components/ProductGrid';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { LogoutModal } from './components/LogoutModal';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { Footer } from './components/Footer';

export const CustomerApp: React.FC = () => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <div className="app-shell customer-portal-shell">
      {/* Global Notifications */}
      <ToastContainer />

      {/* Customer Navigation Bar */}
      <Navbar portalMode="customer" />

      {/* Main Storefront Area */}
      <main className="main-content-area">
        <div className="storefront-view-wrapper">
          <HeroBanner />
          <CategoryFilter />
          <ProductGrid />
        </div>
      </main>

      {/* Customer Shopping Cart Drawer */}
      <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />

      {/* Customer Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* Customer Account & Order History Modal */}
      <CustomerAccountModal />

      {/* Authentication Modals */}
      <AuthModal />
      <LogoutModal />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CustomerApp;
