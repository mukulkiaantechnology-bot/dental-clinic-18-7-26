import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DollarSign, Plus, CreditCard } from 'lucide-react';
import {
  BillingDashboardTab,
  BillingInvoicesTab,
  BillingPaymentsTab,
  BillingClaimsTab,
  BillingStatementsTab
} from '../../dashboard/pages/BillingPages';
import { useBillingStore } from '../../../store/billingStore';
import { useClinicOwnerStore } from '../../../store/clinicOwnerStore';

export function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const fetchBillingData = useBillingStore((state) => state.fetchBillingData);
  const fetchPatients = useClinicOwnerStore((state) => state.fetchPatients);

  useEffect(() => {
    fetchBillingData();
    fetchPatients();
  }, [fetchBillingData, fetchPatients]);

  const BILLING_TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'invoices', label: 'Invoices', icon: '🧾' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'claims', label: 'Claims', icon: '🛡️' },
    { id: 'statements', label: 'Statements', icon: '📋' }
  ];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <BillingDashboardTab />;
      case 'invoices':  return <BillingInvoicesTab />;
      case 'payments':  return <BillingPaymentsTab />;
      case 'claims':    return <BillingClaimsTab />;
      case 'statements': return <BillingStatementsTab />;
      default: return <BillingDashboardTab />;
    }
  };

  return (
    <div className="space-y-5 text-left animate-fade-in pb-16 md:pb-0">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Billing Operations Hub</h2>
          <p className="text-[10px] text-muted-foreground font-semibold">Invoices, payments, claims, and statements management.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 border border-border rounded-xl w-full sm:w-fit max-w-full overflow-x-auto no-scrollbar">
        {BILLING_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/70'
            }`}
          >
            <span className="text-sm sm:text-base leading-none">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="min-h-[500px]">
        {renderTab()}
      </div>

      {/* Sticky Mobile CTA Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-card border-t border-border flex gap-3 z-40 md:hidden shadow-lg">
        <button
          onClick={() => navigate('/billing?tab=invoices&action=create-invoice')}
          className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
        <button
          onClick={() => navigate('/billing?tab=payments&action=record-payment')}
          className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CreditCard className="h-4 w-4" /> Record Payment
        </button>
      </div>
    </div>
  );
}
export default BillingPage;
