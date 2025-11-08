import { database } from '../firebaseApp';
import { ref, get } from 'firebase/database';

// Test Firebase connection by trying to read a simple path
export const testFirebaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!database) {
      return { success: false, error: 'Firebase database not initialized' };
    }
    
    // Try to read a simple path to test connection
    const testRef = ref(database, '.info/connected');
    const snapshot = await get(testRef);
    
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error?.message || 'Failed to connect to Firebase' 
    };
  }
};

// Test Firebase connection by reading a known path
export const testFirebaseRead = async (path: string): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    if (!database) {
      return { success: false, error: 'Firebase database not initialized' };
    }
    
    const testRef = ref(database, path);
    const snapshot = await get(testRef);
    
    return { 
      success: true, 
      data: snapshot.exists() ? snapshot.val() : null 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error?.message || `Failed to read from Firebase path: ${path}` 
    };
  }
};

