import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

export default function TestFirebaseConnection() {
  const [status, setStatus] = useState<string>('Testing connection...');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    // Check Firebase config
    const checkConfig = async () => {
      try {
        // Get config status from API
        const res = await fetch('/api/test-firebase');
        const data = await res.json();
        setConfig(data);

        // Test Firestore connection
        console.log('Testing Firestore connection...');
        const clinicsRef = collection(db, 'clinics');
        const q = query(clinicsRef, limit(1));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setStatus('Connected to Firestore (no clinics found)');
        } else {
          setStatus(`Connected to Firestore (found ${snapshot.size} clinic)`);
        }
      } catch (err: any) {
        console.error('Firebase connection error:', err);
        setError(err.message || 'Unknown error');
        setStatus('Connection failed');
      }
    };

    checkConfig();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firebase Connection Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Connection Status:</h2>
        <p className={error ? 'text-red-600' : 'text-green-600'}>{status}</p>
        {error && (
          <div className="mt-2">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}
      </div>

      {config && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Configuration Check:</h2>
          <pre className="text-xs">{JSON.stringify(config, null, 2)}</pre>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <h3 className="font-semibold">Troubleshooting CORS Issues:</h3>
        <ul className="list-disc ml-5 mt-2">
          <li>Check browser console for detailed errors</li>
          <li>Try in incognito mode to rule out extensions</li>
          <li>Ensure cookies are enabled for Firebase domains</li>
          <li>Check if third-party cookies are blocked</li>
        </ul>
      </div>
    </div>
  );
}