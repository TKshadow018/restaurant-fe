import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDispatch } from "react-redux";
import { fetchMenuItems } from "@/store/slices/menuSlice";
import { fetchCampaigns } from "@/store/slices/campaignSlice";
import { fetchContactInfo } from "@/store/slices/contactSlice";
import { fetchCategories } from "@/store/slices/categorySlice";
import { isUserAdmin } from "@/utils/adminUtils";
import Login from "@/components/Login";
import Register from "@/components/Register";
import UserWrapper from "@/components/UserWrapper";
import AdminDashboard from "@/components/AdminDashboard";
import NotFound from "@/components/NotFound";
import ContactUs from "@/components/ContactUs";
import Menu from "@/components/Menu";
import Campaign from "@/components/Campaign";
import Cart from "@/components/Cart";
import GoToCart from "@/components/GoToCart";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  return currentUser ? children : <Navigate to="/login" replace />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { currentUser } = useAuth();

  // Debug logging
  console.log("AdminRoute - Current User:", currentUser?.email);
  console.log("AdminRoute - Admin Emails:", [
    process.env.REACT_APP_ADMIN_EMAIL,
    process.env.REACT_APP_DEV_EMAIL,
    process.env.REACT_APP_CONTACT_EMAIL,
  ]);

  // Check if user is admin using utility function
  const isAdmin = isUserAdmin(currentUser?.email);

  console.log("AdminRoute - Is Admin:", isAdmin);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return isAdmin ? children : <Navigate to="/dashboard" replace />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();

  return !currentUser ? children : <Navigate to="/dashboard" replace />;
};

const AppRouter = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMenuItems());
    dispatch(fetchCampaigns());
    dispatch(fetchContactInfo());
    dispatch(fetchCategories());
    // dispatch other fetch actions as needed
  }, [dispatch]);

  return (
    <Router>
      <div className="app">
        <GoToCart />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<UserWrapper />} />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserWrapper />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Contact Us Route */}
          <Route path="/about" element={<ContactUs />} />

          {/* Menu Route */}
          <Route path="/menu" element={<Menu />} />

          {/* Campaign Route */}
          <Route path="/campaign" element={<Campaign />} />

          {/* Cart Route */}
          <Route path="/cart" element={<Cart />} />

          {/* Catch all route - 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default AppRouter;
