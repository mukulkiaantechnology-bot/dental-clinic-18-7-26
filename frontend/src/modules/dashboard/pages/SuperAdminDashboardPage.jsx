import { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  Building2,
  CreditCard,
  Coins,
  Sliders,
  TrendingUp,
  Users,
  ScrollText,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useSuperAdminStore } from '../../../store/superAdminStore';
import { useClinicStore } from '../../../store/clinicStore';
import { useToast } from '../../../shared/hooks/useToast';
import { Modal } from '../../../shared/ui/Modal';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { Badge } from '../../../shared/ui/Badge';
import { AIInsightsPanel } from '../../../shared/ui/AIInsightsPanel';
import { DemoFlowButton } from '../../../shared/ui/DemoFlowButton';

export function SuperAdminDashboardPage() {
  const selectedClinicId = useClinicStore((state) => state.selectedClinicId);
  const { clinics, auditLogs, toggleAiModule, updateSubscription, addClinic, fetchClinics, fetchUsers, fetchSaasInvoices, fetchAuditLogs } = useSuperAdminStore();
  const toast = useToast();

  // Fetch all data on mount
  useEffect(() => {
    fetchClinics();
    fetchUsers();
    fetchSaasInvoices();
    fetchAuditLogs();
  }, []);

  // Dialog / Modal state
  const [isAddClinicOpen, setIsAddClinicOpen] = useState(false);
  const [isEditLicenseOpen, setIsEditLicenseOpen] = useState(false);
  const [selectedClinicToEdit, setSelectedClinicToEdit] = useState(null);

  // Form states for adding clinic
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicLocation, setNewClinicLocation] = useState('');
  const [newClinicPhone, setNewClinicPhone] = useState('');
  const [newClinicPlan, setNewClinicPlan] = useState('');

  // Form states for license editing
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Find active clinic if single context is selected
  const activeClinic = useMemo(() => {
    if (selectedClinicId === 'all') return null;
    return clinics.find((c) => c.id === selectedClinicId);
  }, [selectedClinicId, clinics]);

  // Aggregate statistics dynamically based on selected clinic context
  const stats = useMemo(() => {
    if (activeClinic) {
      return {
        totalClinics: 1,
        activeSubscriptions: activeClinic.status === 'Active' ? 1 : 0,
        monthlyRevenue: activeClinic.revenue,
        totalPatients: activeClinic.patients,
        licensePlan: activeClinic.plan,
        score: activeClinic.performanceScore
      };
    }

    return {
      totalClinics: clinics.length,
      activeSubscriptions: clinics.filter((c) => c.status === 'Active').length,
      monthlyRevenue: clinics.reduce((sum, c) => sum + c.revenue, 0),
      totalPatients: clinics.reduce((sum, c) => sum + c.patients, 0),
      licensePlan: 'All (Multi)',
      score: Math.round(clinics.reduce((sum, c) => sum + c.performanceScore, 0) / clinics.length)
    };
  }, [activeClinic, clinics]);

  // Mock revenue trends data for AreaChart
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    if (activeClinic) {
      // Scale dynamic values for a single clinic
      const base = activeClinic.revenue;
      return months.map((m, idx) => {
        const factor = 0.75 + (idx * 0.05) + (Math.sin(idx) * 0.05);
        return {
          name: m,
          Revenue: Math.round(base * factor)
        };
      });
    }

    // Return aggregated values for all clinics combined
    const base = stats.monthlyRevenue || 40000;
    return months.map((m, idx) => {
      const factor = 0.75 + (idx * 0.05) + (Math.sin(idx) * 0.05);
      return {
        name: m,
        Revenue: Math.round(base * factor)
      };
    });
  }, [activeClinic, stats.monthlyRevenue]);

  // Share comparison chart data
  const pieData = useMemo(() => {
    return clinics.map((c) => ({
      name: c.name.split(' ')[0],
      value: c.revenue || 1000
    }));
  }, [clinics]);

  const COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#f59e0b'];

  const handleOpenEditLicense = (clinic) => {
    setSelectedClinicToEdit(clinic);
    setEditPlan(clinic.plan || '');
    setEditStatus(clinic.status || '');
    setIsEditLicenseOpen(true);
  };

  const handleSaveLicense = (e) => {
    e.preventDefault();
    if (!selectedClinicToEdit) return;

    updateSubscription(selectedClinicToEdit.id, editPlan, editStatus);
    toast.success(`License settings updated for ${selectedClinicToEdit.name}.`);
    setIsEditLicenseOpen(false);
  };

  const handleAddClinicSubmit = (e) => {
    e.preventDefault();
    if (!newClinicName || !newClinicLocation) {
      toast.error('Please fill out all required fields.');
      return;
    }

    addClinic({
      name: newClinicName,
      location: newClinicLocation,
      phone: newClinicPhone || '(555) 000-0000',
      plan: newClinicPlan,
      status: 'Active',
      patients: 100,
      revenue: newClinicPlan === 'Enterprise' ? 20000 : newClinicPlan === 'Premium' ? 12000 : 5000,
      performanceScore: 85,
      aiModules: { diagnostic: false, recallSMS: false, workload: false }
    });

    toast.success(`Registered clinic ${newClinicName} successfully.`);
    setIsAddClinicOpen(false);

    // Reset forms
    setNewClinicName('');
    setNewClinicLocation('');
    setNewClinicPhone('');
    setNewClinicPlan('');
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left pb-12">
      {/* Title Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2 select-none">
            <Shield className="h-8 w-8 text-primary" />
            Global HQ Control Panel
          </h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            {selectedClinicId === 'all'
              ? 'Multi-Clinic SaaS platform aggregates and operational licensing controls.'
              : `Active filter location: ${activeClinic?.name}`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          <DemoFlowButton />
          <Button onClick={() => setIsAddClinicOpen(true)} className="gap-2 select-none cursor-pointer w-full sm:w-auto h-11 sm:h-10 text-xs font-bold whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Add Clinic Location
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total locations */}
        <div className="bg-card/60 backdrop-blur-md border border-border/80 p-5 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Clinics</span>
            <h3 className="text-3xl font-extrabold text-foreground">{stats.totalClinics}</h3>
            <p className="text-[10px] font-semibold text-muted-foreground">Active SaaS Accounts</p>
          </div>
          <div className="bg-primary/10 text-primary p-3.5 rounded-xl dark:bg-primary/20">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Active Licensing plans */}
        <div className="bg-card/60 backdrop-blur-md border border-border/80 p-5 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Plans</span>
            <h3 className="text-3xl font-extrabold text-foreground">{stats.activeSubscriptions}</h3>
            <p className="text-[10px] font-semibold text-indigo-400">Licensed locations</p>
          </div>
          <div className="bg-indigo-500/10 text-indigo-400 p-3.5 rounded-xl dark:bg-indigo-500/20">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Monthly licensing volume */}
        <div className="bg-card/60 backdrop-blur-md border border-border/80 p-5 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Monthly Revenue</span>
            <h3 className="text-3xl font-extrabold text-foreground">
              ${(stats.monthlyRevenue || 0).toLocaleString()}
            </h3>
            <p className="text-[10px] font-semibold text-success flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              +12.4% vs last month
            </p>
          </div>
          <div className="bg-success/10 text-success p-3.5 rounded-xl dark:bg-success/20">
            <Coins className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Total patients */}
        <div className="bg-card/60 backdrop-blur-md border border-border/80 p-5 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Patients</span>
            <h3 className="text-3xl font-extrabold text-foreground">
              {(stats.totalPatients || 0).toLocaleString()}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground">Aggregated dental registry</p>
          </div>
          <div className="bg-cyan-500/10 text-cyan-400 p-3.5 rounded-xl dark:bg-cyan-500/20">
            <Users className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Charts Visualization Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area Chart: Billing revenue trend */}
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
              Monthly Revenue Performance
            </h3>
            <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0.5 px-2">
              6-Month Trend
            </Badge>
          </div>
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
                <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 500 }} className="text-muted-foreground" />
                <YAxis tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 500 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card, #fff)',
                    border: '1px solid var(--color-border, #e2e8f0)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                />
                <Area type="monotone" dataKey="Revenue" stroke="var(--color-primary, #6366f1)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share breakdown chart */}
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-indigo-400" />
            Revenue Share distribution
          </h3>
          <div className="h-52 md:h-[200px] w-full flex items-center justify-center">
            {selectedClinicId === 'all' ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 text-xs text-muted-foreground font-semibold">
                Share distribution disabled. Viewing single clinic context.
              </div>
            )}
          </div>
          {selectedClinicId === 'all' && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] font-bold">
              {pieData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}:</span>
                  <span className="text-foreground">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <AIInsightsPanel />

      {/* Clinic Benchmarking Table */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm text-left">
        <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building2 className="h-4.5 w-4.5 text-primary" />
          Clinic Benchmarking & AI Provisioning Control
        </h3>
        
        <div className="overflow-x-auto rounded-lg border border-border">
          {/* Desktop Table View */}
          <table className="hidden lg:table w-full text-sm text-left">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground border-b border-border select-none">
              <tr>
                <th className="py-3 px-4 font-bold">Clinic Name</th>
                <th className="py-3 px-4 font-bold">Plan</th>
                <th className="py-3 px-4 font-bold">Monthly Fee</th>
                <th className="py-3 px-4 font-bold">Patients</th>
                <th className="py-3 px-4 font-bold text-center">Revenue</th>
                <th className="py-3 px-4 font-bold text-center">Score</th>
                <th className="py-3 px-4 font-bold text-center">Diagnostic AI</th>
                <th className="py-3 px-4 font-bold text-center">Recall SMS AI</th>
                <th className="py-3 px-4 font-bold text-center">License State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clinics.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="py-3.5 px-4 font-bold">
                    <div>
                      <span className="text-foreground">{c.name}</span>
                      <span className="block text-[10px] text-muted-foreground font-semibold mt-0.5">{c.location}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-xs text-indigo-400">{c.plan}</td>
                  <td className="py-3.5 px-4 font-extrabold">${c.monthlyFee.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-semibold">{c.patients}</td>
                  <td className="py-3.5 px-4 font-extrabold text-foreground/90">${c.revenue.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`font-extrabold text-xs py-0.5 px-1.5 rounded-md ${
                      c.performanceScore >= 90 ? 'bg-success/10 text-success' : c.performanceScore >= 80 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-warning/10 text-warning'
                    }`}>
                      {c.performanceScore}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => {
                        toggleAiModule(c.id, 'diagnostic');
                        toast.info(`Toggled AI Diagnostic module for ${c.name}.`);
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-250 cursor-pointer ${
                        c.aiModules.diagnostic ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-250 ${
                        c.aiModules.diagnostic ? 'translate-x-4.5' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => {
                        toggleAiModule(c.id, 'recallSMS');
                        toast.info(`Toggled AI Recall SMS module for ${c.name}.`);
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-250 cursor-pointer ${
                        c.aiModules.recallSMS ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-250 ${
                        c.aiModules.recallSMS ? 'translate-x-4.5' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Badge variant={c.status === 'Active' ? 'success' : c.status === 'Trialing' ? 'info' : 'destructive'}>
                        {c.status}
                      </Badge>
                      <button
                        onClick={() => handleOpenEditLicense(c)}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card List View */}
          <div className="flex flex-col gap-3 lg:hidden p-1">
            {clinics.map((c) => (
              <div key={c.id} className="p-4 border border-border/80 rounded-2xl bg-card text-left space-y-4 shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{c.name}</h4>
                    <span className="block text-[10px] text-muted-foreground font-semibold mt-0.5">{c.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={c.status === 'Active' ? 'success' : c.status === 'Trialing' ? 'info' : 'destructive'}>
                      {c.status}
                    </Badge>
                    <button
                      onClick={() => handleOpenEditLicense(c)}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer ml-1"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-border/40 py-2.5 my-1.5">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase">SaaS Plan</span>
                    <span className="font-semibold text-indigo-400">{c.plan}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Monthly Fee</span>
                    <span className="font-extrabold text-foreground">${c.monthlyFee.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Patients</span>
                    <span className="font-semibold text-foreground">{c.patients}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Revenue</span>
                    <span className="font-extrabold text-foreground">${c.revenue.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase mb-0.5">Performance Score</span>
                    <span className={`font-extrabold text-xs py-0.5 px-1.5 rounded-md ${
                      c.performanceScore >= 90 ? 'bg-success/10 text-success' : c.performanceScore >= 80 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-warning/10 text-warning'
                    }`}>
                      {c.performanceScore}%
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-between pt-1 text-xs">
                  <div className="flex justify-between items-center gap-2 sm:flex-1">
                    <div>
                      <span className="font-bold text-foreground block text-[11px]">Diagnostic AI</span>
                      <span className="text-[9px] text-muted-foreground font-semibold">Automatic bone loss detection</span>
                    </div>
                    <button
                      onClick={() => {
                        toggleAiModule(c.id, 'diagnostic');
                        toast.info(`Toggled AI Diagnostic module for ${c.name}.`);
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-250 cursor-pointer ${
                        c.aiModules.diagnostic ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-250 ${
                        c.aiModules.diagnostic ? 'translate-x-4.5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="h-px bg-border/40 sm:hidden" />

                  <div className="flex justify-between items-center gap-2 sm:flex-1">
                    <div>
                      <span className="font-bold text-foreground block text-[11px]">Recall SMS AI</span>
                      <span className="text-[9px] text-muted-foreground font-semibold">Generative reminders to overdue</span>
                    </div>
                    <button
                      onClick={() => {
                        toggleAiModule(c.id, 'recallSMS');
                        toast.info(`Toggled AI Recall SMS module for ${c.name}.`);
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-250 cursor-pointer ${
                        c.aiModules.recallSMS ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-250 ${
                        c.aiModules.recallSMS ? 'translate-x-4.5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time System Audit Logs (Bottom) */}
      <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4 text-left">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <ScrollText className="h-4.5 w-4.5 text-muted-foreground" />
          <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Audit Log Stream</h3>
        </div>
        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 no-scrollbar text-xs font-semibold text-muted-foreground">
          {auditLogs.map((log) => (
            <div key={log.id} className="border-b border-border pb-2 last:border-0 last:pb-0">
              <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-0.5">
                <span className="text-primary font-bold">{log.user}</span>
                <span>{log.timestamp}</span>
              </div>
              <p className="text-foreground/90 font-medium text-left leading-relaxed">{log.action}</p>
              <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-bold uppercase mt-1 inline-block">{log.clinic}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Clinic Modal Dialog */}
      <Modal isOpen={isAddClinicOpen} onClose={() => setIsAddClinicOpen(false)} title="Register New Clinic location">
        <form onSubmit={handleAddClinicSubmit} className="space-y-4">
          <Input
            label="Practice / Clinic Name"
            placeholder="e.g. Westside Pediatric Dental"
            value={newClinicName}
            onChange={(e) => setNewClinicName(e.target.value)}
          />
          <Input
            label="Office Address"
            placeholder="e.g. 505 Pacific Ave, Tacoma, WA"
            value={newClinicLocation}
            onChange={(e) => setNewClinicLocation(e.target.value)}
          />
          <Input
            label="Contact Phone"
            placeholder="e.g. (253) 555-0182"
            value={newClinicPhone}
            onChange={(e) => setNewClinicPhone(e.target.value)}
          />
          <Select
            label="SaaS Plan Subscription"
            value={newClinicPlan}
            onChange={(e) => setNewClinicPlan(e.target.value)}
            options={[
              { value: '', label: 'Select Plan' },
              { value: 'Basic', label: 'Basic Plan ($149/mo)' },
              { value: 'Premium', label: 'Premium Plan ($299/mo)' },
              { value: 'Enterprise', label: 'Enterprise Plan ($499/mo)' },
              { value: 'Trial', label: 'Trial Mode ($0/mo)' }
            ]}
          />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-4 w-full">
            <Button variant="outline" type="button" onClick={() => setIsAddClinicOpen(false)} className="w-full sm:w-auto h-11 sm:h-10">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10">Register Location</Button>
          </div>
        </form>
      </Modal>

      {/* Edit License Modal Dialog */}
      <Modal isOpen={isEditLicenseOpen} onClose={() => setIsEditLicenseOpen(false)} title="Manage Clinic License">
        {selectedClinicToEdit && (
          <form onSubmit={handleSaveLicense} className="space-y-4 text-left">
            <div className="bg-muted/50 p-4 border border-border rounded-xl mb-4 space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase">Clinic</span>
                <span className="text-foreground font-bold">{selectedClinicToEdit.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase">Current Plan</span>
                <span className="text-indigo-400 font-bold">{selectedClinicToEdit.plan}</span>
              </div>
            </div>

            <Select
              label="Update Plan"
              value={editPlan}
              onChange={(e) => setEditPlan(e.target.value)}
              options={[
                { value: '', label: 'Select Plan' },
                { value: 'Basic', label: 'Basic Plan ($149/mo)' },
                { value: 'Premium', label: 'Premium Plan ($299/mo)' },
                { value: 'Enterprise', label: 'Enterprise Plan ($499/mo)' },
                { value: 'Trial', label: 'Trial Mode ($0/mo)' }
              ]}
            />

            <Select
              label="SaaS Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              options={[
                { value: '', label: 'Select Status' },
                { value: 'Active', label: 'Active (Licensed)' },
                { value: 'Trialing', label: 'Trial Active' },
                { value: 'Suspended', label: 'Suspended (Overdue)' }
              ]}
            />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-4 w-full">
              <Button variant="outline" type="button" onClick={() => setIsEditLicenseOpen(false)} className="w-full sm:w-auto h-11 sm:h-10">
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10">Save Settings</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
export default SuperAdminDashboardPage;
