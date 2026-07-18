import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { useHygienistStore } from '../../../store/hygienistStore';
import { useAppointmentStore } from '../../../store/appointmentStore';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../shared/hooks/useToast';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { AIInsightsPanel } from '../../../shared/ui/AIInsightsPanel';

export function HygienistDashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const { patients, setActivePatientId, fetchPatients } = useHygienistStore();
  const { appointments, fetchAppointments, advanceStage } = useAppointmentStore();

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [fetchAppointments, fetchPatients]);

  const todayDate = new Date().toISOString().split('T')[0];

  // Map backend appointments to the UI model expected by today's patient list
  const mappedSchedule = useMemo(() => {
    const list = appointments.map((apt) => {
      let status = 'Pending';
      const s = apt.workflowStage || 'SCHEDULED';
      if (s === 'CHECKED_IN' || s === 'IN_PROGRESS' || s === 'CLEANING_PENDING' || s === 'TREATMENT_PENDING') {
        status = 'Arrived';
      } else if (s === 'COMPLETED') {
        status = 'Completed';
      }

      return {
        id: apt.id,
        time: apt.time,
        patientId: apt.patientId,
        patientDisplayId: apt.patient?.displayId || apt.patientId,
        name: apt.patientName,
        type: apt.type || 'Teeth Cleaning',
        status: status,
        workflowStage: s,
        patientCreatedAt: apt.patient?.createdAt ? new Date(apt.patient.createdAt) : new Date(0)
      };
    });

    return [...list].sort((a, b) => b.patientCreatedAt - a.patientCreatedAt);
  }, [appointments]);

  const handleStatusChange = async (id, newStatus) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    const currentStage = apt.workflowStage || 'SCHEDULED';

    if (newStatus === 'Arrived') {
      if (currentStage === 'SCHEDULED' || currentStage === 'CONFIRMED') {
        const res = await advanceStage(id, 'CHECKED_IN');
        if (res.success) toast.success('Patient checked in successfully!');
        else toast.error(res.error || 'Failed to check in');
      }
    } else if (newStatus === 'Completed') {
      if (currentStage === 'CHECKED_IN') {
        const res1 = await advanceStage(id, 'IN_PROGRESS');
        if (res1.success) {
          const res2 = await advanceStage(id, 'COMPLETED');
          if (res2.success) toast.success('Hygiene procedure completed');
          else toast.error(res2.error || 'Failed to complete procedure');
        } else {
          toast.error(res1.error || 'Failed to start procedure');
        }
      } else if (currentStage === 'IN_PROGRESS' || currentStage === 'CLEANING_PENDING' || currentStage === 'TREATMENT_PENDING') {
        const res = await advanceStage(id, 'COMPLETED');
        if (res.success) toast.success('Hygiene procedure completed');
        else toast.error(res.error || 'Failed to complete procedure');
      }
    }
  };

  const handleStartSession = (patientId, tab = 'perio') => {
    setActivePatientId(patientId);
    navigate(`/hygienist/patients/${patientId}?tab=${tab}`);
  };

  // Dynamic risk assessment based on real patient profiles
  const riskProfiles = useMemo(() => {
    const profiles = {};
    patients.forEach(pat => {
      let classification = 'Low';
      const riskFactors = [];
      const history = (pat.history || '').toLowerCase();
      const allergies = (Array.isArray(pat.allergies) ? pat.allergies.join(', ') : pat.allergies || '').toLowerCase();
      
      if (history.includes('smoking') || history.includes('diabetic') || history.includes('diabetes')) {
        classification = 'High';
        riskFactors.push('Smoking/Systemic');
      }
      if (allergies && allergies !== 'none') {
        riskFactors.push('Allergies');
        if (classification !== 'High') classification = 'Medium';
      }
      if (pat.age > 60) {
        riskFactors.push('Senior Recesses');
        if (classification !== 'High') classification = 'Medium';
      }
      
      profiles[pat.id] = {
        classification,
        riskFactors: riskFactors.length > 0 ? riskFactors : ['Low risks']
      };
    });
    return profiles;
  }, [patients]);

  // Calculations for KPI Cards
  const seenToday = mappedSchedule.filter((s) => s.status === 'Completed').length;
  const highRiskCount = Object.values(riskProfiles).filter((p) => p.classification === 'High').length;
  
  // Real patient recall counters
  const recallPending = useMemo(() => {
    return patients.filter(p => !p.appointments || p.appointments.length === 0).length;
  }, [patients]);
  
  const scheduledCount = useMemo(() => {
    return patients.filter(p => p.appointments && p.appointments.length > 0).length;
  }, [patients]);

  // Dynamic workload trends chart
  const monthlyWorkloadData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIndex - i + 12) % 12;
      last6Months.push(months[idx]);
    }

    const monthlyCounts = {};
    last6Months.forEach(m => {
      monthlyCounts[m] = { Prophy: 0, Perio: 0 };
    });

    appointments.forEach((appt) => {
      const date = new Date(appt.date);
      const m = months[date.getMonth()];
      if (monthlyCounts[m]) {
        if (appt.type?.toLowerCase().includes('cleaning') || appt.type?.toLowerCase().includes('prophy')) {
          monthlyCounts[m].Prophy++;
        } else {
          monthlyCounts[m].Perio++;
        }
      }
    });

    return last6Months.map(m => ({
      month: m,
      Prophy: monthlyCounts[m].Prophy || 0,
      Perio: monthlyCounts[m].Perio || 0
    }));
  }, [appointments]);

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            Preventive Hygiene Hub
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            Monitor perio status, clinical risks, auto-recalls, and clinical hygiene chart updates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/hygienist/patients')}
            className="font-bold text-xs gap-1.5 h-9"
          >
            Patients Registry
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Patients Completed</span>
              <h3 className="text-2xl font-black text-foreground mt-1">{seenToday} / {mappedSchedule.length}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span>Today's active session throughput</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">High Perio Risk</span>
              <h3 className="text-2xl font-black text-foreground mt-1">{highRiskCount}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground font-semibold">
            Active monitoring required for bone health
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Recall Pending</span>
              <h3 className="text-2xl font-black text-foreground mt-1">{recallPending}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <span className="text-amber-500 font-bold">Action Needed:</span>
            <span>Send automated recall invitations</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scheduled Cleanings</span>
              <h3 className="text-2xl font-black text-foreground mt-1">{scheduledCount}</h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground font-semibold">
            Booked preventive visits next 30 days
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Schedule (expanded to full grid width on wide screens) */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-primary animate-pulse" />
              Today's Hygiene Worklist
            </h3>
            <Badge variant="secondary" className="font-bold text-[10px] uppercase">
              Therapist: {user?.name || 'Elena Rostova'}, RDH
            </Badge>
          </div>

          <div className="overflow-x-auto">
            {mappedSchedule.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-semibold italic text-xs">
                No hygiene appointments scheduled for today
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <table className="hidden md:table w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      <th className="py-2.5">Time</th>
                      <th className="py-2.5">Patient</th>
                      <th className="py-2.5">Procedure Type</th>
                      <th className="py-2.5 text-center">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium text-foreground">
                    {mappedSchedule.map((appt) => {
                      const isAwaitingDentist = appt.workflowStage !== 'CLEANING_PENDING' && appt.workflowStage !== 'COMPLETED';
                      return (
                        <tr key={appt.id} className={`transition-colors ${isAwaitingDentist ? 'bg-muted/10 opacity-75' : 'hover:bg-muted/30'}`}>
                          <td className="py-3 font-bold text-primary">{appt.time}</td>
                          <td className="py-3">
                            <div className="font-extrabold text-foreground">{appt.name}</div>
                            <div className="text-[10px] text-muted-foreground">ID: #{appt.patientDisplayId || appt.patientId}</div>
                          </td>
                          <td className="py-3 text-muted-foreground">{appt.type}</td>
                          <td className="py-3 text-center">
                            {isAwaitingDentist ? (
                              <div className="flex flex-col items-center gap-1">
                                <select
                                  disabled
                                  value={appt.status}
                                  className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted border border-border outline-none opacity-50 cursor-not-allowed"
                                >
                                  <option value={appt.status}>{appt.status}</option>
                                </select>
                                {appt.workflowStage === 'TREATMENT_PENDING' ? (
                                  <Badge className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[9px] uppercase font-extrabold animate-pulse">
                                    Dentist Working
                                  </Badge>
                                ) : appt.workflowStage === 'IN_PROGRESS' ? (
                                  <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] uppercase font-extrabold animate-pulse">
                                    With Assistant
                                  </Badge>
                                ) : (
                                  <Badge className="bg-muted text-muted-foreground border border-border text-[9px] uppercase font-extrabold">
                                    Awaiting Check-In
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <select
                                value={appt.status}
                                onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-full bg-muted border border-border outline-none cursor-pointer ${
                                  appt.status === 'Completed'
                                    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                    : appt.status === 'Arrived'
                                    ? 'text-primary bg-primary/10 border-primary/20'
                                    : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Arrived">Arrived</option>
                                <option value="Completed">Completed</option>
                              </select>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              size="xs"
                              variant="primary"
                              disabled={isAwaitingDentist}
                              onClick={() => !isAwaitingDentist && handleStartSession(appt.patientId)}
                              className={`font-bold gap-1 text-[10px] h-7 ${
                                isAwaitingDentist 
                                  ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border'
                                  : 'cursor-pointer'
                              }`}
                            >
                              <Play className="h-3 w-3 fill-current" />
                              Perio Chart
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile Card List View */}
                <div className="flex flex-col gap-3 md:hidden">
                  {mappedSchedule.map((appt) => {
                    const isAwaitingDentist = appt.workflowStage !== 'CLEANING_PENDING' && appt.workflowStage !== 'COMPLETED';
                    return (
                      <div key={appt.id} className="p-4 border border-border/80 rounded-2xl bg-card text-left space-y-3 shadow-sm">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-xs font-black text-primary block">{appt.time}</span>
                            <h4 className="font-extrabold text-sm text-foreground">{appt.name}</h4>
                            <span className="text-[10px] text-muted-foreground font-semibold">ID: #{appt.patientDisplayId || appt.patientId}</span>
                          </div>
                          <div>
                            {isAwaitingDentist ? (
                              <div className="flex flex-col items-end gap-1.5">
                                <select
                                  disabled
                                  value={appt.status}
                                  className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-muted border border-border outline-none opacity-50 cursor-not-allowed"
                                >
                                  <option value={appt.status}>{appt.status}</option>
                                </select>
                                {appt.workflowStage === 'TREATMENT_PENDING' ? (
                                  <Badge className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[9px] uppercase font-extrabold animate-pulse">
                                    Dentist Working
                                  </Badge>
                                ) : appt.workflowStage === 'IN_PROGRESS' ? (
                                  <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] uppercase font-extrabold animate-pulse">
                                    With Assistant
                                  </Badge>
                                ) : (
                                  <Badge className="bg-muted text-muted-foreground border border-border text-[9px] uppercase font-extrabold">
                                    Awaiting Check-In
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <select
                                value={appt.status}
                                onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-muted border border-border outline-none cursor-pointer ${
                                  appt.status === 'Completed'
                                      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                      : appt.status === 'Arrived'
                                      ? 'text-primary bg-primary/10 border-primary/20'
                                      : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Arrived">Arrived</option>
                                <option value="Completed">Completed</option>
                              </select>
                            )}
                          </div>
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                          <span className="font-semibold text-muted-foreground/75">Procedure:</span> {appt.type}
                        </div>
                        <div className="pt-2 border-t border-border/40">
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={isAwaitingDentist}
                            onClick={() => !isAwaitingDentist && handleStartSession(appt.patientId)}
                            className={`w-full font-bold text-xs h-10 flex justify-center items-center gap-1.5 ${
                              isAwaitingDentist 
                                ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border'
                                : 'cursor-pointer'
                            }`}
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            Open Perio Chart
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Visual Workload Charts & High-Risk Patient List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart View (2 columns on lg) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-foreground">Therapeutic Workload Trends</h3>
            <p className="text-[10px] text-muted-foreground font-semibold">Weekly distribution of routine prophylaxis vs deep periodontal cleanings.</p>
          </div>
          
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyWorkloadData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProphy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPerio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="Prophy" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorProphy)" name="Prophy Cleaning" />
                <Area type="monotone" dataKey="Perio" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPerio)" name="Perio Treatment" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High Risk Patient List */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-foreground">Gum Disease Monitoring</h3>
            <p className="text-[10px] text-muted-foreground font-semibold">Color-coded patient list sorted by risk rating.</p>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar">
            {patients.map((pat) => {
              const risk = riskProfiles[pat.id] || { classification: 'Low' };
              const riskVariant = risk.classification === 'High'
                ? 'destructive'
                : risk.classification === 'Medium'
                ? 'warning'
                : 'success';

              const appt = appointments.find(a => a.patientId === pat.id && a.date === todayDate);
              const isLocked = appt && appt.workflowStage !== 'CLEANING_PENDING' && appt.workflowStage !== 'COMPLETED';

              return (
                <div
                  key={pat.id}
                  onClick={() => {
                    if (isLocked) {
                      toast.warning('Patient is currently undergoing Assistant prep or Dentist treatment. Please wait.');
                      return;
                    }
                    handleStartSession(pat.id, 'risk');
                  }}
                  className={`p-3 border rounded-xl flex items-center justify-between transition-colors text-left ${
                    isLocked 
                      ? 'bg-muted/20 border-border/40 opacity-75 cursor-not-allowed'
                      : 'border-border/80 hover:bg-muted/40 cursor-pointer'
                  }`}
                  title={isLocked ? 'Awaiting Dentist / Assistant Prep' : 'Click to View Risk Analysis'}
                >
                  <div>
                    <h4 className="font-extrabold text-xs text-foreground">{pat.name}</h4>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                      {risk.riskFactors?.join(', ') || 'No active risk factors'}
                    </p>
                  </div>
                  <Badge variant={riskVariant} className="font-bold text-[9px] px-2 py-0.5 uppercase">
                    {risk.classification}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full pt-6">
        <AIInsightsPanel />
      </div>
    </div>
  );
}
export default HygienistDashboardPage;
