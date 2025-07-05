import { openDatabase } from 'react-native-sqlite-storage';

export const getDBConnection = async () => {
  return openDatabase({ name: 'scan-stoc.db', location: 'default' });
};

export const createTables = async (db) => {
  const usersQuery = `
    CREATE TABLE IF NOT EXISTS Users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      is_email_verified BOOLEAN DEFAULT 0,
      login_attempts INTEGER DEFAULT 0,
      locked_until DATETIME,
      reset_token TEXT,
      reset_token_expires DATETIME
    );
  `;

  const productsQuery = `
    CREATE TABLE IF NOT EXISTS Products (
      product_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      barcode TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(user_id)
    );
  `;

  const salesQuery = `
    CREATE TABLE IF NOT EXISTS Sales (
      sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      user_id INTEGER,
      quantity INTEGER DEFAULT 1,
      sale_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES Products(product_id),
      FOREIGN KEY (user_id) REFERENCES Users(user_id)
    );
  `;

  const sessionsQuery = `
    CREATE TABLE IF NOT EXISTS Sessions (
      session_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES Users(user_id)
    );
  `;

  try {
    await db.executeSql(usersQuery);
    await db.executeSql(productsQuery);
    await db.executeSql(salesQuery);
    await db.executeSql(sessionsQuery);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables', error);
  }
};

export const initDB = async () => {
  const db = await getDBConnection();
  await createTables(db);
};

export const getProducts = async (db) => {
  try {
    const products = [];
    const results = await db.executeSql('SELECT * FROM Products');
    results.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        products.push(result.rows.item(i));
      }
    });
    return products;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get products from database');
  }
};

export const getProductByBarcode = async (db, barcode) => {
  try {
    const results = await db.executeSql('SELECT * FROM Products WHERE barcode = ?', [barcode]);
    if (results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }
    return null;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get product by barcode');
  }
};

export const addProduct = async (db, { productName, barcode }) => {
  const insertQuery = `
    INSERT INTO Products (product_name, barcode) VALUES (?, ?);
  `;
  const values = [productName, barcode];

  try {
    return db.executeSql(insertQuery, values);
  } catch (error) {
    console.error(error);
    throw Error('Failed to add product');
  }
};

export const addSale = async (db, { productId, quantity = 1 }) => {
  const insertQuery = `
    INSERT INTO Sales (product_id, quantity) VALUES (?, ?);
  `;
  const values = [productId, quantity];

  try {
    return db.executeSql(insertQuery, values);
  } catch (error) {
    console.error(error);
    throw Error('Failed to add sale');
  }
};

export const getSales = async (db, userId) => {
  try {
    const sales = [];
    const results = await db.executeSql(`
      SELECT s.sale_id, p.product_name, s.quantity, s.sale_timestamp
      FROM Sales s
      JOIN Products p ON s.product_id = p.product_id
      WHERE s.user_id = ?
      ORDER BY s.sale_timestamp DESC;
    `, [userId]);
    results.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        sales.push(result.rows.item(i));
      }
    });
    return sales;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get sales from database');
  }
};

// User management functions
export const createUser = async (db, { email, username, passwordHash }) => {
  const insertQuery = `
    INSERT INTO Users (email, username, password_hash) VALUES (?, ?, ?);
  `;
  const values = [email, username, passwordHash];

  try {
    const result = await db.executeSql(insertQuery, values);
    if (result && result[0] && result[0].insertId !== undefined) {
      return result[0].insertId;
    } else {
      console.error('User creation failed: No insertId returned', { result, insertQuery, values });
      throw new Error('User creation failed: No insertId returned');
    }
  } catch (error) {
    console.error('SQL Error in createUser:', error, insertQuery, values);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      if (error.message.includes('email')) {
        throw Error('Email already exists');
      } else if (error.message.includes('username')) {
        throw Error('Username already exists');
      }
    }
    throw Error('Failed to create user');
  }
};

export const getUserByEmail = async (db, email) => {
  try {
    const results = await db.executeSql('SELECT * FROM Users WHERE email = ?', [email]);
    if (results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }
    return null;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get user by email');
  }
};

