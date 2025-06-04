import React from 'react';
import { useRouter } from 'next/router';
import ProviderProfilePage from '../../components/ProviderProfilePage';
import Layout from '../../components/Layout';

const ProviderPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  // TODO: Use the provider ID to fetch specific provider data
  console.log('Provider ID:', id);

  return (
    <Layout>
      <ProviderProfilePage />
    </Layout>
  );
};

export default ProviderPage;