import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  ShieldAlert,
  Clock,
  UserPlus,
  Plus,
  TrendingUp,
  Activity,
  Search,
  Check,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { useAppointmentStore } from '../../../store/appointmentStore';
import { useDentistStore } from '../../../store/dentistStore';
import { useFrontDeskStore } from '../../../store/frontDeskStore';
import { useAlertStore } from '../../../store/alertStore';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { useToast } from '../../../shared/hooks/useToast';
import { AIInsightsPanel } from '../../../shared/ui/AIInsightsPanel';
import { Modal } from '../../../shared/ui/Modal';
import api from '../../../shared/utils/api';

export function FrontDeskDashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const { appointments, fetchAppointments, addAppointment, advanceStage } = useAppointmentStore();
  const { patients, fetchPatients, loading: patientsLoading } = useDentistStore();
  const { waitlist, insuranceChecks, walkins, updateWalkInStatus, fetchWaitlist, fetchInsuranceChecks } = useFrontDeskStore();
  const { alerts, subscribeToRoleAlerts } = useAlertStore();

  // Walk-in form state
  const [patientSearch, setPatientSearch] = useState('');
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [formPatientId, setFormPatientId] = useState('');
  const [formPatientName, setFormPatientName] = useState('');
  const [formPatientPhone, setFormPatientPhone] = useState('');
  const patientDropdownRef = useRef(null);

  const [dentistList, setDentistList] = useState([]);
  const [selectedDentistId, setSelectedDentistId] = useState('');
  const [selectedDentistName, setSelectedDentistName] = useState('');

  // Re-appointment modal state
  const [reAptOpen, setReAptOpen] = useState(false);
  const [reAptPatientId, setReAptPatientId] = useState('');
  const [reAptPatientName, setReAptPatientName] = useState('');
  const [reAptDentistId, setReAptDentistId] = useState('');
  const [reAptDentistName, setReAptDentistName] = useState('');
  const [reAptDate, setReAptDate] = useState('');
  const [reAptTime, setReAptTime] = useState('09:00');
  const [reAptTreatment, setReAptTreatment] = useState('');
  const [reAptNotes, setReAptNotes] = useState('');
  const [reAptLoading, setReAptLoading] = useState(false);

  // Fetch real data on mount
  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchWaitlist();
    fetchInsuranceChecks();
    
    // Fetch approved dentists
    api.get('/users/staff/dentists')
      .then(({ data }) => {
        if (data.success) {
          setDentistList(data.data);
          if (data.data.length > 0) {
            setSelectedDentistId(data.data[0].id);
            setSelectedDentistName(data.data[0].name);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load dentists', err);
      });

    // Subscribe to alert logs
    const unsubscribe = subscribeToRoleAlerts();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchAppointments, fetchPatients, subscribeToRoleAlerts]);

  // Close patient dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target)) {
        setPatientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculations for KPIs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookingsCount = useMemo(() => {
    return appointments.filter((a) => a.date === todayStr).length;
  }, [appointments, todayStr]);

  const newPatientsCount = patients.length;
  const pendingInsurancesCount = useMemo(() => {
    return insuranceChecks.filter((ins) => ins.status === 'Pending').length;
  }, [insuranceChecks]);

  const waitlistCount = waitlist.length;

  // Filter today's appointments for the live queue
  const todayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, todayStr]);

  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    if (!formPatientId) {
      toast.error('Please select a patient from the search dropdown!');
      return;
    }
    if (!selectedDentistId) {
      toast.error('Please assign a dentist!');
      return;
    }

    const apptData = {
      patientId: formPatientId,
      patientName: formPatientName,
      dentistId: selectedDentistId,
      dentistName: selectedDentistName,
      assignedDoctorId: selectedDentistId,
      date: todayStr,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      duration: 30,
      type: 'Walk-In Consultation',
      notes: 'Walk-in patient check-in',
      assignedTo: 'dentist',
      workflowStage: 'CHECKED_IN'
    };

    const res = await addAppointment(apptData);
    if (res.success) {
      toast.success(`Walk-in checked in successfully for ${formPatientName}!`, 'Added to Queue');
      setFormPatientId('');
      setFormPatientName('');
      setFormPatientPhone('');
      setPatientSearch('');
    } else {
      toast.error(res.error || 'Failed to check in walk-in patient.');
    }
  };

  const handleUpdateAptStatus = async (aptId, actionType) => {
    const stage = actionType === 'Arrived' ? 'CHECKED_IN' : 'COMPLETED';
    const res = await advanceStage(aptId, stage);
    if (res.success) {
      toast.success(`Appointment status updated to ${stage}!`);
    } else {
      toast.error(res.error || 'Failed to update status');
    }
  };

  const handleOpenReApt = (appt) => {
    // Find matching dentist id from dentistList
    const matchedDentist = dentistList.find(d => d.name === appt.dentistName);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setReAptPatientId(appt.patientId || '');
    setReAptPatientName(appt.patientName || '');
    setReAptDentistId(matchedDentist?.id || appt.dentistId || '');
    setReAptDentistName(appt.dentistName || '');
    setReAptDate(tomorrowStr);
    setReAptTime('09:00');
    setReAptTreatment(appt.type || 'Follow-Up Consultation');
    setReAptNotes(`Follow-up for previous ${appt.type || 'appointment'}`);
    setReAptOpen(true);
  };

  const handleSubmitReApt = async () => {
    if (!reAptPatientId || !reAptDate || !reAptTime) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setReAptLoading(true);
    const dentist = dentistList.find(d => d.id === reAptDentistId);
    const apptData = {
      patientId: reAptPatientId,
      patientName: reAptPatientName,
      dentistId: reAptDentistId,
      dentistName: dentist?.name || reAptDentistName,
      assignedDoctorId: reAptDentistId,
      date: reAptDate,
      time: reAptTime,
      duration: 60,
      type: reAptTreatment,
      notes: reAptNotes,
      status: 'Scheduled',
      workflowStage: 'SCHEDULED'
    };
    const res = await addAppointment(apptData);
    setReAptLoading(false);
    if (res?.success !== false) {
      toast.success(`Re-appointment booked for ${reAptPatientName} on ${reAptDate}!`, 'Re-Booked ✓');
      toast.info('Patient will receive SMS confirmation.');
      setReAptOpen(false);
    } else {
      toast.error(res.error || 'Failed to book re-appointment.');
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      {/* Header Title */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            Front Desk Hub
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            Manage daily check-ins, register new patients, verify eligibility, and update clinic calendar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/frontdesk/registration', { state: { openForm: true } })}
            className="font-bold text-xs gap-1.5 h-9"
          >
            <UserPlus className="h-4 w-4" />
            Register New Patient
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-card border border-border/80 p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Today's Bookings</span>
              <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">{todayBookingsCount}</h3>
            </div>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Calendar className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 text-[9px] sm:text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span>Active schedule check-ins</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border border-border/80 p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Registered Patients</span>
              <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">{newPatientsCount}</h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 text-[9px] sm:text-[10px] text-muted-foreground font-semibold">
            Onboarded clinic EHR files
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border/80 p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Insurance Pending</span>
              <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">{pendingInsurancesCount}</h3>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 text-[9px] sm:text-[10px] text-muted-foreground font-semibold">
            Awaiting verification checks
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-card border border-border/80 p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Waitlisted Patients</span>
              <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">{waitlistCount}</h3>
            </div>
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 text-[9px] sm:text-[10px] text-muted-foreground font-semibold">
            Awaiting slot cancellations
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Appointments & Walk-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Schedule Live Queue */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-primary animate-pulse" />
              Live Appointment Intake Queue
            </h3>
            <Badge variant="secondary" className="font-bold text-[9px] uppercase">
              Intake Desk
            </Badge>
          </div>

          <div className="overflow-x-auto min-h-[220px]">
            {todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-xs text-muted-foreground">
                <Calendar className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <span>No appointments booked for today.</span>
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <table className="hidden md:table w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      <th className="py-2.5">Time</th>
                      <th className="py-2.5">Patient</th>
                      <th className="py-2.5">Provider</th>
                      <th className="py-2.5 text-center">Intake Status</th>
                      <th className="py-2.5 text-right">Check-In Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium text-foreground">
                    {todayAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-bold text-primary">{appt.time}</td>
                        <td className="py-3">
                          <div className="font-extrabold text-foreground">{appt.patientName}</div>
                          <div className="text-[10px] text-muted-foreground">{appt.type}</div>
                        </td>
                        <td className="py-3 text-muted-foreground truncate max-w-[120px]">{appt.dentistName}</td>
                        <td className="py-3 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                            appt.workflowStage === 'CHECKED_IN' || appt.status === 'Checked-In' || appt.status === 'Checked_In'
                              ? 'text-primary bg-primary/10 border border-primary/20'
                              : appt.workflowStage === 'COMPLETED' || appt.status === 'Completed'
                              ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'
                              : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                          }`}>
                            {appt.workflowStage ? appt.workflowStage.replace(/_/g, ' ') : appt.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="xs"
                              variant="primary"
                              disabled={appt.workflowStage === 'CHECKED_IN' || appt.workflowStage === 'IN_PROGRESS' || appt.workflowStage === 'COMPLETED'}
                              onClick={() => handleUpdateAptStatus(appt.id, 'Arrived')}
                              className="font-bold text-[9px] h-7 cursor-pointer"
                            >
                              Arrived
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={appt.workflowStage === 'COMPLETED'}
                              onClick={() => handleUpdateAptStatus(appt.id, 'Done')}
                              className="font-bold text-[9px] h-7 cursor-pointer"
                            >
                              Done
                            </Button>
                            {(appt.workflowStage === 'COMPLETED' || appt.status === 'Completed') && (
                              <Button
                                size="xs"
                                onClick={() => handleOpenReApt(appt)}
                                className="font-bold text-[9px] h-7 gap-1 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white border-0"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Re-Book
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card List View */}
                <div className="flex flex-col gap-3 md:hidden">
                  {todayAppointments.map((appt) => (
                    <div key={appt.id} className="p-4 border border-border/80 rounded-2xl bg-card text-left space-y-3 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-xs font-black text-primary block">{appt.time}</span>
                          <h4 className="font-extrabold text-sm text-foreground">{appt.patientName}</h4>
                          <span className="text-[10px] text-muted-foreground font-semibold">{appt.type}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          appt.workflowStage === 'CHECKED_IN' || appt.status === 'Checked-In' || appt.status === 'Checked_In'
                            ? 'text-primary bg-primary/10 border border-primary/20'
                            : appt.workflowStage === 'COMPLETED' || appt.status === 'Completed'
                            ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                        }`}>
                          {appt.workflowStage ? appt.workflowStage.replace(/_/g, ' ') : appt.status}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-muted-foreground">
                        <span className="font-semibold text-muted-foreground/75">Provider:</span> {appt.dentistName}
                      </div>
                      <div className="flex gap-2.5 pt-2 border-t border-border/40">
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={appt.workflowStage === 'CHECKED_IN' || appt.workflowStage === 'IN_PROGRESS' || appt.workflowStage === 'COMPLETED'}
                          onClick={() => handleUpdateAptStatus(appt.id, 'Arrived')}
                          className="flex-1 font-bold text-xs h-10 cursor-pointer"
                        >
                          Arrived
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={appt.workflowStage === 'COMPLETED'}
                          onClick={() => handleUpdateAptStatus(appt.id, 'Done')}
                          className="flex-1 font-bold text-xs h-10 cursor-pointer"
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Walk-in Intake Panel */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-primary" />
            Walk-In Patient Intake
          </h3>

          <form onSubmit={handleAddWalkIn} className="space-y-3 text-left">
            <div className="space-y-1 relative" ref={patientDropdownRef}>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Select Patient
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setPatientDropdownOpen(true);
                    if (!e.target.value) {
                      setFormPatientName('');
                      setFormPatientId('');
                      setFormPatientPhone('');
                    }
                  }}
                  onFocus={() => setPatientDropdownOpen(true)}
                  placeholder={patientsLoading ? 'Loading patients...' : 'Search patient by name...'}
                  disabled={patientsLoading}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  autoComplete="off"
                />
                {patientsLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-primary" />
                )}
              </div>

              {patientDropdownOpen && !patientsLoading && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                  {(() => {
                    const filtered = patients.filter((p) =>
                      p.name.toLowerCase().includes(patientSearch.toLowerCase())
                    );
                    if (filtered.length === 0) {
                      return (
                        <div className="p-3 text-center text-xs text-muted-foreground font-semibold">
                          {patientSearch ? `No patient found for "${patientSearch}"` : 'Type to search...'}
                        </div>
                      );
                    }
                    return filtered.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setFormPatientName(p.name);
                          setFormPatientId(p.id);
                          setFormPatientPhone(p.phone || '');
                          setPatientSearch(p.name);
                          setPatientDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-primary/10 transition-colors text-left cursor-pointer border-b border-border/40 last:border-0 ${
                          formPatientId === p.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-black text-[10px]">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block font-extrabold text-foreground text-xs truncate">{p.name}</span>
                          <span className="block text-[9px] text-muted-foreground font-semibold truncate">
                            {p.phone || p.email || `ID: ${p.id}`}
                          </span>
                        </div>
                        {formPatientId === p.id && (
                          <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        )}
                      </button>
                    ));
                  })()}
                </div>
              )}
            </div>

            <Input
              label="Contact Phone"
              value={formPatientPhone}
              readOnly
              placeholder="Select a patient to view phone"
              className="h-9 font-medium text-xs text-foreground bg-muted"
            />
            
            <div className="space-y-1 text-xs">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assign Dentist</label>
              <select
                value={selectedDentistId}
                onChange={(e) => {
                  const dId = e.target.value;
                  setSelectedDentistId(dId);
                  const doc = dentistList.find(d => d.id === dId);
                  if (doc) setSelectedDentistName(doc.name);
                }}
                className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2 focus:outline-none cursor-pointer text-foreground"
              >
                {dentistList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" size="sm" className="w-full h-9 font-bold text-xs mt-3">
              Add Walk-In to Queue
            </Button>
          </form>
        </div>
      </div>

      {/* Walk-in Queue Board & Clinic Status Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Walk-In Patients Table (2 columns on lg) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-foreground">Walk-In Patient Tracker</h3>
            <p className="text-[10px] text-muted-foreground font-semibold">Live status board for non-scheduled arrivals awaiting consultation.</p>
          </div>

          <div className="overflow-x-auto">
            {walkins.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No active walk-ins logged in the system.
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <table className="hidden md:table w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      <th className="py-2">Arrived</th>
                      <th className="py-2">Patient Name</th>
                      <th className="py-2">Assigned Doctor</th>
                      <th className="py-2 text-center">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium text-foreground">
                    {walkins.map((wi) => (
                      <tr key={wi.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 font-bold text-primary">{wi.arrivedTime}</td>
                        <td className="py-2.5">
                          <div className="font-extrabold text-foreground">{wi.patientName}</div>
                          <div className="text-[9px] text-muted-foreground">{wi.phone}</div>
                        </td>
                        <td className="py-2.5 text-muted-foreground">{wi.doctor}</td>
                        <td className="py-2.5 text-center">
                          <select
                            value={wi.status}
                            onChange={(e) => updateWalkInStatus(wi.id, e.target.value)}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-muted border border-border outline-none cursor-pointer ${
                              wi.status === 'Checked-In'
                                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                            }`}
                          >
                            <option value="Waiting">Waiting</option>
                            <option value="Checked-In">Checked-In</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                        <td className="py-2.5 text-right">
                          <Button
                            size="xs"
                            variant="ghost"
                            disabled={wi.status === 'Completed'}
                            onClick={() => {
                              updateWalkInStatus(wi.id, 'Completed');
                              toast.success(`${wi.patientName} checked-in successfully!`);
                            }}
                            className="font-bold text-[9px] h-7 text-primary hover:text-primary-foreground hover:bg-primary"
                          >
                            Check In
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card List View */}
                <div className="flex flex-col gap-3 md:hidden">
                  {walkins.map((wi) => (
                    <div key={wi.id} className="p-4 border border-border/80 rounded-2xl bg-card text-left space-y-3 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-xs font-black text-primary block">{wi.arrivedTime}</span>
                          <h4 className="font-extrabold text-sm text-foreground">{wi.patientName}</h4>
                          <span className="text-[10px] text-muted-foreground font-semibold">{wi.phone}</span>
                        </div>
                        <div>
                          <select
                            value={wi.status}
                            onChange={(e) => updateWalkInStatus(wi.id, e.target.value)}
                            className={`text-[9px] font-bold px-2.5 py-1 rounded-full bg-muted border border-border outline-none cursor-pointer ${
                              wi.status === 'Checked-In'
                                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                            }`}
                          >
                            <option value="Waiting">Waiting</option>
                            <option value="Checked-In">Checked-In</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                      <div className="text-[11px] font-medium text-muted-foreground">
                        <span className="font-semibold text-muted-foreground/75">Assigned Doctor:</span> {wi.doctor}
                      </div>
                      <div className="pt-2 border-t border-border/40">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={wi.status === 'Completed'}
                          onClick={() => {
                            updateWalkInStatus(wi.id, 'Completed');
                            toast.success(`${wi.patientName} checked-in successfully!`);
                          }}
                          className="w-full font-bold text-xs h-10 text-primary hover:text-primary-foreground hover:bg-primary cursor-pointer"
                        >
                          Check In
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Real-time Registration Activity Log */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-foreground">Front Desk Log</h3>
            <p className="text-[10px] text-muted-foreground font-semibold">Activity trail recorded by clinic intakes.</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar text-xs max-h-[300px]">
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground font-semibold">
                No recent activity alerts.
              </div>
            ) : (
              alerts.slice(0, 8).map((alert) => (
                <div key={alert.id} className="p-3 bg-muted/40 border border-border/60 rounded-xl text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground truncate max-w-[150px]">{alert.title}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                    {alert.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="w-full pt-6">
        <AIInsightsPanel />
      </div>

      {/* ─── RE-APPOINTMENT MODAL ─── */}
      <Modal
        isOpen={reAptOpen}
        onClose={() => setReAptOpen(false)}
        title="Schedule Re-Appointment"
        size="2xl"
      >
        <div className="space-y-5 text-left p-1">
          {/* Patient Info Banner */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-500 rounded-lg">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-foreground">{reAptPatientName}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Re-booking from previous: <span className="text-indigo-400 font-bold">{reAptTreatment}</span></p>
            </div>
          </div>

          {/* Dentist Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Dentist</label>
            <select
              value={reAptDentistId}
              onChange={(e) => {
                setReAptDentistId(e.target.value);
                const d = dentistList.find(d => d.id === e.target.value);
                if (d) setReAptDentistName(d.name);
              }}
              className="w-full text-xs font-bold bg-muted border border-border rounded-xl p-2.5 focus:outline-none cursor-pointer text-foreground"
            >
              {dentistList.length > 0 ? (
                dentistList.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))
              ) : (
                <option value="">{reAptDentistName || 'Loading dentists...'}</option>
              )}
            </select>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Appointment Date *</label>
              <input
                type="date"
                value={reAptDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setReAptDate(e.target.value)}
                className="w-full text-xs font-bold bg-muted border border-border rounded-xl p-2.5 focus:outline-none cursor-pointer text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Preferred Time *</label>
              <select
                value={reAptTime}
                onChange={(e) => setReAptTime(e.target.value)}
                className="w-full text-xs font-bold bg-muted border border-border rounded-xl p-2.5 focus:outline-none cursor-pointer text-foreground"
              >
                {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Treatment Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Treatment / Procedure</label>
            <select
              value={reAptTreatment}
              onChange={(e) => setReAptTreatment(e.target.value)}
              className="w-full text-xs font-bold bg-muted border border-border rounded-xl p-2.5 focus:outline-none cursor-pointer text-foreground"
            >
              {['Follow-Up Consultation','Teeth Cleaning','Dental Filling','Root Canal','Tooth Extraction','Crown Placement','Orthodontic Check','Teeth Whitening','Periodontal Treatment','X-Ray Evaluation'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Notes (Optional)</label>
            <textarea
              value={reAptNotes}
              onChange={(e) => setReAptNotes(e.target.value)}
              rows={2}
              placeholder="Add any follow-up notes or instructions..."
              className="w-full text-xs font-semibold bg-muted border border-border rounded-xl p-2.5 focus:outline-none text-foreground resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setReAptOpen(false)}
              className="flex-1 text-xs font-bold h-10 rounded-xl border border-border bg-muted hover:bg-muted/70 text-foreground cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReApt}
              disabled={reAptLoading || !reAptDate}
              className="flex-1 text-xs font-bold h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white border-0 cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reAptLoading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Booking...</>
              ) : (
                <><RotateCcw className="h-3.5 w-3.5" /> Confirm Re-Appointment</>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
export default FrontDeskDashboardPage;