export const getUserById = async (db, userId) => {
  try {
    const results = await db.executeSql('SELECT * FROM Users WHERE user_id = ?', [userId]);
    if (results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }
    return null;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get user by ID');
  }
};

export const updateUserLoginAttempts = async (db, userId, attempts, lockedUntil = null) => {
  const updateQuery = `
    UPDATE Users 
    SET login_attempts = ?, locked_until = ?, last_login = CURRENT_TIMESTAMP
    WHERE user_id = ?;
  `;
  
  try {
    await db.executeSql(updateQuery, [attempts, lockedUntil, userId]);
  } catch (error) {
    console.error(error);
    throw Error('Failed to update login attempts');
  }
};

export const updateUserProfile = async (db, userId, { email, username }) => {
  const updateQuery = `
    UPDATE Users 
    SET email = ?, username = ?
    WHERE user_id = ?;
  `;
  
  try {
    await db.executeSql(updateQuery, [email, username, userId]);
  } catch (error) {
    console.error(error);
    if (error.message.includes('UNIQUE constraint failed')) {
      if (error.message.includes('email')) {
        throw Error('Email already exists');
      } else if (error.message.includes('username')) {
        throw Error('Username already exists');
      }
    }
    throw Error('Failed to update user profile');
  }
};

export const updateUserPassword = async (db, userId, passwordHash) => {
  const updateQuery = `
    UPDATE Users 
    SET password_hash = ?
    WHERE user_id = ?;
  `;
  
  try {
    await db.executeSql(updateQuery, [passwordHash, userId]);
  } catch (error) {
    console.error(error);
    throw Error('Failed to update password');
  }
};

export const deleteUser = async (db, userId) => {
  try {
    // Delete user's data first (cascade delete would be better)
    await db.executeSql('DELETE FROM Sales WHERE user_id = ?', [userId]);
    await db.executeSql('DELETE FROM Products WHERE user_id = ?', [userId]);
    await db.executeSql('DELETE FROM Sessions WHERE user_id = ?', [userId]);
    await db.executeSql('DELETE FROM Users WHERE user_id = ?', [userId]);
  } catch (error) {
    console.error(error);
    throw Error('Failed to delete user');
  }
};

export const createSession = async (db, userId, token, expiresAt) => {
  const insertQuery = `
    INSERT INTO Sessions (user_id, token, expires_at) VALUES (?, ?, ?);
  `;
  
  try {
    await db.executeSql(insertQuery, [userId, token, expiresAt]);
  } catch (error) {
    console.error(error);
    throw Error('Failed to create session');
  }
};

export const getSession = async (db, token) => {
  try {
    const results = await db.executeSql(`
      SELECT s.*, u.email, u.username 
      FROM Sessions s
      JOIN Users u ON s.user_id = u.user_id
      WHERE s.token = ? AND s.is_active = 1 AND s.expires_at > datetime('now')
    `, [token]);
    
    if (results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }
    return null;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get session');
  }
};

export const invalidateSession = async (db, token) => {
  try {
    await db.executeSql('UPDATE Sessions SET is_active = 0 WHERE token = ?', [token]);
  } catch (error) {
    console.error(error);
    throw Error('Failed to invalidate session');
  }
};

export const cleanupExpiredSessions = async (db) => {
  try {
    await db.executeSql('DELETE FROM Sessions WHERE expires_at < datetime("now")');
  } catch (error) {
    console.error(error);
    throw Error('Failed to cleanup expired sessions');
  }
};

// Utility to drop and recreate the Users table (WARNING: deletes all users)
export const recreateUsersTable = async (db) => {
  try {
    await db.executeSql('DROP TABLE IF EXISTS Users;');
    const usersQuery = `
      CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_email_verified BOOLEAN DEFAULT 0,
        login_attempts INTEGER DEFAULT 0,
        locked_until DATETIME,
        reset_token TEXT,
        reset_token_expires DATETIME
      );
    `;
    await db.executeSql(usersQuery);
    console.log('Users table recreated successfully');
  } catch (error) {
    console.error('Error recreating Users table', error);
  }
};

// To use this utility, call the following after opening your DB connection (e.g., in initDB):
// const db = await getDBConnection();
// await recreateUsersTable(db);

