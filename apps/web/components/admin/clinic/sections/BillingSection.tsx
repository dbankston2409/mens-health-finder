import React from 'react';
import { DetailedClinic } from '../../../../utils/admin/useClinicData';

interface BillingSectionProps {
  billing: DetailedClinic['billing'];
}

const BillingSection: React.FC<BillingSectionProps> = ({ billing }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-900 text-green-300';
      case 'Pending':
        return 'bg-yellow-900 text-yellow-300';
      case 'Failed':
        return 'bg-red-900 text-red-300';
      case 'Refunded':
        return 'bg-blue-900 text-blue-300';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Payment Method & Upcoming Invoice */}
      <div className="md:col-span-1">
        <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Payment Method</h3>
          
          {billing.paymentMethod ? (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="text-xl font-medium mr-2">{billing.paymentMethod.brand}</div>
                <div className="text-gray-400">•••• {billing.paymentMethod.last4}</div>
              </div>
              <div className="text-sm text-gray-400">
                Expires {billing.paymentMethod.expMonth}/{billing.paymentMethod.expYear}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-400">No payment method on file</p>
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <button className="text-sm text-primary hover:text-primary-light">
              Update payment method
            </button>
          </div>
        </div>
        
        {billing.upcomingInvoice && (
          <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Upcoming Invoice</h3>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-400">Due Date</div>
                <div className="font-medium">
                  {new Date(billing.upcomingInvoice.date).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-400">Amount</div>
                <div className="font-medium">
                  {formatCurrency(billing.upcomingInvoice.amount)}
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-400">Description</div>
                <div className="font-medium">
                  {billing.upcomingInvoice.description}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Billing History */}
      <div className="md:col-span-2">
        <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Billing History</h3>
            <button className="text-sm px-3 py-1 rounded-md bg-gray-800 hover:bg-gray-700">
              Export History
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#222222]">
              <thead className="bg-[#0A0A0A]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222] bg-[#111111]">
                {billing.history.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-[#1A1A1A]">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {invoice.description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-400">
                      {invoice.method}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {billing.history.length === 0 && (
            <div className="py-6 text-center text-gray-400">
              <p>No billing history found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingSection;