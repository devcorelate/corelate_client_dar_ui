import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import 'flowbite/dist/flowbite.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
