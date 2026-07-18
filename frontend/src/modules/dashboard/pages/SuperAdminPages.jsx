import { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Plus,
  Sliders,
  DollarSign,
  Briefcase,
  UserCheck,
  Edit2,
  Trash2,
  Receipt,
  Download,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useSuperAdminStore } from '../../../store/superAdminStore';
import { DataTable } from '../../../shared/ui/DataTable';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { Badge } from '../../../shared/ui/Badge';
import { useToast } from '../../../shared/hooks/useToast';
import { Modal } from '../../../shared/ui/Modal';

// Helper badge component for active statuses
function StatusBadge({ status }) {
  if (status === 'Active' || status === 'Paid') {
    return <Badge variant="success">{status}</Badge>;
  } else if (status === 'Trialing' || status === 'Trial' || status === 'Unpaid') {
    return <Badge variant="info">{status}</Badge>;
  } else {
    return <Badge variant="destructive">{status}</Badge>;
  }
}

// 1. CLINICS MANAGEMENT PAGE (WITH COMPLETE CRUD)
export function SuperAdminClinicsPage() {
  const { clinics, addClinic, updateClinic, deleteClinic, fetchClinics, plans, fetchPlans } = useSuperAdminStore();
  const toast = useToast();

  // Fetch clinics and plans from backend on mount
  useEffect(() => {
    fetchClinics();
    fetchPlans();
  }, []);

  const planOptions = useMemo(() => {
    const placeholder = { value: '', label: 'Select Plan' };
    if (!plans || plans.length === 0) {
      return [
        placeholder,
        { value: 'Basic', label: 'Basic ($149.00/mo)' },
        { value: 'Premium', label: 'Premium ($299.00/mo)' },
        { value: 'Enterprise', label: 'Enterprise ($499.00/mo)' },
        { value: 'Trial', label: 'Trial Mode ($0.00/mo)' }
      ];
    }
    return [
      placeholder,
      ...plans.map(p => ({
        value: p.name,
        label: `${p.name} ($${p.fee.toFixed(2)}/mo)`
      }))
    ];
  }, [plans]);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeClinic, setActiveClinic] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');

  const handleOpenAdd = () => {
    setName('');
    setLocation('');
    setPhone('');
    setPlan('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (clinic) => {
    setActiveClinic(clinic);
    setName(clinic.name);
    setLocation(clinic.location);
    setPhone(clinic.phone);
    setPlan(clinic.plan || '');
    setStatus(clinic.status || '');
    setIsEditOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name || !location) return;
    addClinic({ name, location, phone, plan });
    toast.success(`Registered new location: ${name}`);
    setIsAddOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!activeClinic) return;
    updateClinic(activeClinic.id, { name, location, phone, plan, status });
    toast.success(`Updated clinic details for ${name}`);
    setIsEditOpen(false);
  };

  const handleDelete = (id, clinicName) => {
    if (confirm(`Are you sure you want to permanently delete clinic location "${clinicName}"?`)) {
      deleteClinic(id);
      toast.warning(`Permanently removed clinic: ${clinicName}`);
    }
  };

  const columns = [
    { key: 'id', header: 'Clinic ID', render: (c) => <span className="font-bold text-slate-500">#{c.id}</span> },
    { key: 'name', header: 'Clinic Name' },
    { key: 'location', header: 'Location / Region' },
    { key: 'phone', header: 'Phone' },
    { key: 'plan', header: 'SaaS Plan' },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="flex gap-1.5 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit(c)}
            className="h-8 w-8 rounded-full hover:bg-primary/10"
            title="Edit Details"
          >
            <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(c.id, c.name)}
            className="h-8 w-8 rounded-full hover:bg-destructive/10"
            title="Delete Clinic"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Clinics Locations Directory
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Monitor, register, and configure licensing details for all locations.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-1.5 w-full sm:w-auto justify-center">
          <Plus className="h-4 w-4" />
          Add Clinic Location
        </Button>
      </div>

      <div className="bg-card p-5 border border-border rounded-xl shadow-sm">
        <DataTable columns={columns} data={clinics} searchKey="name" searchPlaceholder="Search locations..." pageSize={10} />
      </div>

      {/* Add Location Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Clinic Location">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input label="Practice / Clinic Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Westside Dental" />
          <Input label="Office Location Address" value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="e.g. Seattle, WA" />
          <Input label="Phone Contact" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. (206) 555-0100" />
          <Select
            label="SaaS Plan Subscription"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            options={planOptions}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-4 w-full">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="w-full sm:w-auto h-11 sm:h-10">Cancel</Button>
            <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10">Save Location</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Location Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Clinic Settings">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input label="Practice / Clinic Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Office Location Address" value={location} onChange={(e) => setLocation(e.target.value)} required />
          <Input label="Phone Contact" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Select
            label="SaaS Plan Subscription"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            options={planOptions}
          />
          <Select
            label="Operational Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: 'Select Operational Status' },
              { value: 'Active', label: 'Active (Licensed)' },
              { value: 'Trialing', label: 'Trial Active' },
              { value: 'Suspended', label: 'Suspended (Overdue)' }
            ]}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-4 w-full">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="w-full sm:w-auto h-11 sm:h-10">Cancel</Button>
            <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// 2. SUBSCRIPTIONS PAGE (WITH CRUD ACTIONS)
export function SuperAdminSubscriptionsPage() {
  const {
    plans,
    fetchPlans,
    addPlan,
    updatePlan,
    deletePlan
  } = useSuperAdminStore();
  const toast = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  // Plan forms state
  const [isPlanAddOpen, setIsPlanAddOpen] = useState(false);
  const [isPlanEditOpen, setIsPlanEditOpen] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [planName, setPlanName] = useState('');
  const [planFee, setPlanFee] = useState('');
  const [planBilling, setPlanBilling] = useState('');
  const [planStatus, setPlanStatus] = useState('');
  const [planFeatures, setPlanFeatures] = useState('');

  const handleOpenPlanAdd = () => {
    setPlanName('');
    setPlanFee('');
    setPlanBilling('');
    setPlanStatus('');
    setPlanFeatures('');
    setIsPlanAddOpen(true);
  };

  const handleOpenPlanEdit = (p) => {
    setActivePlan(p);
    setPlanName(p.name);
    setPlanFee(String(p.fee));
    setPlanBilling(p.billingPeriod);
    setPlanStatus(p.status);
    setPlanFeatures(p.features);
    setIsPlanEditOpen(true);
  };

  const handlePlanAddSubmit = (e) => {
    e.preventDefault();
    if (!planName || !planFee) return;
    addPlan({ name: planName, fee: Number(planFee), billingPeriod: planBilling, status: planStatus, features: planFeatures });
    toast.success(`SaaS plan "${planName}" added successfully.`);
    setIsPlanAddOpen(false);
  };

  const handlePlanEditSubmit = (e) => {
    e.preventDefault();
    if (!activePlan) return;
    updatePlan(activePlan.id, { name: planName, fee: Number(planFee), billingPeriod: planBilling, status: planStatus, features: planFeatures });
    toast.success(`SaaS plan "${planName}" updated successfully.`);
    setIsPlanEditOpen(false);
  };

  const handlePlanDelete = (id, name) => {
    if (confirm(`Are you sure you want to permanently delete SaaS Plan "${name}"?`)) {
      deletePlan(id);
      toast.warning(`Deleted SaaS plan: ${name}`);
    }
  };

  const planColumns = [
    { key: 'name', header: 'Plan Name', render: (p) => <span className="font-bold">{p.name}</span> },
    { key: 'fee', header: 'Billing Rate', render: (p) => <span className="font-extrabold text-indigo-400">${p.fee.toFixed(2)}/{p.billingPeriod.toLowerCase() === 'monthly' ? 'mo' : 'yr'}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'features', header: 'Plan Features', render: (p) => <span className="text-xs text-muted-foreground truncate max-w-xs block font-semibold">{p.features}</span> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex gap-1.5 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenPlanEdit(p)}
            className="h-8 w-8 rounded-full hover:bg-primary/10"
            title="Edit Plan"
          >
            <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePlanDelete(p.id, p.name)}
            className="h-8 w-8 rounded-full hover:bg-destructive/10"
            title="Delete Plan"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Subscriptions Management
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Configure system-wide pricing subscription plans for the platform.</p>
        </div>
        <Button onClick={handleOpenPlanAdd} className="gap-1.5 w-full sm:w-auto justify-center">
          <Plus className="h-4 w-4" />
          Add Subscription Plan
        </Button>
      </div>

      <div className="bg-card p-5 border border-border rounded-xl shadow-sm">
        <DataTable columns={planColumns} data={plans} pageSize={10} />
      </div>

      {/* Add SaaS Plan Modal */}
      <Modal isOpen={isPlanAddOpen} onClose={() => setIsPlanAddOpen(false)} title="Create SaaS Subscription Plan">
        <form onSubmit={handlePlanAddSubmit} className="space-y-4">
          <Input label="Plan Name" value={planName} onChange={(e) => setPlanName(e.target.value)} required placeholder="e.g. Starter" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Monthly Fee ($)" type="number" step="0.01" value={planFee} onChange={(e) => setPlanFee(e.target.value)} required placeholder="e.g. 99" />
            <Select
              label="Billing Period"
              value={planBilling}
              onChange={(e) => setPlanBilling(e.target.value)}
              options={[
                { value: '', label: 'Select Period' },
                { value: 'Monthly', label: 'Monthly' },
                { value: 'Yearly', label: 'Yearly' }
              ]}
            />
          </div>
          <Select
            label="Plan Status"
            value={planStatus}
            onChange={(e) => setPlanStatus(e.target.value)}
            options={[
              { value: '', label: 'Select Status' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
          />
          <Input
            label="Plan Features (Comma-Separated)"
            value={planFeatures}
            onChange={(e) => setPlanFeatures(e.target.value)}
            placeholder="e.g. Unlimited staff, basic charts, recalls"
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-4 w-full">
            <Button type="button" variant="outline" onClick={() => setIsPlanAddOpen(false)} className="w-full sm:w-auto h-11 sm:h-10">Cancel</Button>
            <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10">Create Plan</Button>
          </div>
        </form>
      </Modal>

      {/* Edit SaaS Plan Modal */}
      <Modal isOpen={isPlanEditOpen} onClose={() => setIsPlanEditOpen(false)} title="Modify SaaS Subscription Plan">
        {activePlan && (
          <form onSubmit={handlePlanEditSubmit} className="space-y-4">
            <Input label="Plan Name" value={planName} onChange={(e) => setPlanName(e.target.value)} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Monthly Fee ($)" type="number" step="0.01" value={planFee} onChange={(e) => setPlanFee(e.target.value)} required />
              <Select
                label="Billing Period"
                value={planBilling}
                onChange={(e) => setPlanBilling(e.target.value)}
                options={[
                  { value: '', label: 'Select Period' },
                  { value: 'Monthly', label: 'Monthly' },
                  { value: 'Yearly', label: 'Yearly' }
                ]}
              />
            </div>
            <Select
              label="Plan Status"
              value={planStatus}
              onChange={(e) => setPlanStatus(e.target.value)}
              options={[
                { value: '', label: 'Select Status' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
              ]}
            />
            <Input
              label="Plan Features (Comma-Separated)"
              value={planFeatures}
              onChange={(e) => setPlanFeatures(e.target.value)}
            />
             <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-4 w-full">
               <Button type="button" variant="outline" onClick={() => setIsPlanEditOpen(false)} className="w-full sm:w-auto h-11 sm:h-10">Cancel</Button>
               <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10">Save Changes</Button>
             </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

// 3. BILLING PAGE (SaaS Invoices CRUD)
// CSV download utility (scoped)
function downloadSaasCSV(filename, rows, headers) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(','), ...rows.map((r) => headers.map((h) => escape(r[h] ?? '')).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SuperAdminBillingPage() {
  const { saasInvoices, clinics, users, plans, fetchPlans, addSaasInvoice, updateSaasInvoice, deleteSaasInvoice, fetchClinics, fetchUsers, fetchSaasInvoices } = useSuperAdminStore();
  const toast = useToast();

  // Fetch real data on mount
  useEffect(() => {
    fetchClinics();
    fetchUsers();
    fetchSaasInvoices();
    if (fetchPlans) fetchPlans();
  }, []);

  // Month-wise filter
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Dialog / Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  // Form states
  const [clinicId, setClinicId] = useState('');
  const [plan, setPlan] = useState('');
  const [amount, setAmount] = useState('299.00');
  const [issueDate, setIssueDate] = useState('');
  const [status, setStatus] = useState('');

  // ── ANALYTICS COMPUTATIONS ──────────────────────────────────────────────
  const mrr = useMemo(() =>
    saasInvoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + Number(i.amount), 0),
    [saasInvoices]
  );
  const activeClinicsCount = useMemo(() => clinics.filter((c) => c.status === 'Active').length, [clinics]);
  const trialClinicsCount = useMemo(() => clinics.filter((c) => c.status === 'Trial' || c.status === 'Trialing').length, [clinics]);
  const overdueClinicsCount = useMemo(() => saasInvoices.filter((i) => i.status === 'Overdue').length, [saasInvoices]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const filteredInvoices = useMemo(() => {
    const prefix = `${filterYear}-${String(filterMonth).padStart(2, '0')}`;
    return saasInvoices.filter((i) => i.issueDate?.startsWith(prefix));
  }, [saasInvoices, filterMonth, filterYear]);

  const handleDownloadMonthly = () => {
    const rows = filteredInvoices.map((i) => ({
      'Invoice ID': i.id,
      'Clinic': i.clinicName || clinics.find((c) => c.id === i.clinicId)?.name || '',
      'Plan': i.plan || 'Standard',
      'Amount': Number(i.amount).toFixed(2),
      'Issue Date': i.issueDate,
      'Status': i.status
    }));
    if (rows.length === 0) { toast.warning('No invoices found for this month.'); return; }
    downloadSaasCSV(`saas_billing_${filterYear}_${String(filterMonth).padStart(2,'0')}.csv`, rows, Object.keys(rows[0]));
    toast.success(`Exported ${rows.length} invoices for ${MONTHS[filterMonth - 1]} ${filterYear}.`);
  };

  const handleOpenAdd = () => {
    setClinicId('');
    setPlan('');
    setAmount('299.00');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setStatus('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (invoice) => {
    setActiveInvoice(invoice);
    setClinicId(invoice.clinicId);
    setPlan(invoice.plan || '');
    setAmount(String(invoice.amount));
    setIssueDate(invoice.issueDate);
    setStatus(invoice.status);
    setIsEditOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addSaasInvoice({ clinicId, amount, issueDate, status, plan });
    toast.success(`Generated new SaaS invoice.`);
    setIsAddOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!activeInvoice) return;
    updateSaasInvoice(activeInvoice.id, { clinicId, amount, issueDate, status, plan });
    toast.success(`Updated invoice details.`);
    setIsEditOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm(`Are you sure you want to delete invoice #${id}?`)) {
      deleteSaasInvoice(id);
      toast.warning(`Deleted SaaS invoice: #${id}`);
    }
  };

  const columns = [
    { key: 'id', header: 'Invoice ID', render: (i) => <span className="font-bold text-slate-500">#{i.id}</span> },
    { key: 'clinicName', header: 'Clinic Location' },
    {
      key: 'owner',
      header: 'Clinic Owner',
      render: (i) => {
        const owner = users.find((u) => u.clinicId === i.clinicId && u.role === 'clinic_owner');
        return owner ? (
          <div className="text-xs">
            <span className="font-semibold block text-foreground">{owner.name}</span>
            <span className="text-[10px] text-muted-foreground block">{owner.email}</span>
          </div>
        ) : (
          <span className="text-slate-400 font-semibold italic text-xs">No Owner Assigned</span>
        );
      }
    },
    { key: 'plan', header: 'Plan' },
    { key: 'amount', header: 'Billing Charge', render: (i) => <span className="font-extrabold">${i.amount.toFixed(2)}</span> },
    { key: 'issueDate', header: 'Billing Date' },
    { key: 'status', header: 'Payment State', render: (i) => <StatusBadge status={i.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (i) => (
        <div className="flex gap-1.5 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit(i)}
            className="h-8 w-8 rounded-full hover:bg-primary/10"
            title="Edit Invoice"
          >
            <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(i.id)}
            className="h-8 w-8 rounded-full hover:bg-destructive/10"
            title="Delete Invoice"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight">SaaS Billing & Revenue</h2>
            <p className="text-[10px] text-muted-foreground font-semibold">Subscription invoices, MRR tracking, and month-wise reports.</p>
          </div>
        </div>
        <Button onClick={handleOpenAdd} className="gap-1.5 font-bold text-xs h-9 w-full sm:w-auto justify-center">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* ── MRR Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Recurring Revenue', value: `$${mrr.toFixed(2)}`, icon: TrendingUp, color: 'text-primary bg-primary/10' },
          { label: 'Active Clinics', value: activeClinicsCount, icon: Building2, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Trial Clinics', value: trialClinicsCount, icon: Briefcase, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'Overdue Invoices', value: overdueClinicsCount, icon: AlertCircle, color: 'text-rose-500 bg-rose-500/10' }
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card border border-border p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{kpi.label}</span>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">{kpi.value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl ${kpi.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Month-wise Filter & Download ── */}
      <div className="flex flex-wrap gap-3 items-center p-4 bg-card border border-border rounded-2xl shadow-sm">
        <span className="text-xs font-extrabold text-muted-foreground">Monthly Report:</span>
        <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="text-xs font-bold bg-muted border border-border rounded-lg p-2 focus:outline-none text-foreground">
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="w-20 text-xs font-bold bg-muted border border-border rounded-lg p-2 focus:outline-none text-foreground" />
        <span className="text-[10px] text-muted-foreground font-semibold">
          {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found for {MONTHS[filterMonth - 1]} {filterYear}
        </span>
        <Button size="sm" variant="outline" onClick={handleDownloadMonthly} className="font-bold text-xs gap-1.5 h-9 ml-auto">
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

      <div className="bg-card p-5 border border-border rounded-xl shadow-sm">
        <DataTable columns={columns} data={saasInvoices} searchKey="clinicName" searchPlaceholder="Search by clinic name..." pageSize={10} />
      </div>

      {/* Add Invoice Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Generate SaaS Invoice">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Select
            label="Select Clinic"
            value={clinicId}
            onChange={(e) => {
              const selectedId = e.target.value;
              setClinicId(selectedId);
              if (selectedId) {
                const selectedClinic = clinics.find((c) => c.id === selectedId);
                if (selectedClinic) {
                  const currentPlan = selectedClinic.plan || 'Basic';
                  setPlan(currentPlan);
                  
                  // Auto-fill amount based on plan
                  const dbPlan = plans.find((p) => p.name.toLowerCase() === currentPlan.toLowerCase());
                  if (dbPlan) {
                    setAmount(String(dbPlan.price));
                  } else {
                    if (currentPlan === 'Basic') setAmount('149.00');
                    else if (currentPlan === 'Premium') setAmount('299.00');
                    else if (currentPlan === 'Enterprise') setAmount('499.00');
                    else if (currentPlan === 'Trial') setAmount('0.00');
                  }
                }
              } else {
                setPlan('');
                setAmount('299.00');
              }
            }}
            options={[
              { value: '', label: 'Select Clinic' },
              ...clinics.map((c) => ({ value: c.id, label: c.name }))
            ]}
          />
          {clinicId && (
            <Select
              label="SaaS Plan Subscription"
              value={plan}
              onChange={(e) => {
                const newPlan = e.target.value;
                setPlan(newPlan);
                const dbPlan = plans.find((p) => p.name.toLowerCase() === newPlan.toLowerCase());
                if (dbPlan) {
                  setAmount(String(dbPlan.price));
                } else {
                  if (newPlan === 'Basic') setAmount('149.00');
                  else if (newPlan === 'Premium') setAmount('299.00');
                  else if (newPlan === 'Enterprise') setAmount('499.00');
                  else if (newPlan === 'Trial') setAmount('0.00');
                }
              }}
              options={[
                { value: 'Basic', label: 'Basic ($149/mo)' },
                { value: 'Premium', label: 'Premium ($299/mo)' },
                { value: 'Enterprise', label: 'Enterprise ($499/mo)' },
                { value: 'Trial', label: 'Trial ($0/mo)' }
              ]}
              required
            />
          )}
          <Input label="Invoice Amount ($)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Input label="Billing Date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
          <Select
            label="Payment State"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: 'Select Status' },
              { value: 'Unpaid', label: 'Unpaid' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Overdue', label: 'Overdue' }
            ]}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-4 w-full">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="w-full sm:w-auto h-11 sm:h-10">Cancel</Button>
            <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10">Generate Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify SaaS Invoice">
        {activeInvoice && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Select
              label="Select Clinic"
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              options={[
                { value: '', label: 'Select Clinic' },
                ...clinics.map((c) => ({ value: c.id, label: c.name }))
              ]}
              disabled
            />
            {clinicId && (
              <Select
                label="SaaS Plan Subscription"
                value={plan}
                onChange={(e) => {
                  const newPlan = e.target.value;
                  setPlan(newPlan);
                  const dbPlan = plans.find((p) => p.name.toLowerCase() === newPlan.toLowerCase());
                  if (dbPlan) {
                    setAmount(String(dbPlan.price));
                  } else {
                    if (newPlan === 'Basic') setAmount('149.00');
                    else if (newPlan === 'Premium') setAmount('299.00');
                    else if (newPlan === 'Enterprise') setAmount('499.00');
                    else if (newPlan === 'Trial') setAmount('0.00');
                  }
                }}
                options={[
                  { value: 'Basic', label: 'Basic ($149/mo)' },
                  { value: 'Premium', label: 'Premium ($299/mo)' },
                  { value: 'Enterprise', label: 'Enterprise ($499/mo)' },
                  { value: 'Trial', label: 'Trial ($0/mo)' }
                ]}
                required
              />
            )}
            <Input label="Invoice Amount ($)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <Input label="Billing Date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
            <Select
              label="Payment State"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: '', label: 'Select Status' },
                { value: 'Unpaid', label: 'Unpaid' },
                { value: 'Paid', label: 'Paid' },
                { value: 'Overdue', label: 'Overdue' }
              ]}
            />
             <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-4 w-full">
               <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="w-full sm:w-auto h-11 sm:h-10">Cancel</Button>
               <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10">Save Changes</Button>
             </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

// 4. AI SETTINGS PAGE
export function SuperAdminAIPage() {
  const { clinics, toggleAiModule, fetchClinics } = useSuperAdminStore();
  const toast = useToast();

  // Fetch clinics on mount
  useEffect(() => {
    fetchClinics();
  }, []);

  const handleToggle = (clinicId, moduleName) => {
    toggleAiModule(clinicId, moduleName);
    toast.info(`Toggled AI module "${moduleName}" for clinic.`);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sliders className="h-6 w-6 text-primary" />
          System AI Settings & Controls
        </h2>
        <p className="text-xs text-muted-foreground font-semibold">Configure per-clinic access to advanced deep learning diagnostic features.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clinics.map((c) => (
          <div key={c.id} className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
            <div className="flex justify-between items-start border-b border-border pb-2">
              <div>
                <h4 className="font-bold text-foreground">{c.name}</h4>
                <span className="text-[10px] text-muted-foreground">{c.location}</span>
              </div>
              <Badge variant={c.plan === 'Enterprise' ? 'success' : c.plan === 'Premium' ? 'info' : 'secondary'}>
                {c.plan}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-foreground block">Radiograph Diagnostic Auditing</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">Automatic bone loss detection from DICOM.</span>
                </div>
                <button
                  onClick={() => handleToggle(c.id, 'diagnostic')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                    c.aiModules.diagnostic ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    c.aiModules.diagnostic ? 'translate-x-4.5' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-foreground block">Recall SMS Automation</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">Generative reminders to overdue patients.</span>
                </div>
                <button
                  onClick={() => handleToggle(c.id, 'recallSMS')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                    c.aiModules.recallSMS ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    c.aiModules.recallSMS ? 'translate-x-4.5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. GLOBAL REPORTS PAGE
export function SuperAdminReportsPage() {
  const { clinics, fetchClinics } = useSuperAdminStore();

  // Fetch clinics on mount
  useEffect(() => {
    fetchClinics();
  }, []);

  const chartData = useMemo(() => {
    return clinics.map((c) => ({
      name: c.name.split(' ')[0],
      Revenue: c.revenue,
      Licensing: c.monthlyFee * 12
    }));
  }, [clinics]);

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          Global Reports & Financial Analysis
        </h2>
        <p className="text-xs text-muted-foreground font-semibold">Analyze annual licensing revenues vs clinic-level collections.</p>
      </div>

      <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Clinic Collections vs HQ SaaS Billing (Annualized)</h3>
        <div className="h-64 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
              <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 500 }} />
              <YAxis tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 500 }} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
              <Bar dataKey="Revenue" fill="#6366f1" name="Clinic Collections" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Licensing" fill="#10b981" name="HQ SaaS Income" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// 6. USER MANAGEMENT PAGE (WITH COMPLETE CRUD)
export function SuperAdminUsersPage() {
  const { users, clinics, addUser, updateUser, deleteUser, approveUser, fetchUsers, fetchClinics } = useSuperAdminStore();
  const toast = useToast();

  // Fetch real data on mount
  useEffect(() => {
    fetchUsers();
    fetchClinics();
  }, []);

  // Dialog / Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [password, setPassword] = useState('123');

  // Filter to display Clinic Owners by Status
  const clinicOwners = useMemo(() => {
    return users.filter((u) => {
      if (u.role !== 'clinic_owner') return false;
      if (statusFilter === 'all') return true;
      return u.status === statusFilter;
    });
  }, [users, statusFilter]);

  const handleOpenAdd = () => {
    setName('');
    setEmail('');
    setClinicId('');
    setPassword('123');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (userItem) => {
    setActiveUser(userItem);
    setName(userItem.name);
    setEmail(userItem.email);
    setClinicId(userItem.clinicId);
    setPassword(userItem.password || '');
    setIsEditOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;
    addUser({ name, email, role: 'clinic_owner', clinicId, password, status: 'Approved' });
    toast.success(`Clinic Owner "${name}" created successfully.`);
    setIsAddOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!activeUser) return;
    updateUser(activeUser.id, { name, email, role: 'clinic_owner', clinicId, password });
    toast.success(`Clinic Owner settings updated for ${name}`);
    setIsEditOpen(false);
  };

  const handleDelete = (id, userName) => {
    if (confirm(`Are you sure you want to delete clinic owner "${userName}"?`)) {
      deleteUser(id);
      toast.warning(`Deleted credential access for clinic owner: ${userName}`);
    }
  };

  const handleApprove = (id, userName) => {
    approveUser(id);
    toast.success(`Approved login access for clinic owner: ${userName}`);
  };

  // Maps clinic Id to clinic name
  const clinicNames = useMemo(() => {
    return clinics.reduce((acc, c) => {
      acc[c.id] = c.name;
      return acc;
    }, {});
  }, [clinics]);

  const columns = [
    { key: 'id', header: 'User ID', render: (u) => <span className="font-bold text-slate-500">#{u.id}</span> },
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role Type', render: () => <span className="font-semibold text-slate-500">Clinic Owner</span> },
    { key: 'email', header: 'Email' },
    { key: 'clinic', header: 'Associated Office', render: (u) => <span>{clinicNames[u.clinicId] || 'Global Office'}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (u) => {
        let variant = 'info';
        if (u.status === 'Approved') variant = 'success';
        if (u.status === 'Suspended') variant = 'destructive';
        const displayText = u.status === 'Pending_Approval' || u.status === 'Pending Approval' ? 'Pending' : (u.status || 'Approved');
        return (
          <Badge variant={variant}>
            {displayText}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex gap-1.5 justify-end">
          {u.status === 'Pending_Approval' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleApprove(u.id, u.name)}
              className="h-8 w-8 rounded-full hover:bg-emerald-500/10"
              title="Approve Clinic Owner"
            >
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit(u)}
            className="h-8 w-8 rounded-full hover:bg-primary/10"
            title="Edit Clinic Owner"
          >
            <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(u.id, u.name)}
            className="h-8 w-8 rounded-full hover:bg-destructive/10"
            title="Delete Clinic Owner"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Clinic Owner Directory
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Manage authorization credentials and approvals for all clinic owners.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-1.5 w-full sm:w-auto justify-center">
          <Plus className="h-4 w-4" />
          Add Clinic Owner
        </Button>
      </div>

      {/* Status Filter row */}
      <div className="flex flex-wrap items-center gap-2.5 bg-card/60 backdrop-blur-md p-4 border border-border rounded-xl shadow-xs">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1.5 select-none">Filter Status:</span>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
          className="text-xs h-9 px-4 font-semibold select-none cursor-pointer"
        >
          All ({users.filter(u => u.role === 'clinic_owner').length})
        </Button>
        <Button
          variant={statusFilter === 'Pending_Approval' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('Pending_Approval')}
          className="text-xs h-9 px-4 font-semibold select-none cursor-pointer text-blue-500 border-blue-500/20 hover:bg-blue-500/10"
        >
          Pending ({users.filter(u => u.role === 'clinic_owner' && u.status === 'Pending_Approval').length})
        </Button>
        <Button
          variant={statusFilter === 'Approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('Approved')}
          className="text-xs h-9 px-4 font-semibold select-none cursor-pointer text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
        >
          Approved ({users.filter(u => u.role === 'clinic_owner' && u.status === 'Approved').length})
        </Button>
        <Button
          variant={statusFilter === 'Suspended' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('Suspended')}
          className="text-xs h-9 px-4 font-semibold select-none cursor-pointer text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
        >
          Suspended ({users.filter(u => u.role === 'clinic_owner' && u.status === 'Suspended').length})
        </Button>
      </div>

      <div className="bg-card p-5 border border-border rounded-xl shadow-sm">
        <DataTable columns={columns} data={clinicOwners} searchKey="name" searchPlaceholder="Search clinic owners by name..." pageSize={10} />
      </div>

      {/* Add User Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Clinic Owner Credential">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Elena Rostova" />
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="e.g. elena@clinic.com" />
          <Input label="Account Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password for login" />
          <Select
            label="Assigned Clinic Name"
            value={clinicId}
            onChange={(e) => setClinicId(e.target.value)}
            options={[
              { value: '', label: 'Select Clinic' },
              ...clinics.map((c) => ({ value: c.id, label: c.name }))
            ]}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-4 w-full">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="w-full sm:w-auto h-11 sm:h-10">Cancel</Button>
            <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10">Create Clinic Owner</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Clinic Owner Credentials">
        {activeUser && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Account Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password for login" />
            <Select
              label="Assigned Clinic Name"
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              options={[
                { value: '', label: 'Select Clinic' },
                ...clinics.map((c) => ({ value: c.id, label: c.name }))
              ]}
            />
             <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-4 w-full">
               <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="w-full sm:w-auto h-11 sm:h-10">Cancel</Button>
               <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10">Save Changes</Button>
             </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
