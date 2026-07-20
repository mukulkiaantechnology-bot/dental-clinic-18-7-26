import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  Clock,
  FileText,
  AlertTriangle,
  Brain,
  Check,
  Send,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Sliders,
  Plus,
  Sparkles,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useHygienistStore } from '../../../store/hygienistStore';
import { useAppointmentStore } from '../../../store/appointmentStore';
import { useDentistStore } from '../../../store/dentistStore';
import api from '../../../shared/utils/api';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Badge } from '../../../shared/ui/Badge';
import { useToast } from '../../../shared/hooks/useToast';
import { DataTable } from '../../../shared/ui/DataTable';
import { Modal } from '../../../shared/ui/Modal';

const generateHygTemplateId = () => `hyg_${Date.now()}`;

// ----------------------------------------------------
// 1. PATIENTS REGISTRY PAGE
// ----------------------------------------------------
export function HygienistPatientsPage() {
  const navigate = useNavigate();
  const { patients, riskProfiles, fetchPatients, setActivePatientId } = useHygienistStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleOpenChart = (id) => {
    setActivePatientId(id);
    navigate(`/hygienist/patients/${id}?tab=overview`);
  };

  const columns = [
    { key: 'id', header: 'ID', render: (p) => <span className="font-bold text-slate-500">#{p.displayId || p.id}</span> },
    { key: 'name', header: 'Patient Name', render: (p) => <span className="font-extrabold text-foreground">{p.name}</span> },
    { key: 'age', header: 'Age' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'risk',
      header: 'Gum Risk Class',
      render: (p) => {
        const risk = riskProfiles[p.id]?.classification || 'Low';
        const variant = risk === 'High' ? 'destructive' : risk === 'Medium' ? 'warning' : 'success';
        return <Badge variant={variant} className="font-bold">{risk}</Badge>;
      }
    },
    {
      key: 'createdAt',
      header: 'Reg. Date',
      render: (p) => (
        <span className="font-semibold text-foreground/80">
          {p.createdAt ? new Date(p.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
        </span>
      )
    },
    { key: 'status', header: 'Status', render: (p) => <Badge variant={p.status === 'Active' ? 'success' : 'secondary'}>{p.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <Button size="sm" onClick={() => handleOpenChart(p.id)} className="font-bold gap-1 text-[11px] h-8 cursor-pointer">
          Open Preventative Chart
        </Button>
      )
    }
  ];

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

  const filteredPatients = useMemo(() => {
    let list = patients.filter((p) => p.status === 'Active');

    const start = parseLocalDate(startDate, false);
    const end = parseLocalDate(endDate, true);

    if (start) {
      list = list.filter((p) => p.createdAt && new Date(p.createdAt) >= start);
    }
    if (end) {
      list = list.filter((p) => p.createdAt && new Date(p.createdAt) <= end);
    }

    return list;
  }, [patients, startDate, endDate]);

  return (
    <div className="space-y-6 text-left animate-fade-in">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
          Preventive Patients Directory
        </h2>
        <p className="text-xs text-muted-foreground font-semibold">Select a patient profile to perform perio probing, gum disease assessment, and review hygiene schedule.</p>
      </div>

      <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
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

        <DataTable columns={columns} data={filteredPatients} searchKey="name" searchPlaceholder="Search patient records by name..." pageSize={10} />
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. PATIENT DETAIL CONTROLLER PAGE
// ----------------------------------------------------
export function HygienistPatientDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { patients, riskProfiles, fetchPatients, setActivePatientId, loading } = useHygienistStore();
  const { appointments, fetchAppointments, advanceStage } = useAppointmentStore();

  const activeTab = searchParams.get('tab') || 'overview';
  const patient = patients.find((p) => p.id === id);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
  }, [fetchPatients, fetchAppointments]);

  useEffect(() => {
    if (id) {
      setActivePatientId(id);
    }
  }, [id, setActivePatientId]);

  if (loading && patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h3 className="text-lg font-bold">Loading Patient Record...</h3>
        <p className="text-sm text-muted-foreground mt-2">Retrieving clinical file from EMR database.</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive animate-bounce mb-4" />
        <h3 className="text-lg font-bold">Patient Not Found</h3>
        <p className="text-sm text-muted-foreground mt-2">The requested patient record could not be located in this clinic.</p>
        <Button onClick={() => navigate('/hygienist/patients')} className="mt-6">Back to Patients</Button>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const appointmentId = searchParams.get('appointmentId');
  const activeAppointment = appointmentId 
    ? appointments.find(a => a.id === appointmentId) 
    : (appointments.find(a => a.patientId === id && a.date === todayStr) || appointments.find(a => a.patientId === id));

  const isLocked = false;

  const handleSaveAndFinalize = async () => {
    try {
      const { data } = await api.put(`/patients/${patient.id}`, { status: 'Active' });
      if (data.success) {
        if (activeAppointment && activeAppointment.workflowStage !== 'COMPLETED') {
          await advanceStage(activeAppointment.id, 'COMPLETED');
        }
        toast.success('Patient treatment finalized & record updated successfully.');
        await fetchPatients();
        navigate('/hygienist/patients');
      } else {
        toast.error('Failed to finalize patient treatment.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error finalizing patient treatment.');
    }
  };

  const handleCompleteHygiene = async () => {
    if (!activeAppointment) return;
    const res = await advanceStage(activeAppointment.id, 'COMPLETED');
    if (res.success) {
      toast.success('Preventive hygiene visit completed.');
      fetchAppointments();
    } else {
      toast.error(res.error || 'Failed to complete hygiene session.');
    }
  };

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'SCHEDULED':
      case 'CONFIRMED':
        return <Badge className="bg-muted text-muted-foreground border border-border">Scheduled</Badge>;
      case 'CHECKED_IN':
        return <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">Checked In</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold">In Assistant Prep</Badge>;
      case 'TREATMENT_PENDING':
        return <Badge className="bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold">In Dentist Treatment</Badge>;
      case 'CLEANING_PENDING':
        return <Badge className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold animate-pulse">Ready for Hygienist</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">Completed</Badge>;
      default:
        return <Badge variant="secondary">{stage}</Badge>;
    }
  };

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const risk = riskProfiles[patient.id]?.classification || 'Low';
  const riskColor = risk === 'High' ? 'text-rose-500' : risk === 'Medium' ? 'text-amber-500' : 'text-emerald-500';

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Users },
    { key: 'perio', label: 'Perio Charting', icon: Activity },
    { key: 'risk', label: 'Risk Analysis', icon: Sliders },
    { key: 'notes', label: 'Clinical Notes', icon: FileText }
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in flex-1 flex flex-col h-full min-w-0 w-full">
      {/* Patient Profile Card Header */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-foreground">{patient.name}</h2>
            <Badge variant="secondary" className="font-bold">ID: #{patient.displayId || patient.id}</Badge>
            <Badge variant={patient.status === 'Active' ? 'success' : 'secondary'}>{patient.status}</Badge>
          </div>
          <p className="text-xs font-semibold text-muted-foreground leading-relaxed max-w-xl">
            {patient.history}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs">
          <div className="p-3 bg-muted/50 border border-border rounded-xl">
            <span className="text-muted-foreground block mb-1 font-semibold uppercase text-[9px] tracking-wider font-extrabold">Gum Risk Classification</span>
            <span className={`font-black uppercase text-xs ${riskColor}`}>{risk} Risk</span>
          </div>
          <div className="p-3 bg-muted/50 border border-border rounded-xl">
            <span className="text-muted-foreground block mb-1 font-semibold uppercase text-[9px] tracking-wider">Allergies</span>
            <span className={`font-extrabold ${patient.allergies === 'None' || (Array.isArray(patient.allergies) && patient.allergies.length === 0) ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`}>
              {Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies || 'None'}
            </span>
          </div>
          <div className="p-3 bg-muted/50 border border-border rounded-xl">
            <span className="text-muted-foreground block mb-1 font-semibold uppercase text-[9px] tracking-wider">Vitals</span>
            <span className="font-extrabold text-foreground">{patient.vitals}</span>
          </div>
        </div>
      </div>

      {/* Save & Finalize Treatment Banner */}
      <div className="bg-card border border-border p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-left">
        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Session Actions</span>
          <p className="text-xs text-foreground font-semibold">Save and finalize patient treatment to update records and patient menu list.</p>
        </div>
        <Button
          size="sm"
          onClick={handleSaveAndFinalize}
          className="font-bold text-xs h-9 gap-1.5 cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          Save & Finalize Treatment
        </Button>
      </div>

      {/* Clinical Workflow stage banner */}
      {activeAppointment && (
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-left">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Clinical stage progression</span>
            <p className="text-xs text-foreground font-semibold">Track and complete preventive hygiene milestones.</p>
          </div>

          <div className="flex items-center gap-2">
            {getStageBadge(activeAppointment.workflowStage)}
            {activeAppointment.workflowStage === 'CLEANING_PENDING' && (
              <Button
                size="sm"
                onClick={handleCompleteHygiene}
                className="font-bold text-xs h-9 gap-1.5 cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Check className="h-4 w-4" /> Complete Hygiene Visit
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-border/80 overflow-x-auto no-scrollbar gap-2 mt-4">
        {tabs.map((t) => {
          const IconComp = t.icon;
          const isSelected = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'border-primary text-primary font-black'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <IconComp className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {isLocked ? (
        <div className="bg-card border border-border p-12 rounded-3xl text-center flex flex-col items-center justify-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500 animate-pulse" />
          <h3 className="text-base font-bold text-foreground">Clinical Chart Session Locked</h3>
          <p className="text-xs text-muted-foreground font-semibold max-w-md leading-relaxed">
            The patient is still undergoing prep or treatment with the Assistant or Dentist. 
            All hygiene chart modifications and perio probing are locked until the dentist passes this session to you.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-background mt-4">
          {activeTab === 'overview' && <PatientOverviewTab patient={patient} risk={risk} />}
          {activeTab === 'perio' && <PerioChartingTab key={patient.id} patient={patient} />}
          {activeTab === 'risk' && <RiskAnalysisTab key={patient.id} patient={patient} />}
          {activeTab === 'notes' && <ClinicalNotesTab key={patient.id} patient={patient} />}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 2A. TAB: OVERVIEW
// ----------------------------------------------------
function PatientOverviewTab({ patient, risk }) {
  return (
    <div className="space-y-6 text-left bg-card border border-border p-6 rounded-3xl shadow-sm">
      <div className="border-b border-border/60 pb-3">
        <h3 className="text-lg font-extrabold text-foreground">Demographics & Clinical Summary</h3>
        <p className="text-[11px] text-muted-foreground font-semibold">General medical history summary and vitals logged by front desk.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs leading-relaxed">
        <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-3">
          <h4 className="font-bold text-foreground uppercase text-[10px] tracking-wider text-primary">Personal Details</h4>
          <div className="space-y-2">
            <div><span className="text-muted-foreground font-semibold">Full Name:</span> <span className="font-bold text-foreground">{patient.name}</span></div>
            <div><span className="text-muted-foreground font-semibold">Age:</span> <span className="font-bold text-foreground">{patient.age} years</span></div>
            <div><span className="text-muted-foreground font-semibold">Phone:</span> <span className="font-bold text-foreground">{patient.phone}</span></div>
            <div><span className="text-muted-foreground font-semibold">Email:</span> <span className="font-bold text-foreground">{patient.email}</span></div>
          </div>
        </div>

        <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-3">
          <h4 className="font-bold text-foreground uppercase text-[10px] tracking-wider text-primary">Systemic Risks</h4>
          <div className="space-y-2">
            <div><span className="text-muted-foreground font-semibold">Drug Allergies:</span> <span className={`font-bold ${patient.allergies === 'None' || (Array.isArray(patient.allergies) && patient.allergies.length === 0) ? 'text-emerald-500' : 'text-rose-500'}`}>{Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies || 'None'}</span></div>
            <div><span className="text-muted-foreground font-semibold">Active Vitals:</span> <span className="font-bold text-foreground">{patient.vitals}</span></div>
            <div><span className="text-muted-foreground font-semibold">Clinical Note:</span> <span className="font-medium text-foreground">{patient.history}</span></div>
          </div>
        </div>

        <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-3">
          <h4 className="font-bold text-foreground uppercase text-[10px] tracking-wider text-primary">Preventive Health Status</h4>
          <div className="space-y-2">
            <div><span className="text-muted-foreground font-semibold">Gum Classification:</span> <span className="font-bold text-foreground">{risk} Risk</span></div>
            <div><span className="text-muted-foreground font-semibold">Hygiene Frequency:</span> <span className="font-bold text-foreground">{risk === 'High' ? '3 Months' : '6 Months'}</span></div>
            <div><span className="text-muted-foreground font-semibold">Compliance Status:</span> <span className="font-bold text-emerald-500">Compliant</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2B. TAB: PERIO CHARTING
// ----------------------------------------------------
function ToothProbingEditor({ patientId, toothNum, initialData, onSave, onSaveSuccess }) {
  const [pocketDepth, setPocketDepth] = useState(initialData.pocketDepth);
  const [bleeding, setBleeding] = useState(initialData.bleeding);
  const [mobility, setMobility] = useState(initialData.mobility);

  const handleSave = () => {
    onSave(patientId, toothNum, {
      pocketDepth: Number(pocketDepth),
      bleeding,
      mobility: Number(mobility)
    });
    onSaveSuccess();
  };

  return (
    <div className="bg-card border border-border p-5 rounded-2xl max-w-xl mx-auto shadow-sm space-y-4">
      <h4 className="font-black text-xs uppercase text-primary flex items-center gap-1.5">
        <Activity className="h-4 w-4" />
        Teeth Measurement Form: Tooth #{toothNum}
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pocket Depth Slider */}
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Pocket Depth</label>
          <div className="flex items-center gap-3">
            <span className={`text-xl font-black ${pocketDepth >= 5 ? 'text-rose-500' : 'text-foreground'}`}>
              {pocketDepth} mm
            </span>
            <input
              type="range"
              min="1"
              max="9"
              value={pocketDepth}
              onChange={(e) => setPocketDepth(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Bleeding Indicator */}
        <div className="space-y-1.5 text-left flex flex-col justify-center">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Bleeding on Probing</label>
          <label className="flex items-center gap-2 cursor-pointer mt-1 select-none font-bold text-xs text-foreground">
            <input
              type="checkbox"
              checked={bleeding}
              onChange={(e) => setBleeding(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-border text-rose-500 focus:ring-rose-500 cursor-pointer"
            />
            <span className={bleeding ? 'text-rose-500' : ''}>Active Bleeding</span>
          </label>
        </div>

        {/* Mobility Rating */}
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Tooth Mobility</label>
          <select
            value={mobility}
            onChange={(e) => setMobility(Number(e.target.value))}
            className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2 focus:outline-none cursor-pointer text-foreground"
          >
            <option value="0">Class 0 (Normal)</option>
            <option value="1">Class 1 (Slight)</option>
            <option value="2">Class 2 (Moderate)</option>
            <option value="3">Class 3 (Severe)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
        <Button
          size="sm"
          onClick={handleSave}
          className="font-bold px-5 py-2 text-xs"
        >
          Save Tooth #{toothNum} Data &rarr;
        </Button>
      </div>
    </div>
  );
}

function PerioChartingTab({ patient }) {
  const { perioCharts, updateToothPerio } = useHygienistStore();

  const [selectedTooth, setSelectedTooth] = useState(1);
  const patientChart = perioCharts[patient.id] || {};

  // Divide 32 teeth into Upper row (1-16) and Lower row (32-17 matching molar alignment)
  const upperTeeth = Array.from({ length: 16 }, (_, i) => i + 1);
  const lowerTeeth = Array.from({ length: 16 }, (_, i) => 32 - i);

  const renderToothCell = (toothNum) => {
    const rawData = patientChart[toothNum] || { pocketDepth: 3, bleeding: false, mobility: 0 };
    const isSelected = selectedTooth === toothNum;

    // Normalize pocketDepth to a single number
    let pocketDepth = 3;
    if (rawData.pocketDepth !== undefined) {
      if (Array.isArray(rawData.pocketDepth)) {
        pocketDepth = Math.max(...rawData.pocketDepth.map(Number));
      } else if (typeof rawData.pocketDepth === 'object' && rawData.pocketDepth !== null) {
        pocketDepth = Math.max(
          Number(rawData.pocketDepth.mesial || 0),
          Number(rawData.pocketDepth.mid || 0),
          Number(rawData.pocketDepth.distal || 0)
        );
      } else {
        pocketDepth = Number(rawData.pocketDepth);
      }
    }

    // Normalize bleeding to a boolean
    let bleeding = false;
    if (rawData.bleeding !== undefined) {
      bleeding = !!rawData.bleeding;
    } else if (rawData.bop !== undefined) {
      if (Array.isArray(rawData.bop)) {
        bleeding = rawData.bop.some(Boolean);
      } else if (typeof rawData.bop === 'object' && rawData.bop !== null) {
        bleeding = !!(rawData.bop.mesial || rawData.bop.mid || rawData.bop.distal);
      }
    }

    const mobility = Number(rawData.mobility || 0);
    const hasIssues = pocketDepth >= 5 || bleeding;

    return (
      <button
        key={toothNum}
        onClick={() => setSelectedTooth(toothNum)}
        className={`p-2.5 rounded-xl border flex flex-col items-center justify-between min-h-[90px] w-full transition-all cursor-pointer ${
          isSelected
            ? 'ring-2 ring-primary border-primary bg-primary/5 scale-[1.03]'
            : hasIssues
            ? 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 hover:bg-rose-500/20'
            : 'bg-muted/40 border-border hover:bg-muted/70'
        }`}
      >
        <span className="font-extrabold text-[10px] text-muted-foreground uppercase">#{toothNum}</span>
        <div className="flex flex-col items-center gap-0.5 my-1">
          <span className={`text-sm font-black ${pocketDepth >= 5 ? 'text-rose-500' : 'text-foreground'}`}>
            {pocketDepth}mm
          </span>
          {bleeding && (
            <span className="h-1.5 w-1.5 bg-rose-600 rounded-full animate-pulse" title="Bleeding on probing" />
          )}
        </div>
        <span className="text-[9px] font-bold text-muted-foreground">
          {mobility > 0 ? `Mob: ${mobility}` : 'Mob: 0'}
        </span>
      </button>
    );
  };

  // Normalize selected tooth's initial data before passing to editor
  const selectedRawData = patientChart[selectedTooth] || { pocketDepth: 3, bleeding: false, mobility: 0 };
  let selectedPocketDepth = 3;
  if (selectedRawData.pocketDepth !== undefined) {
    if (Array.isArray(selectedRawData.pocketDepth)) {
      selectedPocketDepth = Math.max(...selectedRawData.pocketDepth.map(Number));
    } else if (typeof selectedRawData.pocketDepth === 'object' && selectedRawData.pocketDepth !== null) {
      selectedPocketDepth = Math.max(
        Number(selectedRawData.pocketDepth.mesial || 0),
        Number(selectedRawData.pocketDepth.mid || 0),
        Number(selectedRawData.pocketDepth.distal || 0)
      );
    } else {
      selectedPocketDepth = Number(selectedRawData.pocketDepth);
    }
  }

  let selectedBleeding = false;
  if (selectedRawData.bleeding !== undefined) {
    selectedBleeding = !!selectedRawData.bleeding;
  } else if (selectedRawData.bop !== undefined) {
    if (Array.isArray(selectedRawData.bop)) {
      selectedBleeding = selectedRawData.bop.some(Boolean);
    } else if (typeof selectedRawData.bop === 'object' && selectedRawData.bop !== null) {
      selectedBleeding = !!(selectedRawData.bop.mesial || selectedRawData.bop.mid || selectedRawData.bop.distal);
    }
  }

  const selectedMobility = Number(selectedRawData.mobility || 0);

  const normalizedInitialData = {
    pocketDepth: selectedPocketDepth,
    bleeding: selectedBleeding,
    mobility: selectedMobility
  };

  return (
    <div className="space-y-6 text-left bg-card border border-border p-6 rounded-3xl shadow-sm">
      <div className="border-b border-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-extrabold text-foreground">Interactive Periodontal Chart</h3>
          <p className="text-[11px] text-muted-foreground font-semibold">Perform perio probing measurements. Pockets &ge; 5mm or bleeding sites are highlighted in red.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive" className="font-bold text-[9px] uppercase">&gt;=5mm pockets</Badge>
          <Badge variant="warning" className="font-bold text-[9px] uppercase">bleeding</Badge>
        </div>
      </div>

      {/* Teeth Odontogram Visual Representation */}
      <div className="bg-muted/20 border border-border p-5 rounded-3xl space-y-4 overflow-x-auto">
        {/* Upper Arch */}
        <div>
          <div className="text-[9px] uppercase font-bold text-muted-foreground mb-1.5 tracking-wider">Upper Arch (Maxilla)</div>
          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 min-w-[640px]">
            {upperTeeth.map(renderToothCell)}
          </div>
        </div>

        <div className="h-px bg-border/60 my-2" />

        {/* Lower Arch */}
        <div>
          <div className="text-[9px] uppercase font-bold text-muted-foreground mb-1.5 tracking-wider">Lower Arch (Mandible)</div>
          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 min-w-[640px]">
            {lowerTeeth.map(renderToothCell)}
          </div>
        </div>
      </div>

      {/* Interactive Metric Probing Editor */}
      <ToothProbingEditor
        key={`${patient.id}-${selectedTooth}`}
        patientId={patient.id}
        toothNum={selectedTooth}
        initialData={normalizedInitialData}
        onSave={updateToothPerio}
        onSaveSuccess={() => {
          if (selectedTooth < 32) {
            setSelectedTooth(selectedTooth + 1);
          }
        }}
      />
    </div>
  );
}

// ----------------------------------------------------
// 2C. TAB: RISK ANALYSIS
// ----------------------------------------------------
function RiskAnalysisTab({ patient }) {
  const { riskProfiles, updateRiskAssessed } = useHygienistStore();
  const toast = useToast();

  const profile = riskProfiles[patient.id] || { classification: 'Low', riskFactors: [], aiAdvice: '' };
  
  const [classification, setClassification] = useState(profile.classification);
  const [newFactor, setNewFactor] = useState('');
  const [factors, setFactors] = useState(profile.riskFactors || []);
  const [aiAdvice, setAiAdvice] = useState(profile.aiAdvice || '');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClassification(profile.classification || 'Low');
    setFactors(profile.riskFactors || []);
    setAiAdvice(profile.aiAdvice || '');
  }, [profile.classification, JSON.stringify(profile.riskFactors), profile.aiAdvice]);

  const handleSetClassification = (level) => {
    setClassification(level);
    updateRiskAssessed(patient.id, level, factors, aiAdvice);
  };

  const handleAddFactor = (e) => {
    e.preventDefault();
    if (newFactor.trim()) {
      const updated = [...factors, newFactor.trim()];
      setFactors(updated);
      setNewFactor('');
      updateRiskAssessed(patient.id, classification, updated, aiAdvice);
    }
  };

  const handleRemoveFactor = (index) => {
    const updated = factors.filter((_, i) => i !== index);
    setFactors(updated);
    updateRiskAssessed(patient.id, classification, updated, aiAdvice);
  };

  const handleTriggerAI = () => {
    // Simulated AI gum health calculation based on factors and classification
    let suggestion;
    if (classification === 'High') {
      suggestion = `Recommend periodontal debridement scaling / root planing (SRP) at 3-month intervals. Daily rinse with Chlorhexidine for 2 weeks. Recommend power brush with pressure sensor to avoid abrasion. Refer immediately to periodontal specialist.`;
    } else if (classification === 'Medium') {
      suggestion = `Perform routine scaling and prophy polishing. Focus patient flossing in molar segments. Assess localized pockets during the next 6-month checkup. Apply fluoride varnish to protect vulnerable root areas.`;
    } else {
      suggestion = `Maintain standard 6-month routine prophylaxis. Confirm patient is using fluoridated dentifrice. Re-chart perio depths annually to confirm stable bone levels.`;
    }
    setAiAdvice(suggestion);
    updateRiskAssessed(patient.id, classification, factors, suggestion);
    toast.success('AI Gum Health assessment calculated successfully!', 'Engine Evaluated');
  };

  const handleSaveRiskProfile = () => {
    updateRiskAssessed(patient.id, classification, factors, aiAdvice);
    toast.success('Risk classification profile saved successfully!');
  };

  return (
    <div className="space-y-6 text-left bg-card border border-border p-6 rounded-3xl shadow-sm">
      <div className="border-b border-border/60 pb-3">
        <h3 className="text-lg font-extrabold text-foreground">Gum Disease Risk Engine</h3>
        <p className="text-[11px] text-muted-foreground font-semibold">Classify periodontal tissue health and trigger AI custom patient care recommendations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Assessment Parameters */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Risk Classification Rating</label>
            <div className="flex gap-2.5">
              {['Low', 'Medium', 'High'].map((level) => {
                const isSelected = classification === level;
                const activeColors = level === 'High'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                  : level === 'Medium'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-emerald-500 text-white border-emerald-500 shadow-sm';

                return (
                  <button
                    key={level}
                    onClick={() => handleSetClassification(level)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected ? activeColors : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-foreground">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Active Clinical Risk Factors</label>
            
            <form onSubmit={handleAddFactor} className="flex gap-2">
              <Input
                placeholder="e.g. History of calculus, heavy staining..."
                value={newFactor}
                onChange={(e) => setNewFactor(e.target.value)}
                className="flex-1 h-9 font-medium text-xs text-foreground"
              />
              <Button type="submit" size="sm" className="h-9 font-bold">
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex flex-wrap gap-2 pt-1">
              {factors.length === 0 ? (
                <span className="text-[11px] text-muted-foreground font-semibold">No risk factors added yet.</span>
              ) : (
                factors.map((factor, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="gap-1 font-bold pl-2.5 pr-1.5 py-0.5 rounded-full"
                  >
                    {factor}
                    <button
                      type="button"
                      onClick={() => handleRemoveFactor(idx)}
                      className="text-[10px] hover:text-rose-500 focus:outline-none ml-1 cursor-pointer font-black"
                    >
                      &times;
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        {/* AI Suggestions Engine Panel */}
        <div className="bg-muted/30 border border-border p-5 rounded-2xl shadow-sm flex flex-col space-y-3 justify-between">
          <div className="space-y-2">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
              <Brain className="h-4.5 w-4.5 text-primary animate-bounce" />
              AI Preventive Care Suggestions
            </h4>
            <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
              Auto-generates clinical advice based on gum risk parameters, former habits, and molar pocketing levels.
            </p>
          </div>

          <div className="p-4 bg-card border border-border/80 rounded-xl min-h-[120px] flex items-center justify-center text-xs leading-relaxed text-left">
            {aiAdvice ? (
              <span className="font-semibold text-muted-foreground">{aiAdvice}</span>
            ) : (
              <div className="text-center space-y-1.5">
                <Sparkles className="h-6 w-6 text-primary mx-auto opacity-75" />
                <span className="text-[11px] text-muted-foreground font-semibold block">Click evaluate below to run AI suggestion rules.</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTriggerAI}
              className="w-full sm:flex-1 font-extrabold text-xs h-10"
            >
              Evaluate AI Rules
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRiskProfile}
              className="w-full sm:flex-1 font-extrabold text-xs h-10"
            >
              Save Assessment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2E. TAB: CLINICAL NOTES
// ----------------------------------------------------
function ClinicalNotesTab({ patient }) {
  const { notes, saveClinicalNote, hygieneTemplates, addHygieneTemplate } = useHygienistStore();
  const toast = useToast();

  const rawClinicalNotes = useDentistStore((state) => state.clinicalNotes[patient.id]);
  const clinicalNotes = rawClinicalNotes || [];
  const fetchPatientDetails = useDentistStore((state) => state.fetchPatientDetails);

  useEffect(() => {
    fetchPatientDetails(patient.id);
  }, [patient.id, fetchPatientDetails]);

  const [noteText, setNoteText] = useState(notes[patient.id] || '');
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Saved', 'Saving', 'Pending'
  const autoSaveTimerRef = useRef(null);

  // Modal State for custom template
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateText, setNewTemplateText] = useState('');

  const handleApplyTemplate = (e) => {
    const val = e.target.value;
    if (!val) return;

    const matchedTemplate = hygieneTemplates.find(t => t.id === val);
    if (!matchedTemplate) return;

    // Append template text instead of overwriting
    const newText = noteText + (noteText ? '\n\n' : '') + matchedTemplate.text;
    setNoteText(newText);
    setSaveStatus('Pending');
    triggerAutoSave(newText);
    toast.success(`Injected template: ${matchedTemplate.name}`);

    // Reset select dropdown so it can be selected again
    e.target.value = '';
  };

  const handleAddCustomTemplate = (e) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !newTemplateText.trim()) {
      toast.error('All fields are required');
      return;
    }
    const templateId = generateHygTemplateId();
    const templateText = newTemplateText.trim();
    addHygieneTemplate({
      id: templateId,
      name: newTemplateName.trim(),
      text: templateText
    });

    // Auto-inject text
    const newText = noteText + (noteText ? '\n\n' : '') + templateText;
    setNoteText(newText);
    setSaveStatus('Pending');
    triggerAutoSave(newText);

    toast.success(`Template "${newTemplateName.trim()}" added & injected!`);
    setNewTemplateName('');
    setNewTemplateText('');
    setIsTemplateModalOpen(false);
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setNoteText(text);
    setSaveStatus('Pending');
    triggerAutoSave(text);
  };

  const triggerAutoSave = (text) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setSaveStatus('Saving');
    autoSaveTimerRef.current = setTimeout(() => {
      saveClinicalNote(patient.id, text);
      setSaveStatus('Saved');
    }, 1200); // Simulated auto-save debounce delay of 1.2s
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleManualSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    saveClinicalNote(patient.id, noteText);
    setSaveStatus('Saved');
    toast.success('Clinical hygiene visit note saved manually!');
  };

  return (
    <div className="space-y-6 text-left bg-card border border-border p-6 rounded-3xl shadow-sm">
      <div className="border-b border-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-extrabold text-foreground">Clinical Hygiene EHR Notes</h3>
          <p className="text-[11px] text-muted-foreground font-semibold">Write clean clinical notes for the hygiene visit. Form templates auto-fill documentation.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
          {saveStatus === 'Saved' && (
            <span className="text-emerald-500 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" />
              All changes saved
            </span>
          )}
          {saveStatus === 'Saving' && (
            <span className="text-primary animate-pulse">
              Saving changes...
            </span>
          )}
          {saveStatus === 'Pending' && (
            <span>
              Pending save
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Editor (3 columns on lg) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 text-left space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Templates Lookup</label>
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="text-[10px] font-extrabold text-primary hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Custom
                </button>
              </div>
              <select
                onChange={handleApplyTemplate}
                className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
              >
                <option value="">-- Choose Template --</option>
                {hygieneTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                onClick={handleManualSave}
                className="h-10 px-5 font-bold text-xs cursor-pointer w-full sm:w-auto"
              >
                Manual Commit Save
              </Button>
            </div>
          </div>

          <textarea
            value={noteText}
            onChange={handleTextChange}
            placeholder="Document hygiene session details, patient compliance, probing changes..."
            className="w-full min-h-[300px] p-4 text-xs font-medium text-foreground bg-muted/20 border border-border rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
          />
        </div>

        {/* Template Tips */}
        <div className="bg-muted/30 border border-border p-4 rounded-2xl text-left space-y-4 h-fit">
          {clinicalNotes.length > 0 && (
            <div className="p-3 bg-primary/5 border border-primary/25 rounded-xl space-y-3 text-xs">
              <span className="font-extrabold text-primary block uppercase text-[9px] tracking-wider">Shared notes history</span>
              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
                {clinicalNotes.map((note) => (
                  <div key={note.id} className="border-b border-border/40 pb-2 last:border-b-0 space-y-1">
                    <div className="flex justify-between items-center text-[8px] text-muted-foreground font-bold">
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                      <span className="text-primary uppercase font-black">
                        {note.authorName} ({note.authorRole === 'dental_assistant' ? 'Assistant' : note.authorRole === 'hygienist' ? 'Hygienist' : note.authorRole === 'dentist' ? 'Dentist' : note.authorRole})
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 leading-normal whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider text-primary">EHR Note Standards</h4>
            <ul className="space-y-2.5 text-[11px] text-muted-foreground font-semibold leading-relaxed">
              <li className="flex items-start gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>Review systemic medical history changes before procedures.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>Perform full perio charting at least once per calendar year.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>Document fluoride applications and patient refusal log.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>Note home care compliance instructions clearly for dentist check.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Custom Template Modal */}
      <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Create Custom Hygiene Template">
        <form onSubmit={handleAddCustomTemplate} className="space-y-4 text-left text-xs font-semibold">
          <Input
            label="Template Title / Label"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            required
            placeholder="e.g. Pedodontics Prophy Protocol"
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Template Observation Text</label>
            <textarea
              value={newTemplateText}
              onChange={(e) => setNewTemplateText(e.target.value)}
              required
              rows={6}
              className="w-full text-xs font-semibold bg-muted border border-border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="Enter template notes content to insert..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create & Inject Template</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ----------------------------------------------------
// 3. GLOBAL RECALL LIST PAGE
// ----------------------------------------------------
export function HygienistRecallPage() {
  const { recalls, triggerRecallReminder, autoScheduleRecall } = useHygienistStore();
  const toast = useToast();

  const handleSendReminder = async (id, name) => {
    toast.loading(`Dispatching recall reminder to ${name}...`);
    await triggerRecallReminder(id);
    toast.success(`Recall reminder dispatched to ${name}!`);
  };

  const handleAutoSchedule = async (id, name) => {
    toast.loading(`Auto-booking follow-up visit for ${name}...`);
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
    const dateStr = date.toISOString().split('T')[0];
    await autoScheduleRecall(id, dateStr);
    toast.success(`Standard follow-up cleaning booked for ${name} on ${dateStr}!`);
  };

  const columns = [
    { key: 'patientName', header: 'Patient Name', render: (r) => <span className="font-extrabold text-foreground">{r.patientName}</span> },
    { key: 'phone', header: 'Phone' },
    { key: 'frequency', header: 'Frequency' },
    { key: 'lastVisit', header: 'Last Visit Date' },
    { key: 'dueBy', header: 'Due Date' },
    {
      key: 'status',
      header: 'Campaign Status',
      render: (r) => {
        const variant = r.status === 'Scheduled' ? 'success' : r.status === 'Reminded' ? 'warning' : 'destructive';
        return <Badge variant={variant} className="font-bold text-[9px]">{r.status}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Recall Actions',
      align: 'right',
      render: (r) => (
        <div className="flex flex-col sm:flex-row gap-2 justify-end w-full">
          <Button
            size="xs"
            variant="outline"
            disabled={r.status === 'Scheduled'}
            onClick={() => handleSendReminder(r.id, r.patientName)}
            className="font-extrabold text-[10px] h-9 sm:h-8 w-full sm:w-auto justify-center"
          >
            <Send className="h-3 w-3 mr-1" />
            Send Reminder
          </Button>
          <Button
            size="xs"
            disabled={r.status === 'Scheduled'}
            onClick={() => handleAutoSchedule(r.id, r.patientName)}
            className="font-extrabold text-[10px] h-9 sm:h-8 w-full sm:w-auto justify-center"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Auto-Book
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
          Preventive Recall Campaign Manager
        </h2>
        <p className="text-xs text-muted-foreground font-semibold">Track hygiene compliance, check-up scheduling, and dispatch auto recall campaigns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table View (2 columns on lg) */}
        <div className="lg:col-span-2 bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider text-primary">Patients Awaiting Recall Prophy</h3>
          <DataTable columns={columns} data={recalls} searchKey="patientName" searchPlaceholder="Search recall list..." pageSize={10} />
        </div>

        {/* Campaigns & Timeline view (1 column on lg) */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col space-y-5">
          <div>
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider text-primary">Recall Campaign Performance</h3>
            <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">Preventive care compliance tracking metrics.</p>
          </div>

          {/* Simple circular stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-muted/40 border border-border rounded-xl">
              <span className="text-[10px] font-bold text-muted-foreground block uppercase">Recall Rate</span>
              <span className="text-xl font-black text-primary">76.4%</span>
            </div>
            <div className="p-3 bg-muted/40 border border-border rounded-xl">
              <span className="text-[10px] font-bold text-muted-foreground block uppercase">Compliance</span>
              <span className="text-xl font-black text-emerald-500">89.2%</span>
            </div>
          </div>

          <div className="h-px bg-border/60 my-2" />

          {/* Campaign Timeline log */}
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-foreground uppercase text-[10px] tracking-widest">Active Outreach Timeline</h4>
            <div className="relative border-l border-border pl-4 space-y-4">
              <div className="relative">
                <div className="absolute -left-[20px] top-1 bg-emerald-500 text-white p-0.5 rounded-full">
                  <Check className="h-2.5 w-2.5" />
                </div>
                <div className="font-bold text-foreground">SMS Campaign Dispatched</div>
                <div className="text-[10px] text-muted-foreground font-semibold">Sent to 12 patients with Due status on 2026-06-08.</div>
              </div>

              <div className="relative">
                <div className="absolute -left-[20px] top-1 bg-primary text-white p-0.5 rounded-full">
                  <Users className="h-2.5 w-2.5" />
                </div>
                <div className="font-bold text-foreground">Interactive Callbacks Completed</div>
                <div className="text-[10px] text-muted-foreground font-semibold">Alex Johnson confirmed and auto-booked follow-up visit.</div>
              </div>

              <div className="relative opacity-60">
                <div className="absolute -left-[20px] top-1 bg-slate-300 text-slate-500 p-0.5 rounded-full">
                  <Clock className="h-2.5 w-2.5" />
                </div>
                <div className="font-bold text-foreground">Automated Email Campaign Scheduled</div>
                <div className="text-[10px] text-muted-foreground font-semibold">Next email digest targets pending list on 2026-06-15.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
