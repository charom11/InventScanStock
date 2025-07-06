import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';

const DebugScreen = () => {
  const [logs, setLogs] = useState([]);
  const [testMessage, setTestMessage] = useState('');

  // Override console.log to capture logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      addLog('LOG', args.join(' '));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('ERROR', args.join(' '));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('WARN', args.join(' '));
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const addLog = (level, message) => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = {
      id: Date.now(),
      timestamp,
      level,
      message,
    };
    setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 99)]); // Keep last 100 logs
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testLog = () => {
    console.log(`Test log: ${testMessage}`);
    setTestMessage('');
  };

  const testError = () => {
    console.error(`Test error: ${testMessage}`);
    setTestMessage('');
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'ERROR': return '#FF3B30';
      case 'WARN': return '#FF9500';
      case 'LOG': return '#007AFF';
      default: return '#333';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Console</Text>
      
      {/* Test Controls */}
      <View style={styles.testSection}>
        <TextInput
          style={styles.input}
          placeholder="Enter test message"
          value={testMessage}
          onChangeText={setTestMessage}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.logButton]} onPress={testLog}>
            <Text style={styles.buttonText}>Test Log</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={testError}>
            <Text style={styles.buttonText}>Test Error</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearLogs}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logs Display */}
      <ScrollView style={styles.logsContainer}>
        {logs.map((log) => (
          <View key={log.id} style={styles.logEntry}>
            <Text style={[styles.timestamp, { color: getLogColor(log.level) }]}>
              {log.timestamp} [{log.level}]
            </Text>
            <Text style={styles.logMessage}>{log.message}</Text>
          </View>
        ))}
        {logs.length === 0 && (
          <Text style={styles.noLogs}>No logs yet. Try adding some test logs!</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  testSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  logButton: {
    backgroundColor: '#007AFF',
  },
  errorButton: {
    backgroundColor: '#FF3B30',
  },
  clearButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  logEntry: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  logMessage: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  noLogs: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default DebugScreen; 