# ScanStock

ScanStock is a secure, modern inventory management app built with React Native. It is designed for small businesses and individuals to easily track, manage, and audit their stock using their mobile device.

## Key Features

- **User Authentication**: Secure sign up, login, and logout with hashed passwords and email verification.
- **User Management**: Update profile, change password, and delete account from within the app.
- **Inventory Tracking**: Add, edit, and remove products from your inventory. View current stock levels at a glance.
- **Barcode Scanning**: Quickly scan product barcodes to add or update inventory (requires camera permissions).
- **Sales History**: Track sales and view historical data for better business insights.
- **Security**: Implements secure password storage, rate limiting, session management, and input sanitization.
- **Cross-Platform**: Works on both Android and iOS devices.

## Who is it for?
- Small business owners
- Retailers
- Warehouse managers
- Anyone who needs to keep track of physical inventory

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run on Android:**
   ```sh
   npm run android
   ```
3. **Run on iOS:**
   ```sh
   npm run ios
   ```

## Security Notice
ScanStock uses secure random number generation and cryptographic functions. If you see errors about the native crypto module, ensure you have installed and imported `react-native-get-random-values` as described in the troubleshooting section below.

## Troubleshooting
- If you see `Native crypto module could not be used to get secure random number`, run:
  ```sh
  npm install react-native-get-random-values
  ```
  And add this to the top of your `index.js`:
  ```js
  import 'react-native-get-random-values';
  ```

## License
MIT
