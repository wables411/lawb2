/// <reference types="vite/client" />

interface Window {
  ethereum?: any;
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    publicKey?: { toString: () => string };
  };
}
