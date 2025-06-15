import React from 'react';
import AppRouter from './components/AppRouter';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/app.css';
import '@/styles/theme.css';
import ThemeSelector from './components/ThemeSelector';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { FoodProvider } from './contexts/FoodContext';
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AdminProvider>
          <FoodProvider>
            <div className="App">
              <ThemeSelector />
              <AppRouter />
            </div>
          </FoodProvider>
        </AdminProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;
