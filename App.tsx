import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB, getDBConnection, recreateUsersTable } from './src/database/database';
import { AuthProvider } from './src/context/AuthContext';

const App = () => {
  useEffect(() => {
    const setupDB = async () => {
      const db = await getDBConnection();
      await recreateUsersTable(db); // WARNING: This deletes all users! Remove after confirming the fix.
      await initDB();
    };
    setupDB();
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;
