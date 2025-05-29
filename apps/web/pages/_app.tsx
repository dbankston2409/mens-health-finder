import '@/styles/globals.css';
import '@/styles/map.css';
import type { AppProps } from 'next/app';
import Layout from '@/components/Layout';
import { AuthProvider } from '@/lib/contexts/authContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}