import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, Activity, FlaskConical, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePatientStore } from '../../../store/patientStore';
import { AIInsightsPanel } from '../../../shared/ui/AIInsightsPanel';

export function PatientDashboard() {
  const navigate = useNavigate();
  const { patientProfile, appointments, treatmentPlans, invoices, labStatus } = usePatientStore();

  // Find next appointment (upcoming date)
  const nextAppointment = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = appointments
      .filter((a) => a.date >= today && a.status === 'Scheduled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    return upcoming[0] || null;
  }, [appointments]);

  // Compute pending balance
  const pendingPayments = useMemo(() => {
    const unpaid = invoices.filter((i) => i.status === 'Unpaid' || i.status === 'Partial');
    return unpaid.reduce((sum, inv) => sum + (inv.amount - inv.patientPaid - inv.insurancePaid), 0);
  }, [invoices]);

  // Compute treatment progress bar
  const treatmentProgress = useMemo(() => {
    if (treatmentPlans.length === 0) return 0;
    const completed = treatmentPlans.filter((t) => t.status === 'Completed' || t.status === 'Accepted').length;
    return Math.round((completed / treatmentPlans.length) * 100);
  }, [treatmentPlans]);

  // Active Lab Case status
  const activeLab = useMemo(() => {
    return labStatus.find((l) => l.status !== 'Delivered') || labStatus[0] || null;
  }, [labStatus]);

  const getLabProgressWidth = (status) => {
    switch (status) {
      case 'Created': return 'w-1/5 bg-blue-500';
      case 'Sent': return 'w-2/5 bg-orange-500';
      case 'In Progress': return 'w-3/5 bg-amber-500';
      case 'Ready': return 'w-4/5 bg-indigo-500';
      case 'Delivered': return 'w-full bg-emerald-500';
      default: return 'w-0';
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-16 md:pb-0">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-3xl p-6 sm:p-8 text-primary-foreground shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome Back, {patientProfile?.name || 'James'}!
          </h2>
          <p className="text-xs text-primary-foreground/90 font-bold max-w-xl">
            Track your appointments, view treatment progress reports, check invoices, and review clinical files in real-time.
          </p>
        </div>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Treatment Progress</span>
            <Activity className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-foreground">{treatmentProgress}%</h3>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-2 border border-border/40">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${treatmentProgress}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold mt-2">
              {treatmentPlans.filter((t) => t.status === 'Completed').length} of {treatmentPlans.length} procedures completed.
            </p>
          </div>
        </div>

        {/* Payments Card */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Pending Dues</span>
            <CreditCard className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-foreground">${pendingPayments.toFixed(2)}</h3>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-semibold">Invoices outstanding</span>
              {pendingPayments > 0 && (
                <button
                  onClick={() => navigate('/patient/billing')}
                  className="text-[9px] font-black uppercase text-primary hover:underline cursor-pointer"
                >
                  Pay Balance &rarr;
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1.5">
              Secure Stripe-integrated portal ledger.
            </p>
          </div>
        </div>

        {/* Lab Orders Card */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Lab Cases Status</span>
            <FlaskConical className="h-4.5 w-4.5 text-indigo-500" />
          </div>
          <div className="mt-3">
            {activeLab ? (
              <div>
                <div className="flex justify-between items-baseline gap-1">
                  <h3 className="text-sm font-extrabold text-foreground truncate">{activeLab.type} Fabrication</h3>
                  <span className="text-xs font-black text-indigo-600">${Number(activeLab.cost).toFixed(2)}</span>
                </div>
                <div className="mt-2 bg-muted h-1.5 rounded-full overflow-hidden border border-border/40">
                  <div className={`h-full rounded-full transition-all ${getLabProgressWidth(activeLab.status)}`} />
                </div>
                <p className="text-[9px] text-muted-foreground font-black mt-2 uppercase tracking-wide">
                  Stage: <strong className="text-primary">{activeLab.status}</strong> ({activeLab.labName})
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-extrabold text-muted-foreground">No Active Lab Orders</h3>
                <p className="text-[10px] text-muted-foreground font-semibold mt-2">All implants, crowns, and bridges delivered.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AIInsightsPanel />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Appointment column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-primary" />
              Your Next Scheduled Visit
            </h3>

            {nextAppointment ? (
              <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{nextAppointment.type} Care Session</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Clinic ID: #{nextAppointment.clinicId} · Metropolitan Dental</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider block self-start sm:self-auto">
                    Confirmed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider block text-muted-foreground font-bold">Provider / Dentist</span>
                    <span className="text-foreground">{nextAppointment.dentistName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider block text-muted-foreground font-bold">Date & Time</span>
                    <span className="text-primary font-bold">{nextAppointment.date} at {nextAppointment.time} ({nextAppointment.duration} mins)</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase tracking-wider block text-muted-foreground font-bold">Pre-Session Notes</span>
                    <span className="text-muted-foreground text-[11px] leading-relaxed block">{nextAppointment.notes || 'Standard clinical prep instructions.'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2 stroke-1" />
                <h4 className="text-xs font-bold text-foreground">No upcoming visits booked</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Please contact receptionist workspace to book a slot.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick details / Allergy block */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
              Patient Health Card
            </h3>

            <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-3.5 text-xs font-semibold leading-normal">
              <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Allergies:</span><span className={`font-extrabold px-2 py-0.5 rounded ${patientProfile?.allergies && patientProfile.allergies !== 'None' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'text-foreground bg-muted'}`}>{patientProfile?.allergies || 'None'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Latest Vitals:</span><span className="font-extrabold text-foreground">{patientProfile?.vitals || 'BP: 120/80'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Clinical Status:</span><span className="font-extrabold text-emerald-500">Active</span></div>
            </div>

            {patientProfile?.history && (
              <div className="space-y-1.5 border-t border-border/60 pt-3 text-xs leading-normal font-semibold">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">EHR Case History Summary</span>
                <p className="text-muted-foreground text-[11px] font-medium bg-muted/20 p-2.5 border border-border rounded-xl">
                  {patientProfile.history}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick layout helper icon if missing
function ShieldCheck({ className }) {
  return <CheckCircle2 className={className} />;
}

export default PatientDashboard;
