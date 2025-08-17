declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.css' {
  const content: string
  export default content
}

declare module '*.png' {
  const value: string
  export default value
}

declare module '*.jpg' {
  const value: string
  export default value
}

declare module '*.jpeg' {
  const value: string
  export default value
}

declare module '*.gif' {
  const value: string
  export default value
}

declare module '*.svg' {
  const value: string
  export default value
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }

  interface Window {
    _firebaseConfigLogged?: boolean;
    __MALLEX_DEV__?: boolean;
  }
}

// React Window Types
declare module 'react-window' {
  export interface ListProps {
    children: React.ComponentType<any>;
    height: number;
    itemCount: number;
    itemSize: number | ((index: number) => number);
    width?: number | string;
    itemData?: any;
    overscanCount?: number;
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
  }
  
  export const FixedSizeList: React.ComponentType<ListProps>;
  export const VariableSizeList: React.ComponentType<ListProps>;
}

declare module 'react-window-infinite-loader' {
  export interface InfiniteLoaderProps {
    children: React.ComponentType<any>;
    isItemLoaded: (index: number) => boolean;
    itemCount: number;
    loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
    minimumBatchSize?: number;
    threshold?: number;
  }
  
  export default class InfiniteLoader extends React.Component<InfiniteLoaderProps> {}
}

// Vite-spezifische Typen für import.meta
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_HASH_ROUTER?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};