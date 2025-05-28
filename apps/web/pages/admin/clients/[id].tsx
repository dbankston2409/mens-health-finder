import React from 'react';
import { useRouter } from 'next/router';
import ClinicDetailPage from '../../../components/admin/clinic/ClinicDetailPage';

const ClientDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  return <ClinicDetailPage />;
};

export default ClientDetailPage;