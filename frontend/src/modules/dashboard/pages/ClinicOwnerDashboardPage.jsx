import { useMemo, useEffect } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useClinicOwnerStore } from '../../../store/clinicOwnerStore';
import { useAppointmentStore } from '../../../store/appointmentStore';
import { Badge } from '../../../shared/ui/Badge';
import { AIInsightsPanel } from '../../../shared/ui/AIInsightsPanel';

export function ClinicOwnerDashboardPage() {
  const { patients, staff, invoices, fetchPatients, fetchStaff, fetchInvoices } = useClinicOwnerStore();
  const { appointments, fetchAppointments } = useAppointmentStore();

  useEffect(() => {
    fetchPatients();
    fetchStaff();
    fetchAppointments();
    fetchInvoices();
  }, [fetchPatients, fetchStaff, fetchAppointments, fetchInvoices]);

  // Scoped KPIs calculation
  const totalPatients = patients.length;
  const activeStaff = staff.filter((s) => s.status === 'Active').length;
  const pendingInvoices = invoices.filter((i) => i.status === 'Unpaid' || i.status === 'Partial').length;
  const todayDate = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter((a) => a.date === todayDate);


  // Dynamic Chart data from backend
  const revenueChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIndex - i + 12) % 12;
      last6Months.push(months[idx]);
    }

    const monthlyRevenue = {};
    last6Months.forEach(m => {
      monthlyRevenue[m] = 0;
    });

    if (invoices && invoices.length > 0) {
      invoices.forEach((inv) => {
        if (inv.status === 'Paid') {
          const m = months[new Date(inv.date).getMonth()];
          if (monthlyRevenue[m] !== undefined) {
            monthlyRevenue[m] += inv.amount;
          }
        }
      });
    }

    return last6Months.map(m => ({
      name: m,
      Revenue: monthlyRevenue[m] || 0
    }));
  }, [invoices]);

  const flowChartData = useMemo(() => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };
    
    appointments.forEach((a) => {
      const day = weekdays[new Date(a.date).getDay()];
      if (counts[day] !== undefined) {
        counts[day]++;
      }
    });

    return Object.keys(counts).map(day => ({
      name: day,
      Patients: counts[day] || 0
    }));
  }, [appointments]);

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Title */}
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
          Clinic Administration Hub
        </h2>
        <p className="text-xs text-muted-foreground font-semibold">Real-time indicators, staff allocations, and treatment logs for this location.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Total Patients</span>
            <h4 className="text-2xl font-black text-foreground">{totalPatients}</h4>
          </div>
          <div className="bg-indigo-500/10 text-indigo-500 p-3 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Appointments Today</span>
            <h4 className="text-2xl font-black text-foreground">{todayApts.length}</h4>
          </div>
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Pending Invoices</span>
            <h4 className="text-2xl font-black text-destructive">{pendingInvoices}</h4>
          </div>
          <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Active Staff</span>
            <h4 className="text-2xl font-black text-emerald-500">{activeStaff}</h4>
          </div>
          <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Recharts Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue flows */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" />
            Monthly Collections ($)
          </h3>
          <div className="h-64 lg:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
                <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 500 }} />
                <YAxis tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 500 }} />
                <Tooltip formatter={(v) => `$${v}`} />
                <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient flows */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-4 w-4 text-indigo-400" />
            Daily Patient Flow (Weekly)
          </h3>
          <div className="h-64 lg:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
                <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 500 }} />
                <YAxis tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 500 }} />
                <Tooltip />
                <Bar dataKey="Patients" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Scheduler Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Timeline list */}
        <div className="lg:col-span-3 bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4 text-left">
          <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            Scheduler Timeline &bull; Today
          </h3>

          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {todayApts.length > 0 ? (
              todayApts.map((apt) => (
                <div key={apt.id} className="p-3 bg-muted/45 border border-border/60 rounded-xl flex items-center justify-between hover:bg-muted/70 transition-colors">
                  <div className="space-y-0.5 text-xs text-left">
                    <span className="font-bold text-foreground block">{apt.patientName}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold block">{apt.type || apt.treatment} &bull; Dentist: {apt.dentistName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-md">
                      {apt.time}
                    </span>
                    <Badge variant={apt.status === 'Confirmed' ? 'success' : 'info'}>
                      {apt.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <span className="text-muted-foreground text-xs font-semibold italic block py-4 text-center">No appointments scheduled for today</span>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights at the bottom */}
      <div className="w-full">
        <AIInsightsPanel />
      </div>
    </div>
  );
}
export default ClinicOwnerDashboardPage;
