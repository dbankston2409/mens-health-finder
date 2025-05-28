import React from 'react';
import ClientManagerPanel from './ClientManagerPanel';
import ProtectedRoute from '../../../components/ProtectedRoute';

const CRMPage = () => {
  return (
    <ProtectedRoute adminOnly>
      <ClientManagerPanel />
    </ProtectedRoute>
  );
};

export default CRMPage;