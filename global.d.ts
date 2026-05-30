export {};

declare global {
  interface Window {
    ethereum?: {
      isCoinbaseWallet?: boolean;
      isMetaMask?: boolean;
      isOkxWallet?: boolean;
    };
  }
}
