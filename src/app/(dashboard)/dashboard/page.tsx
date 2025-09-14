import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from '@/lib/utils/currency';
import { invoiceServerQueries } from "@/lib/database/invoices";
import { clientServerQueries } from "@/lib/database/clients";

// Fetch dashboard data using server-side queries
async function getDashboardData(userId: string) {
  try {
    // Get all dashboard data in parallel
    const [invoiceStatsResult, recentInvoicesResult, clientStatsResult] =
      await Promise.all([
        invoiceServerQueries.getInvoiceStats(userId),
        invoiceServerQueries.getRecentInvoices(userId, 5),
        clientServerQueries.getClientStats(userId)
      ]);

    // Combine all data, using default values if there are errors
    const stats = {
      total_invoices: invoiceStatsResult.data?.total_invoices || 0,
      paid_invoices: invoiceStatsResult.data?.paid_invoices || 0,
      pending_invoices: invoiceStatsResult.data?.pending_invoices || 0,
      draft_invoices: invoiceStatsResult.data?.draft_invoices || 0,
      total_revenue: invoiceStatsResult.data?.total_revenue || 0,
      pending_revenue: invoiceStatsResult.data?.pending_revenue || 0,
      total_clients: clientStatsResult.data?.total_clients || 0
    };

    const recent_invoices = recentInvoicesResult.data || [];

    return {
      stats,
      recent_invoices
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return default data on error
    return {
      stats: {
        total_invoices: 0,
        paid_invoices: 0,
        pending_invoices: 0,
        draft_invoices: 0,
        total_revenue: 0,
        pending_revenue: 0,
        total_clients: 0
      },
      recent_invoices: []
    };
  }
}

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  const user = await currentUser();
  const dashboardData = await getDashboardData(userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User'}!
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your invoices, clients, and business settings
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">📄</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Invoices
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.total_invoices}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">✅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Paid Invoices
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.paid_invoices}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">⏳</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.pending_invoices}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">👥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Clients
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.total_clients}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/invoices/new"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center block"
                >
                  Create New Invoice
                </Link>
                <Link
                  href="/clients/new"
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center block"
                >
                  Add New Client
                </Link>
                <Link
                  href="/invoices"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center block"
                >
                  View All Invoices
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
                {dashboardData.recent_invoices.length > 0 && (
                  <Link
                    href="/invoices"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all
                  </Link>
                )}
              </div>
            </div>
            <div className="p-6">
              {dashboardData.recent_invoices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No invoices yet</p>
                  <p className="text-sm text-gray-400 mt-2">Create your first invoice to get started</p>
                  <Link
                    href="/invoices/new"
                    className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Create Invoice
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recent_invoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-3 h-3 rounded-full ${
                              invoice.status === 'paid' ? 'bg-green-500' :
                              invoice.status === 'sent' ? 'bg-blue-500' :
                              invoice.status === 'overdue' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {invoice.service_name || 'Untitled Invoice'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {invoice.buyer_name} • {new Date(invoice.issued_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total_gross_price || 0, invoice.currency || 'USD')}
                        </p>
                        <p className={`text-xs capitalize ${
                          invoice.status === 'paid' ? 'text-green-600' :
                          invoice.status === 'sent' ? 'text-blue-600' :
                          invoice.status === 'overdue' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {invoice.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}