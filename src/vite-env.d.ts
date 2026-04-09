/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional dedicated Solana mainnet RPC (Helius, Alchemy, etc.) — avoids public-RPC 403 in the browser. */
  readonly VITE_SOLANA_RPC_URL?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_DATABASE_URL?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
}

interface Window {
  ethereum?: any;
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    publicKey?: { toString: () => string };
  };
}
