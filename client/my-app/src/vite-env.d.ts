/// <reference types="vite/client" />
declare module '*.css';

declare module '*.svg' {
    const content: any;
    export default content;
  }
  
  declare module '*.png';
  declare module '*.jpg';
  declare module '*.jpeg';
  declare module '*.gif';
  declare module '*.webp';