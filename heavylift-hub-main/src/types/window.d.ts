export {};

declare global {
  interface Window {
    toggleSuspension: (value?: boolean) => void;
  }
}
