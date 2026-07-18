import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Bell,
  Sparkles,
  Calendar,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { useDentalAssistantStore } from '../../../store/dentalAssistantStore';
import { useAppointmentStore } from '../../../store/appointmentStore';
import { useAlertStore } from '../../../store/alertStore';
import { useDentistStore } from '../../../store/dentistStore';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';
import { Badge } from '../../../shared/ui/Badge';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { DataTable } from '../../../shared/ui/DataTable';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';

export function TodayPatientsPage({ view = 'dashboard' }) {
  const navigate = useNavigate();
  const toast = useToast();

  const { setActivePatientId, fetchTodayPatients, updatePatientStatus } = useDentalAssistantStore();
  const { appointments, fetchAppointments, advanceStage } = useAppointmentStore();
  const { patients: dentistPatients, fetchPatients } = useDentistStore();
  const { alerts, subscribeToRoleAlerts } = useAlertStore();
  const user = useAuthStore((state) => state.user);

  // 2. Map backend appointments to friendly clinical stages (must be first — others depend on it)
  const mappedPatients = useMemo(() => {
    const list = appointments.map((apt) => {
      let assistantStatus = 'Scheduled';
      const s = apt.workflowStage || 'SCHEDULED';

      if (s === 'CHECKED_IN') {
        assistantStatus = 'Checked In';
      } else if (s === 'IN_PROGRESS' || s === 'CLEANING_PENDING' || s === 'TREATMENT_PENDING') {
        assistantStatus = 'In Treatment';
      } else if (s === 'COMPLETED') {
        assistantStatus = 'Completed';
      }

      return {
        id: apt.patientId,
        displayId: apt.patient?.displayId || apt.patientId,
        appointmentId: apt.id,
        name: apt.patientName,
        age: apt.patient?.age || 35,
        dentistName: apt.dentistName || 'Not Assigned',
        treatmentType: apt.type || 'Teeth Cleaning',
        status: assistantStatus,
        workflowStage: s,
        gender: apt.patient?.gender || 'M',
        phone: apt.patient?.phone || '',
        patientCreatedAt: apt.patient?.createdAt ? new Date(apt.patient.createdAt) : new Date(0)
      };
    });

    return [...list].sort((a, b) => b.patientCreatedAt - a.patientCreatedAt);
  }, [appointments]);

  const activeIntakes = useMemo(() => {
    return mappedPatients.filter(p => p.status === 'Checked In' || p.status === 'In Treatment');
  }, [mappedPatients]);

  const procedureData = useMemo(() => {
    const counts = {};
    mappedPatients.forEach(p => {
      const type = p.treatmentType || 'Cleaning';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name: name.length > 12 ? name.slice(0, 10) + '..' : name,
      Count: count
    })).slice(0, 4);
  }, [mappedPatients]);

  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDentist, setSelectedDentist] = useState('All');
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');

  // 1. Initial Data Fetching
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAppointments(),
          fetchTodayPatients(),
          fetchPatients()
        ]);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();

    const unsubscribe = subscribeToRoleAlerts();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchAppointments, fetchTodayPatients, subscribeToRoleAlerts]);


  const uniqueDentists = ['All', ...new Set(mappedPatients.map((p) => p.dentistName).filter(Boolean))];
  const dentistOptions = uniqueDentists.map((name) => ({
    value: name,
    label: name === 'All' ? 'All Dentists' : name
  }));

  const filteredPatients = mappedPatients.filter((p) => {
    const matchesStatus = filter === 'All' || p.status === filter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDentist = selectedDentist === 'All' || p.dentistName === selectedDentist;
    return matchesStatus && matchesSearch && matchesDentist;
  });

  const handleSeatPatient = async (patientId, appointmentId) => {
    // 1. Advance stage to IN_PROGRESS (meaning assistant started prep)
    const res = await advanceStage(appointmentId, 'IN_PROGRESS');
    if (res.success) {
      updatePatientStatus(patientId, 'In Treatment');
      toast.success('Patient seated. Preparation active.');
      // 2. Set active context and redirect directly to Patient details page
      setActivePatientId(patientId);
      navigate(`/assistant/patients/${patientId}?tab=chairside&id=${patientId}`);
    } else {
      toast.error(res.error || 'Failed to seat patient.');
    }
  };

  const handleOpenWorkspace = (patientId) => {
    setActivePatientId(patientId);
    navigate(`/assistant/patients/${patientId}?tab=chairside&id=${patientId}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
        return <Badge className="bg-muted text-muted-foreground border border-border font-bold text-[10px]">Scheduled</Badge>;
      case 'Checked In':
        return <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-[10px]">Checked In</Badge>;
      case 'In Treatment':
        return <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold text-[10px] animate-pulse">In Treatment</Badge>;
      case 'Completed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-[10px]">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // KPIs
  const totalPatients = mappedPatients.length;
  const waitingCount = mappedPatients.filter(p => p.status === 'Checked In').length;
  const inTreatmentCount = mappedPatients.filter(p => p.status === 'In Treatment').length;
  const completedCount = mappedPatients.filter(p => p.status === 'Completed').length;


  const allPatientsColumns = useMemo(() => [
    {
      key: 'name',
      header: 'Patient Name',
      render: (p) => (
        <div className="flex items-center gap-3 py-1 text-left">
          <div className="bg-primary/10 text-primary h-9 w-9 rounded-full flex items-center justify-center font-extrabold text-xs">
            {p.name.charAt(0)}
          </div>
          <div>
            <span className="font-extrabold text-xs text-foreground block">{p.name}</span>
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Age {p.age} &bull; {p.gender || 'Other'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (p) => <span className="font-semibold text-xs text-foreground">{p.phone}</span>
    },
    {
      key: 'createdAt',
      header: 'Reg. Date',
      render: (p) => (
        <span className="font-semibold text-xs text-foreground/80">
          {p.createdAt ? new Date(p.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (p) => <Badge variant={p.status === 'Active' ? 'success' : 'secondary'}>{p.status}</Badge>
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => navigate(`/assistant/patients/${p.id}?tab=chairside&id=${p.id}`)}
            className="font-extrabold text-[10px] gap-1 cursor-pointer h-8"
          >
            Open Workspace
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ], [navigate]);

  const quickFilters = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Last 7 Days' },
    { id: 'month', label: 'Last 30 Days' },
  ];

  const handleQuickFilter = (filterId) => {
    setActiveQuickFilter(filterId);
    if (filterId === 'all') {
      setStartDate('');
      setEndDate('');
    } else {
      const now = new Date();
      let start = new Date();
      start.setHours(0, 0, 0, 0);
      
      if (filterId === 'today') {
        setStartDate(now.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
      } else if (filterId === 'week') {
        start.setDate(now.getDate() - 7);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
      } else if (filterId === 'month') {
        start.setDate(now.getDate() - 30);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
      }
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setActiveQuickFilter('all');
  };

  const parseLocalDate = (dateStr, isEndOfDay = false) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return isEndOfDay 
      ? new Date(year, month - 1, day, 23, 59, 59, 999) 
      : new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  const activeAllPatients = useMemo(() => {
    let list = dentistPatients.filter((p) => p.status === 'Active');

    const start = parseLocalDate(startDate, false);
    const end = parseLocalDate(endDate, true);

    if (start) {
      list = list.filter((p) => p.createdAt && new Date(p.createdAt) >= start);
    }
    if (end) {
      list = list.filter((p) => p.createdAt && new Date(p.createdAt) <= end);
    }

    if (searchQuery) {
      list = list.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return list;
  }, [dentistPatients, searchQuery, startDate, endDate]);

  if (loading && mappedPatients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center flex-1 h-[60vh]">
        <Clock className="h-8 w-8 text-primary animate-spin mb-4" />
        <h3 className="text-md font-bold text-foreground">Loading workstation...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      {/* ─── DASHBOARD VIEW ─── */}
      {view === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Greeting Banner */}
          <div className="space-y-4">
            <div className="border-b border-border pb-4">
              <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                Clinical Assistant Control Center
              </h2>
              <p className="text-xs text-muted-foreground font-semibold">
                Review daily intakes, workspace status checklists, and clinical alert protocols.
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary/80 to-indigo-600/80 backdrop-blur-md border border-primary/20 p-6 rounded-3xl shadow-sm text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group">
              <div className="space-y-1 z-10">
                <h3 className="text-xl md:text-2xl font-black tracking-tight">
                  Hello, {user?.name || 'David Miller'}!
                </h3>
                <p className="text-xs text-primary-foreground/90 font-medium max-w-xl leading-relaxed">
                  Welcome back to your workspace. You have <strong className="text-amber-300 font-extrabold">{waitingCount}</strong> patient(s) waiting in the check-in queue. Seat them to begin chairside preparation.
                </p>
              </div>
              <div className="absolute right-0 top-0 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                <Sparkles className="h-40 w-40 text-white" />
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-xs relative overflow-hidden hover:scale-[1.01] transition-transform duration-250 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Scheduled</span>
                <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">{totalPatients}</h3>
              </div>
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-xs relative overflow-hidden hover:scale-[1.01] transition-transform duration-250 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Arrived (Checked In)</span>
                <h3 className="text-xl sm:text-2xl font-black text-amber-500 mt-1">{waitingCount}</h3>
              </div>
              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-xs relative overflow-hidden hover:scale-[1.01] transition-transform duration-250 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Currently Seated</span>
                <h3 className="text-xl sm:text-2xl font-black text-blue-500 mt-1">{inTreatmentCount}</h3>
              </div>
              <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-xs relative overflow-hidden hover:scale-[1.01] transition-transform duration-250 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Completed Duties</span>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-500 mt-1">{completedCount}</h3>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Primary Operations Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Intakes Queue (Table) */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                  <Activity className="h-4.5 w-4.5 text-primary animate-pulse" />
                  Today's Patient Queue
                </h3>
                <Badge variant="secondary" className="font-bold text-[9px] uppercase">
                  Live Status
                </Badge>
              </div>
              <div className="overflow-x-auto min-h-[200px]">
                {activeIntakes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center text-xs text-muted-foreground select-none">
                    <Users className="h-8 w-8 text-muted-foreground/60 mb-2 stroke-1" />
                    <p className="font-bold text-foreground">No patients currently waiting or seated.</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5">Use the scheduler to seat arriving patients.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        <th className="py-2.5">Patient</th>
                        <th className="py-2.5">Procedure</th>
                        <th className="py-2.5 text-center">Status</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium text-foreground">
                      {activeIntakes.map((p) => (
                        <tr key={p.appointmentId} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3">
                            <div className="font-extrabold text-foreground">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground">Dentist: {p.dentistName}</div>
                          </td>
                          <td className="py-3 font-semibold text-primary">{p.treatmentType}</td>
                          <td className="py-3 text-center">{getStatusBadge(p.status)}</td>
                          <td className="py-3 text-right">
                            {p.status === 'Checked In' ? (
                              <Button
                                size="xs"
                                variant="primary"
                                className="font-extrabold text-[10px] h-7 gap-1 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white border-0"
                                onClick={() => handleSeatPatient(p.id, p.appointmentId)}
                              >
                                <Play className="h-3 w-3" /> Seat Patient
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleOpenWorkspace(p.id)}
                                className="font-extrabold text-[10px] gap-1 cursor-pointer h-7"
                              >
                                Workspace <ArrowRight className="h-3 w-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Alert Logs */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-primary" />
                Assistant Alert Log
              </h3>
              
              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1 text-xs">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground italic font-semibold">
                    No active notifications.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 border rounded-xl text-left space-y-1 transition-all ${
                        alert.type === 'critical' || alert.type === 'warning'
                          ? 'bg-rose-500/5 border-rose-500/10 text-rose-800 dark:text-rose-300'
                          : 'bg-muted/40 border-border/40 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-foreground truncate max-w-[120px]">{alert.title}</span>
                        <span className="text-[8px] text-muted-foreground font-semibold">
                          {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] leading-relaxed font-semibold font-medium">
                        {alert.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Secondary Row: Guidelines & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Guidelines Card */}
            <div className="lg:col-span-2 bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4 text-left">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <Activity className="h-4.5 w-4.5 text-primary" />
                Assistant Workspace Guidelines
              </h3>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                Welcome to your daily workspace overview. Use the <strong>AI Appointment Scheduler</strong> to monitor when patients are checked in by the receptionist. Once arrived, select the patient to seat them, which activates the clinical tools (Chairside Checklist, X-Ray Uploads, and Clinical Notes).
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-1 hover:border-primary/20 transition-colors">
                  <span className="text-primary font-bold text-xs block">1. Check-in Alerts</span>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Receptionist check-ins show instantly in the scheduler queue and generate live logs.</p>
                </div>
                <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-1 hover:border-primary/20 transition-colors">
                  <span className="text-primary font-bold text-xs block">2. Seating & Preparation</span>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Starting seat prep transitions the patient and grants you editing access to clinical checklists.</p>
                </div>
                <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-1 hover:border-primary/20 transition-colors">
                  <span className="text-primary font-bold text-xs block">3. Dentist Hand-off</span>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Once checklists, notes, and radiography files are saved, click "Assign to Dentist" to unlock the dentist's operations.</p>
                </div>
                <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-1 hover:border-primary/20 transition-colors">
                  <span className="text-primary font-bold text-xs block">4. Hygiene Session</span>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Hygienists take over cleaning operations once the Dentist signs off on surgical details.</p>
                </div>
              </div>
            </div>

            {/* Recharts Procedure Breakdown */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                Today's Procedures Split
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={procedureData.length > 0 ? procedureData : [{ name: 'Intakes', Count: 1 }]}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
                    <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 500 }} />
                    <YAxis tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 500 }} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 11 }} />
                    <Bar dataKey="Count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={16}>
                      {(procedureData.length > 0 ? procedureData : [{ name: 'Intakes', Count: 1 }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SCHEDULER VIEW ─── */}
      {view === 'scheduler' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-border pb-4">
            <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              AI Appointment Scheduler
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              Track real-time receptionist intakes, assign seatings, and pass patient records to dentist.
            </p>
          </div>

          <div className="flex justify-between items-center bg-card border border-border p-4 rounded-2xl shadow-sm gap-4">
            <Input
              placeholder="Search patients by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs text-foreground font-medium flex-1"
            />
            <div className="flex items-center gap-2">
              <Select
                value={selectedDentist}
                onChange={(e) => setSelectedDentist(e.target.value)}
                options={dentistOptions}
                className="text-xs font-bold text-foreground w-44"
              />
              <div className="flex bg-muted p-0.5 rounded-lg border border-border shrink-0">
                {['All', 'Checked In', 'In Treatment', 'Completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilter(st)}
                    className={`px-3 py-1 rounded-md text-[9px] font-extrabold cursor-pointer whitespace-nowrap transition-all ${
                      filter === st
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 bg-card border border-border rounded-2xl text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3 stroke-1" />
              <h3 className="text-sm font-bold text-foreground">No appointments in queue</h3>
              <p className="text-xs text-muted-foreground font-semibold mt-1">There are no appointments matching the active search parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((p) => (
                <div
                  key={p.appointmentId}
                  className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between hover:border-primary/40 text-left relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-sm text-foreground">{p.name}</h3>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block mt-0.5">
                          Age {p.age} &bull; Dentist: {p.dentistName}
                        </span>
                      </div>
                      {getStatusBadge(p.status)}
                    </div>

                    <div className="h-px bg-border/40" />

                    <div className="space-y-1 text-[11px] font-semibold text-muted-foreground">
                      <div className="flex justify-between"><span>Scheduled Time:</span><span className="text-foreground">{p.phone || '09:00 AM'}</span></div>
                      <div className="flex justify-between"><span>Procedure:</span><span className="text-primary font-bold">{p.treatmentType}</span></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-2">
                    {p.status === 'Checked In' && (
                      <Button
                        size="xs"
                        variant="primary"
                        className="font-extrabold text-[10px] h-8 w-full gap-1 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => handleSeatPatient(p.id, p.appointmentId)}
                      >
                        <Play className="h-3 w-3" /> Seat & Start Prep
                      </Button>
                    )}
                    {p.status === 'In Treatment' && (
                      <Button
                        size="xs"
                        className="font-extrabold text-[10px] h-8 w-full gap-1 cursor-pointer"
                        onClick={() => handleOpenWorkspace(p.id)}
                      >
                        Open Workspace
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                    {p.status === 'Completed' && (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 py-1.5 text-[10px] font-bold rounded-lg w-full text-center block">
                        Intake Completed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── PATIENTS REGISTER VIEW ─── */}
      {view === 'patients' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-border pb-4">
            <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              Patient Sessions Registry
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              Browse today's scheduled patient cases, review clinical prep history, and update intake workspaces.
            </p>
          </div>

          <div className="flex justify-between items-center bg-card border border-border p-4 rounded-2xl shadow-sm gap-4">
            <Input
              placeholder="Search active patients by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs text-foreground font-medium flex-1"
            />
          </div>

          <div className="bg-card p-5 border border-border rounded-2xl shadow-sm">
            {/* Date Filter Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-border">
              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider mr-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Quick Filters:
                </span>
                {quickFilters.map((qf) => (
                  <button
                    key={qf.id}
                    onClick={() => handleQuickFilter(qf.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      activeQuickFilter === qf.id
                        ? 'bg-primary text-white shadow-sm scale-[1.02]'
                        : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {qf.label}
                  </button>
                ))}
              </div>

              {/* Date Picker Inputs */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setActiveQuickFilter('custom');
                    }}
                    className="flex h-9 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setActiveQuickFilter('custom');
                    }}
                    className="flex h-9 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
                  />
                </div>
                {(startDate || endDate || activeQuickFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-9 px-3 text-xs font-bold gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            <DataTable
              columns={allPatientsColumns}
              data={activeAllPatients}
              pageSize={10}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TodayPatientsPage;
