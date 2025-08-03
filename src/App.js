import React from 'react';
import AppRouter from '@/components/AppRouter';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/app.css';
import '@/styles/theme.css';
// import ThemeSelector from '@/components/ThemeSelector'; // Commented out for future use
// import GoToCart from '@/components/GoToCart'; // Moved to AppRouter for Router context
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { FoodProvider } from '@/contexts/FoodContext';
import { CartProvider } from '@/contexts/CartContext';
import { OrderProvider } from '@/contexts/OrderContext';
import { Provider } from 'react-redux';
import { store } from '@/store';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AdminProvider>
          <FoodProvider>
            <CartProvider>
              <OrderProvider>
                <div className="App">
                  <AppRouter />
                </div>
              </OrderProvider>
            </CartProvider>
          </FoodProvider>
        </AdminProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;
