// cleanupFirebase.js
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, remove } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyAed5bn78c6Mb5Y3ezULH9CEg7IAKYFAps",
  authDomain: "chess-220ee.firebaseapp.com",
  databaseURL: "https://chess-220ee-default-rtdb.firebaseio.com",
  projectId: "chess-220ee",
  storageBucket: "chess-220ee.firebasestorage.app",
  messagingSenderId: "724477138097",
  appId: "1:724477138097:web:7dc15f79db3bda5c763e90"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function cleanup() {
  const gamesRef = ref(db, 'chess_games');
  const snapshot = await get(gamesRef);
  if (!snapshot.exists()) return;
  const games = snapshot.val();
  for (const key of Object.keys(games)) {
    if (!/^([a-fA-F0-9]{12})$/.test(key)) {
      // Not a valid invite code, delete it
      await remove(ref(db, `chess_games/${key}`));
      console.log(`Deleted: ${key}`);
    }
  }
  console.log('Cleanup complete!');
}
cleanup(); 