# 🍽️ Restaurant Management System

A comprehensive restaurant management platform built with React, Firebase, and Bootstrap. This application provides a complete solution for both customers and restaurant administrators to manage orders, menu items, campaigns, and more.

## 🌟 Features Overview

### 🛍️ **Customer Features**
- **Menu Browsing**: View categorized menu items with images, descriptions, and pricing
- **Multi-size Ordering**: Select different portion sizes (Small, Medium, Large) for applicable items
- **Smart Cart System**: Add items to cart with quantity management and real-time total calculation
- **Multiple Service Options**: 
  - 🏪 **Dine-in**: Order for restaurant dining
  - 🥡 **Takeout**: Order for pickup
  - 🚚 **Home Delivery**: Order with address management
- **Payment Options**: Cash payment and online payment (expandable)
- **Order Tracking**: Real-time order status updates
- **Coupon System**: Apply discount coupons with validation
- **User Profiles**: Manage personal information and addresses
- **Multi-language Support**: Switch between English and Swedish
- **News & Updates**: Scrolling marquee with latest restaurant announcements
- **Responsive Design**: Works on all devices

### 🔧 **Admin Features**
- **Dashboard Overview**: Real-time statistics and insights
- **Menu Management**: 
  - Add, edit, delete menu items
  - Bulk upload functionality
  - Category management
  - Price management for multiple sizes
  - Availability control
- **Order Management**: 
  - View all orders with filtering options
  - Update order status (Pending → Preparing → Ready → Completed)
  - Delivery address management
  - Real-time order notifications
- **Campaign Management**: 
  - Create promotional banners
  - Manage discount coupons
  - Set campaign duration and eligibility
  - Multi-language campaign content
- **News & Announcements**: 
  - Create and manage scrolling news marquee
  - Add/edit/delete news items (max 10)
  - Multi-language news content (English/Swedish)
  - Priority-based ordering
  - Real-time updates across all pages
- **User Management**: 
  - View all registered users
  - Manage user roles (Customer/Admin)
  - Account status control
- **Contact Management**: 
  - Manage restaurant contact information
  - Update business details
