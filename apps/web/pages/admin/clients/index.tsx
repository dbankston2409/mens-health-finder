import React from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import ClientManagerPanel from '../../../components/admin/crm/ClientManagerPanel';
import { useAuth } from '../../../lib/contexts/authContext';

const ClientsPage: React.FC = () => {
  // You would typically use this to check user permissions
  const { userData } = useAuth();

  return (
    <AdminLayout title="Client Management">
      <ClientManagerPanel />
    </AdminLayout>
  );
};

export default ClientsPage;