// Centralized Firebase utility for React Native Firebase
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';

// Get the default app instance
const app = auth().app;

// Export the services with the app instance
export const authService = auth(app);
export const firestoreService = firestore(app);
export const databaseService = database(app);
export const storageService = storage(app);

// For backward compatibility
export { auth, firestore, database, storage }; 