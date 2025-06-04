import React from 'react';
import { GetServerSideProps } from 'next';
import AdminLayout from '../../components/admin/AdminLayout';
import DiscoveryControlPanel from '../../components/admin/discovery/DiscoveryControlPanel';
import ProtectedRoute from '../../components/ProtectedRoute';

const DiscoveryPage: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <div className="p-6">
          <DiscoveryControlPanel />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default DiscoveryPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {}
  };
};