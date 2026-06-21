/// <reference types="vite/client" />

// CSS module declarations for TypeScript
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Image declarations
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}