- **Feedback System**: View and manage customer feedback
- **Real-time Notifications**: Instant alerts for new orders

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager
- Firebase account (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-fe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [https://firebase.google.com/](https://firebase.google.com/)
   - Enable Authentication, Firestore, and Storage
   - Update `src/firebase/config.js` with your Firebase configuration

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## 👥 User Guide

### 🔐 Getting Started as a Customer

1. **Registration/Login**
   - Click "Login" or "Register" from the homepage
   - Use email/password or Google sign-in
   - Complete your profile for better experience

2. **Browsing the Menu**
   - Navigate to "Menu" from the navbar
   - Use filters to find items by category or availability
   - Search for specific items using the search bar
   - Click on any item to view detailed information

3. **Placing an Order**
   - Click on menu items to open detailed view
   - Select size/portion if applicable
   - Choose quantity and click "Add to Cart"
   - Review items in your cart
   - Select service type (Dine-in, Takeout, or Delivery)
   - If delivery: provide address details
   - Choose payment method
   - Confirm your order

4. **Managing Your Account**
   - Access "Dashboard" to view:
     - Order history with status tracking
     - Profile information
     - Saved addresses
   - Update your profile information as needed

5. **Using Coupons**
   - Enter coupon code in the cart before checkout
   - System will validate and apply eligible discounts
   - View applied discount in order summary

### 🌍 Language Support
- Use the language switcher in the navbar
- Toggle between English (🇬🇧) and Swedish (🇸🇪)
- All content including menus and campaigns adapt to selected language

### 🎨 Theme Customization
- Multiple theme options available (commented for future use)
- Default responsive design works across all devices

## 👨‍💼 Admin Guide

### 🔑 Admin Access
Admin accounts are configured through environment variables. Contact the system administrator to get admin access.

### 📊 Dashboard Overview
- **Statistics Panel**: View key metrics like total orders, revenue, active users
- **Quick Actions**: Access frequently used management tools
- **Real-time Data**: All information updates automatically

### 🍽️ Menu Management

#### Adding New Items
1. Go to "Foods" section in admin dashboard
2. Click "Add New Food Item"
3. Fill in required information:
   - **Name**: Provide both Swedish and English names
   - **Description**: Multi-language descriptions
   - **Category**: Select from existing categories or add new ones
   - **Price**: Set prices for different sizes if applicable
   - **Image**: Upload high-quality food images
   - **Availability**: Set initial availability status

#### Managing Existing Items
- **Edit**: Click edit button to modify any item details
- **Toggle Availability**: Quickly enable/disable items
- **Delete**: Remove items permanently (with confirmation)
- **Bulk Operations**: Use bulk upload for multiple items

#### Category Management
- Create and manage food categories
- Organize menu items for better customer navigation
- Support for multi-language category names

### 📋 Order Management

#### Order Processing Workflow
1. **New Orders**: Appear with "Pending" status
2. **Accept Order**: Change status to "Preparing"
3. **Food Ready**: Update to "Ready" when order is complete
4. **Order Complete**: Mark as "Completed" when delivered/picked up

#### Order Details
- View complete order information including:
  - Customer details and contact information
  - Items ordered with quantities and customizations
  - Service type (dine-in, takeout, delivery)
  - Delivery address (for delivery orders)
  - Payment method and total amount
  - Applied coupons and discounts

#### Filtering and Search
- Filter by order status, service type, date range
- Search by customer name or order ID
- Pagination for handling large order volumes

### 🎯 Campaign Management

#### Creating Campaigns
1. Navigate to "Campaigns" section
2. Click "Add New Campaign"
3. Configure campaign details:
   - **Banner Image**: Upload promotional images
   - **Title/Subtitle**: Multi-language campaign text
   - **Duration**: Set start and end dates
   - **Coupon Code**: Create unique discount codes
   - **Discount Type**: Percentage or fixed amount
   - **Eligibility**: Set minimum order amounts and usage limits
   - **Applicable Items**: Choose which menu items are eligible

#### Campaign Types
- **Main Campaigns**: Featured prominently on homepage
- **Regular Campaigns**: Additional promotional offers
- **Targeted Campaigns**: Specific to certain menu items

### � News & Announcements Management

#### Creating News Items
1. Navigate to "News & Notices" section in admin dashboard
2. Click "Add News Item" (maximum 10 items allowed)
3. Fill in the news information:
   - **Title**: Provide both Swedish and English titles (required)
   - **Subtitle**: Optional additional information in both languages
   - **Priority**: Set display order (1-10, lower numbers appear first)
   - **Status**: Enable/disable to control visibility in marquee

#### News Display Features
- **Scrolling Marquee**: Appears under the navbar on all customer-facing pages
- **Multi-language Support**: Automatically displays content in user's selected language
- **Real-time Updates**: Changes appear immediately across all browsers
- **Responsive Design**: Adapts to all screen sizes with different scroll speeds
- **Interactive**: Hover to pause scrolling for easier reading

#### Managing News Content
- **Edit**: Modify existing news items at any time
- **Priority Management**: Control display order with priority settings
- **Toggle Visibility**: Quickly show/hide items without deleting
- **Search & Filter**: Find specific news items easily
- **Automatic Cleanup**: Only active items with content appear in marquee

### � User Management
- View all registered users
- Assign admin roles to trusted users
- Manage user account status (active/inactive)
- View user activity and order history

### �📞 Contact Information Management
- Update restaurant contact details
- Manage business hours and location information
- Update social media links and other business information

### 🔔 Notification System
- Real-time notifications for new orders
- Browser notifications for important events
- Notification history and management

## ⚙️ Technical Configuration

### 🔥 Firebase Setup

#### Required Firebase Services
1. **Authentication**
   - Enable Email/Password and Google providers
   - Configure authorized domains

2. **Firestore Database**
   - Create collections: `users`, `foods`, `orders`, `campaigns`, `categories`, `contact`, `news`
   - Set appropriate security rules

3. **Storage**
   - Configure for image uploads (menu items, campaigns)
   - Set CORS rules for web access

4. **Security Rules Example**
   ```javascript
   // Firestore Rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /orders/{orderId} {
         allow read, write: if request.auth != null;
       }
       match /{document=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

### 🌐 Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_ADMIN_EMAIL=admin@restaurant.com
REACT_APP_DEV_EMAIL=dev@restaurant.com
REACT_APP_CONTACT_EMAIL=contact@restaurant.com
```

### 📦 Available Scripts

#### Development
```bash
npm start          # Start development server (http://localhost:3000)
npm test           # Run test suite
npm run build      # Build for production
```

#### Production Deployment
```bash
npm run build      # Creates optimized production build
npm install -g serve
serve -s build     # Serve production build locally
```

## 🏗️ Architecture Overview

### 🧩 Technology Stack
- **Frontend**: React 19.x with Hooks
- **UI Framework**: Bootstrap 5 + React Bootstrap
- **State Management**: Redux Toolkit + Context API
- **Routing**: React Router v6
- **Authentication**: Firebase Auth
- **Database**: Firestore (NoSQL)
- **Storage**: Firebase Storage
- **Internationalization**: i18next
- **Build Tool**: Create React App with CRACO

### 📁 Project Structure
```
src/
├── components/           # React components
│   ├── admin/           # Admin-specific components
│   └── user/            # User-specific components
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── services/            # API and business logic
├── store/               # Redux store and slices
├── styles/              # CSS and styling files
├── utils/               # Utility functions
├── locales/             # Translation files
└── firebase/            # Firebase configuration
```

### 🔄 Data Flow
1. **Authentication**: Firebase Auth manages user sessions
2. **State Management**: Redux for global state, Context for specific features
3. **Real-time Updates**: Firestore listeners for live data synchronization
4. **Image Handling**: Firebase Storage for file uploads

## 🛠️ Customization Guide

### 🎨 Styling and Themes
- Modify `src/styles/theme.css` for color schemes
- Update Bootstrap variables in CSS files
- Add new themes in `ThemeSelector.js`

### 🌍 Adding New Languages
1. Create translation file in `src/locales/[language]/translation.json`
2. Update `src/i18n.js` to include new language
3. Add language flag to `LanguageSwitcher.js`

### 🔧 Adding New Features
1. Create components in appropriate directories
2. Add routes in `AppRouter.js`
3. Update navigation in `Navbar.js`
4. Add necessary context providers
5. Create Firestore collections and rules

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Authentication Issues**
   - Verify Firebase configuration
   - Check authorized domains in Firebase console
   - Ensure environment variables are set correctly

2. **Image Upload Problems**
   - Check Firebase Storage rules
   - Verify CORS configuration
   - Ensure proper file size limits

3. **Real-time Updates Not Working**
   - Check Firestore security rules
   - Verify internet connection
   - Check browser console for errors

4. **Language Switching Problems**
   - Clear browser localStorage
   - Check translation files for syntax errors
   - Verify i18n configuration

## 📈 Performance Optimization

### Best Practices Implemented
- **Code Splitting**: Lazy loading for admin components
- **Image Optimization**: Responsive images with proper sizing
- **Caching**: Redux state persistence and smart data fetching
- **Real-time Efficiency**: Optimized Firestore listeners

### Monitoring
- Use Redux DevTools for state debugging
- Monitor Firebase usage in console
- Check Core Web Vitals for performance metrics

## 🔒 Security Features

- **Authentication**: Secure Firebase Auth integration
- **Role-based Access**: Admin vs. Customer permissions
- **Data Validation**: Form validation and sanitization
- **Secure API Calls**: Protected routes and authenticated requests

## 📱 Mobile Experience

- **Responsive Design**: Works seamlessly on all screen sizes
- **Touch-friendly**: Optimized for mobile interactions
- **Fast Loading**: Optimized bundle size and lazy loading
- **Offline Capability**: Service worker ready (can be enabled)

## 🆘 Support

For technical support or questions:
- Check the troubleshooting section above
- Review Firebase console for backend issues
- Check browser developer tools for frontend errors
- Contact the development team for additional assistance

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Compatible with**: Modern browsers (Chrome, Firefox, Safari, Edge)
