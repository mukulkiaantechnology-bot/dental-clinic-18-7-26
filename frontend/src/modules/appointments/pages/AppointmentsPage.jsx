import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Sparkles,
  AlertTriangle, Edit2, Trash2, Loader2, RefreshCw, ChevronRight, ChevronLeft, Search, User, RotateCcw, Clock, Bell
} from 'lucide-react';
import { useAppointmentStore } from '../../../store/appointmentStore';
import { useAuthStore } from '../../../store/authStore';
import { useAISchedulingStore } from '../../../store/aiSchedulingStore';
import { useBillingStore } from '../../../store/billingStore';
import { useLabStore } from '../../../store/labStore';
import { Modal } from '../../../shared/ui/Modal';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { useToast } from '../../../shared/hooks/useToast';
import api from '../../../shared/utils/api';

// ─── STATUS FLOW CONSTANTS ────────────────────────────────────────────────────
const WORKFLOW_STAGE_FLOW = {
  SCHEDULED:         { next: 'CHECKED_IN',         label: 'Check In',           color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  CONFIRMED:         { next: 'CHECKED_IN',         label: 'Check In',           color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  CHECKED_IN:        { next: 'IN_PROGRESS',        label: 'Start Treatment',    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  IN_PROGRESS:       { next: 'COMPLETED',          label: 'Complete',           color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  CLEANING_PENDING:  { next: 'COMPLETED',          label: 'Complete',           color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  TREATMENT_PENDING: { next: 'COMPLETED',          label: 'Complete',           color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  COMPLETED:         { next: null,                 label: 'Completed',          color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  CANCELLED:         { next: null,                 label: 'Cancelled',          color: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

const ROLE_ALLOWED_STAGE_TRANSITIONS = {
  dental_assistant: ['IN_PROGRESS'],
  hygienist:        ['IN_PROGRESS', 'CLEANING_PENDING', 'COMPLETED'],
  dentist:          ['IN_PROGRESS', 'TREATMENT_PENDING', 'COMPLETED'],
  front_desk:       ['CHECKED_IN', 'CONFIRMED', 'CANCELLED', 'IN_PROGRESS'],
  frontdesk:        ['CHECKED_IN', 'CONFIRMED', 'CANCELLED', 'IN_PROGRESS'],
  clinic_owner:     Object.keys(WORKFLOW_STAGE_FLOW),
  super_admin:      Object.keys(WORKFLOW_STAGE_FLOW),
};

const WORKFLOW_STAGE_LABELS = {
  SCHEDULED:         'Scheduled',
  CONFIRMED:         'Confirmed',
  CHECKED_IN:        'Checked In',
  IN_PROGRESS:       'With Assistant',
  TREATMENT_PENDING: 'Dentist Working',
  CLEANING_PENDING:  'With Hygienist',
  COMPLETED:         'Completed',
  CANCELLED:         'Cancelled',
};

export function AppointmentsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const isHygienist = role === 'hygienist';
  const canBook = ['super_admin', 'clinic_owner', 'dentist', 'dental_assistant', 'front_desk', 'frontdesk'].includes(role);

  const handleOpenWorkspace = (patientId, appointmentId) => {
    const qStr = appointmentId ? `&appointmentId=${appointmentId}` : '';
    if (role === 'dental_assistant' || role === 'assistant') {
      navigate(`/assistant/patients/${patientId}?tab=chairside&id=${patientId}${qStr}`);
    } else if (role === 'dentist') {
      navigate(`/dentist/patients/${patientId}?tab=chart${qStr}`);
    } else if (role === 'hygienist') {
      navigate(`/hygienist/patients/${patientId}?tab=overview${qStr}`);
    }
  };

  const {
    appointments,
    loading,
    error,
    fetchAppointments,
    addAppointment,
    updateStatus,
    updateAppointment,
    deleteAppointment,
    assignAssistant,
    assignHygienist,
  } = useAppointmentStore();

  const toast = useToast();

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState(null);
  const [selectedDateString, setSelectedDateString] = useState(new Date().toISOString().split('T')[0]);
  const [savingId, setSavingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dentistFilter, setDentistFilter] = useState('ALL');

  // Re-appointment state
  const [isReAptOpen, setIsReAptOpen] = useState(false);
  const [reAptSource, setReAptSource] = useState(null);
  const [reAptDate, setReAptDate] = useState('');
  const [reAptTime, setReAptTime] = useState('09:00 AM');
  const [reAptTreatment, setReAptTreatment] = useState('');
  const [reAptDentistId, setReAptDentistId] = useState('');
  const [reAptNotes, setReAptNotes] = useState('');
  const [reAptLoading, setReAptLoading] = useState(false);

  // Workflow transition prompt states
  const [isAssignHygienistOpen, setIsAssignHygienistOpen] = useState(false);
  const [transitionApt, setTransitionApt] = useState(null);
  const [selectedHygienistId, setSelectedHygienistId] = useState('');

  // Form fields
  const [formPatientName, setFormPatientName] = useState('');
  const [formPatientId, setFormPatientId] = useState('');
  const [formDentistId, setFormDentistId] = useState('');
  const [formDentistName, setFormDentistName] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formDate, setFormDate] = useState('');
  const [formTreatment, setFormTreatment] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formAssistantId, setFormAssistantId] = useState('');
  const [formHygienistId, setFormHygienistId] = useState('');

  // Dropdown option lists
  const [allPatients, setAllPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [dentistList, setDentistList] = useState([]);
  const [assistantList, setAssistantList] = useState([]);
  const [hygienistList, setHygienistList] = useState([]);

  const displayDateStr = useMemo(() => {
    try {
      const d = new Date(selectedDateString + 'T00:00:00');
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (_) {
      return selectedDateString;
    }
  }, [selectedDateString]);

  // Date picker navigations
  const handlePrevDay = () => {
    const d = new Date(selectedDateString + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDateString(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDateString + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDateString(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDateString(new Date().toISOString().split('T')[0]);
  };

  // Fetch functions
  const load = useCallback(() => {
    fetchAppointments(selectedDateString);
  }, [fetchAppointments, selectedDateString]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const fetchPatients = async () => {
      setPatientsLoading(true);
      try {
        const { data } = await api.get('/patients');
        if (data.success) setAllPatients(data.data);
      } catch (_) {}
      setPatientsLoading(false);
    };
    const fetchDentists = async () => {
      try {
        const { data } = await api.get('/users/staff/dentists');
        if (data.success) setDentistList(data.data);
      } catch (_) {}
    };
    const fetchAssistants = async () => {
      try {
        const { data } = await api.get('/users/staff/assistants');
        if (data.success) setAssistantList(data.data);
      } catch (_) {}
    };
    const fetchHygienists = async () => {
      try {
        const { data } = await api.get('/users/staff/hygienists');
        if (data.success) setHygienistList(data.data);
      } catch (_) {}
    };

    fetchPatients();
    fetchDentists();
    fetchAssistants();
    fetchHygienists();
  }, []);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (appt.date !== selectedDateString) return false;

      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const patientMatch = appt.patientName?.toLowerCase().includes(term);
        const typeMatch = appt.type?.toLowerCase().includes(term);
        const dentistMatch = appt.dentistName?.toLowerCase().includes(term);
        const notesMatch = appt.notes?.toLowerCase().includes(term);
        const statusMatch = appt.workflowStage?.toLowerCase().includes(term);
        if (!patientMatch && !typeMatch && !dentistMatch && !notesMatch && !statusMatch) return false;
      }

      if (statusFilter !== 'ALL') {
        if (appt.workflowStage !== statusFilter) return false;
      }

      if (dentistFilter !== 'ALL') {
        const docId = appt.assignedDoctorId || appt.dentistId;
        if (docId !== dentistFilter) return false;
      }

      return true;
    });
  }, [appointments, selectedDateString, searchTerm, statusFilter, dentistFilter]);

  // Form Booking Trigger
  const handleOpenBooking = () => {
    setFormPatientName('');
    setFormPatientId('');
    setFormDentistId('');
    setFormDentistName('');
    setFormTime('09:00');
    setFormDate(selectedDateString);
    setFormTreatment('');
    setFormNotes('');
    setFormAssignedTo('dentist');
    setFormAssistantId('');
    setFormHygienistId('');
    setEditingApt(null);
    setIsBookModalOpen(true);
  };

  const handleOpenEdit = (apt) => {
    setEditingApt(apt);
    setFormPatientName(apt.patientName || '');
    setFormPatientId(apt.patientId || '');
    setFormDentistId(apt.assignedDoctorId || apt.dentistId || '');
    setFormDentistName(apt.dentistName || '');
    setFormTime(apt.time || '09:00');
    setFormDate(apt.date || selectedDateString);
    setFormTreatment(apt.type || 'Cleaning');
    setFormNotes(apt.notes || '');
    setFormAssignedTo(apt.assignedTo || 'dentist');
    setFormAssistantId(apt.assignedAssistantId || '');
    setFormHygienistId(apt.assignedHygienistId || '');
    setIsBookModalOpen(true);
  };

  const handleDelete = async (id, patientName) => {
    if (!window.confirm(`Cancel appointment for ${patientName}?`)) return;
    setSavingId(id);
    const result = await deleteAppointment(id);
    setSavingId(null);
    if (result.success) {
      toast.success(`Appointment for ${patientName} cancelled.`);
    } else {
      toast.error(result.error || 'Failed to cancel appointment');
    }
  };

  const handleAutoBillingAndLab = async (apt) => {
    const type = apt.type || 'Cleaning';
    const prices = {
      'Crown': 950,
      'Implant': 1800,
      'Bridge': 1100,
      'Root Canal': 1100,
      'Filling': 200,
      'Cleaning': 150,
      'Teeth Cleaning': 150,
      'Consultation': 100
    };
    const amount = prices[type] || 150;
    const tax = amount * 0.05;

    try {
      await useBillingStore.getState().createInvoice({
        patientId: apt.patientId,
        patientName: apt.patientName,
        clinicId: apt.clinicId || 'clinic-1',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: amount + tax,
        tax: tax,
        discount: 0,
        status: 'Unpaid',
        items: [
          { description: `${type} Procedure - Completed Treatment`, cost: amount }
        ]
      });
      toast.success(`Billing invoice automatically generated for ${apt.patientName} ($${(amount + tax).toFixed(2)})`);
    } catch (e) {
      console.error('Auto billing failed:', e);
    }

    const isLab = ['Crown', 'Implant', 'Bridge'].includes(type) || 
                  type.toLowerCase().includes('crown') || 
                  type.toLowerCase().includes('implant') || 
                  type.toLowerCase().includes('bridge');
    if (isLab) {
      const labCosts = {
        'Crown': 250,
        'Implant': 850,
        'Bridge': 1100
      };
      const labCost = labCosts[type] || 250;
      try {
        useLabStore.getState().createLabCase({
          patientId: apt.patientId,
          patientName: apt.patientName,
          dentistName: apt.dentistName || 'Not Assigned',
          type: type.includes('Crown') ? 'Crown' : type.includes('Implant') ? 'Implant' : 'Bridge',
          cost: labCost,
          notes: `Auto-generated from completed appointment: ${type}`,
          expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          labName: 'Pending Assignment'
        });
        toast.success(`Lab case automatically dispatched for ${apt.patientName} (${type})`);
      } catch (e) {
        console.error('Auto lab case creation failed:', e);
      }
    }
  };

  const handleStatusAdvance = async (apt) => {
    const currentStage = apt.workflowStage || 'SCHEDULED';
    const stageFlow = WORKFLOW_STAGE_FLOW[currentStage];

    if (!stageFlow?.next) return;

    const allowedStages = ROLE_ALLOWED_STAGE_TRANSITIONS[role] || [];
    if (!allowedStages.includes(stageFlow.next) &&
        !['clinic_owner', 'super_admin'].includes(role)) {
      toast.warning(`Your role (${role}) cannot advance to "${stageFlow.next}".`, 'Restricted');
      return;
    }

    if (stageFlow.next === 'IN_PROGRESS') {
      setSavingId(apt.id);
      if ((role === 'dental_assistant' || role === 'assistant') && user?.id && !apt.assignedAssistantId) {
        await assignAssistant(apt.id, user.id);
      }
      const result = await updateStatus(apt.id, 'IN_PROGRESS');
      setSavingId(null);
      if (result.success) {
        toast.success(`${apt.patientName} is now with Assistant for preparation`);
        if (role === 'dental_assistant' || role === 'assistant') {
          navigate(`/assistant/patients/${apt.patientId}?tab=chairside&id=${apt.patientId}&appointmentId=${apt.id}`);
        }
      } else {
        toast.error(result.error || 'Failed to start treatment');
      }
      return;
    }

    if (currentStage === 'IN_PROGRESS') {
      setTransitionApt(apt);
      setSelectedHygienistId(apt.assignedHygienistId || (hygienistList[0]?.id || ''));
      setIsAssignHygienistOpen(true);
      return;
    }

    setSavingId(apt.id);
    const result = await updateStatus(apt.id, stageFlow.next);
    setSavingId(null);
    if (result.success) {
      toast.success(`${apt.patientName} → ${stageFlow.next.replace(/_/g, ' ')}`);
      if (stageFlow.next === 'COMPLETED') {
        await handleAutoBillingAndLab(result.data || apt);
      }
    } else {
      toast.error(result.error || 'Failed to update status');
    }
  };

  const confirmHygienistAndStart = async () => {
    if (!transitionApt) return;
    if (!selectedHygienistId) {
      toast.error('Please select a hygienist to assign.');
      return;
    }
    setIsAssignHygienistOpen(false);
    setSavingId(transitionApt.id);

    const assignResult = await assignHygienist(transitionApt.id, selectedHygienistId);
    if (!assignResult.success) {
      toast.error(assignResult.error || 'Failed to assign hygienist');
      setSavingId(null);
      return;
    }

    const result = await updateStatus(transitionApt.id, 'CLEANING_PENDING');
    setSavingId(null);
    if (result.success) {
      toast.success(`${transitionApt.patientName} → Cleaning Pending (Hygienist assigned)`);
    } else {
      toast.error(result.error || 'Failed to advance to hygienist cleaning');
    }
  };

  const directCompleteTreatment = async () => {
    if (!transitionApt) return;
    setIsAssignHygienistOpen(false);
    setSavingId(transitionApt.id);

    const result = await updateStatus(transitionApt.id, 'COMPLETED');
    setSavingId(null);
    if (result.success) {
      toast.success(`${transitionApt.patientName} → Completed`);
      await handleAutoBillingAndLab(result.data || transitionApt);
    } else {
      toast.error(result.error || 'Failed to complete treatment');
    }
  };

  const handleCloseModal = () => {
    setIsBookModalOpen(false);
    setEditingApt(null);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!formPatientId) {
      toast.error('Please select a patient from the dropdown.', 'Patient Required');
      return;
    }
    const apptData = {
      patientId: formPatientId,
      patientName: formPatientName,
      dentistId: formDentistId || undefined,
      dentistName: formDentistName,
      assignedDoctorId: formDentistId || undefined,
      date: formDate,
      time: formTime,
      duration: 45,
      type: formTreatment,
      notes: formNotes,
      assignedTo: formAssignedTo || 'dentist',
      assignedAssistantId: formAssistantId || null,
      assignedHygienistId: formHygienistId || null,
    };

    let result;
    if (editingApt) {
      result = await updateAppointment(editingApt.id, apptData);
      if (result.success) toast.success(`Appointment for ${formPatientName} updated.`);
    } else {
      result = await addAppointment(apptData);
      if (result.success) toast.success(`Appointment booked for ${formPatientName} on ${formDate} at ${formTime}.`);
    }

    if (!result.success) {
      toast.error(result.error || 'Operation failed');
      return;
    }

    setIsBookModalOpen(false);
    setEditingApt(null);
  };

  // Re-appointment handlers
  const handleOpenReApt = (apt) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setReAptSource(apt);
    setReAptDate(tomorrow.toISOString().split('T')[0]);
    setReAptTime('09:00 AM');
    setReAptTreatment(apt.type || 'Follow-Up Consultation');
    setReAptDentistId(apt.assignedDoctorId || apt.dentistId || (dentistList[0]?.id || ''));
    setReAptNotes(`Follow-up from ${apt.type || 'previous appointment'}`);
    setIsReAptOpen(true);
  };

  const handleSubmitReApt = async () => {
    if (!reAptSource || !reAptDate) {
      toast.error('Please select a valid date.');
      return;
    }
    setReAptLoading(true);
    const dentist = dentistList.find(d => d.id === reAptDentistId);
    const result = await addAppointment({
      patientId: reAptSource.patientId,
      patientName: reAptSource.patientName,
      dentistId: reAptDentistId,
      dentistName: dentist?.name || reAptSource.dentistName,
      assignedDoctorId: reAptDentistId,
      date: reAptDate,
      time: reAptTime,
      duration: 45,
      type: reAptTreatment,
      notes: reAptNotes,
      status: 'Scheduled',
      workflowStage: 'SCHEDULED'
    });
    setReAptLoading(false);
    if (result?.success !== false) {
      toast.success(`Re-appointment booked for ${reAptSource.patientName} on ${reAptDate}!`, 'Re-Booked ✓');
      setIsReAptOpen(false);
    } else {
      toast.error(result.error || 'Failed to book re-appointment.');
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 11; hour++) {
      for (let min of ['00', '15', '30', '45']) {
        options.push(`${hour.toString().padStart(2, '0')}:${min} AM`);
      }
    }
    for (let min of ['00', '15', '30', '45']) {
      options.push(`12:${min} PM`);
    }
    for (let hour = 1; hour <= 7; hour++) {
      for (let min of ['00', '15', '30', '45']) {
        options.push(`${hour.toString().padStart(2, '0')}:${min} PM`);
      }
    }
    options.push("08:00 PM");
    
    if (formTime) {
      let formattedTime = formTime;
      if (!formTime.includes('AM') && !formTime.includes('PM') && formTime.includes(':')) {
        const [h, m] = formTime.split(':');
        const hr = parseInt(h, 10);
        if (!isNaN(hr)) {
          const suffix = hr >= 12 ? 'PM' : 'AM';
          const displayHr = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
          formattedTime = `${displayHr.toString().padStart(2, '0')}:${m} ${suffix}`;
        }
      }
      if (!options.includes(formattedTime)) {
        options.push(formattedTime);
      }
    }
    return options.sort((a, b) => {
      const parse = (t) => {
        const [time, period] = t.split(' ');
        let [h, m] = time.split(':').map(Number);
        if (period === 'PM' && h < 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      };
      return parse(a) - parse(b);
    });
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 w-full text-left animate-fade-in h-[calc(100vh-110px)] overflow-hidden pb-2 select-none">
      {/* ─── Top Header ─── */}
      <div className="bg-card border border-border rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 shadow-sm">
        
        {/* Date Selector and Nav */}
        <div className="flex items-center gap-1.5 bg-muted/40 border border-border/80 rounded-xl p-1">
          <button
            onClick={handlePrevDay}
            className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="relative flex items-center gap-1.5 px-2 py-1 font-extrabold text-xs text-foreground hover:bg-muted rounded-lg cursor-pointer">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            <span className="capitalize">{displayDateStr}</span>
            <input
              type="date"
              value={selectedDateString || ''}
              onChange={(e) => setSelectedDateString(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
          >
            Today
          </button>
        </div>

        {/* Doctor Filters / Tabs */}
        <div className="hidden lg:flex items-center gap-1 bg-muted/20 border border-border/40 p-1 rounded-xl">
          <button
            onClick={() => setDentistFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              dentistFilter === 'ALL'
                ? 'bg-primary text-white shadow-sm font-extrabold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            All Providers
          </button>
          {dentistList.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setDentistFilter(doc.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer truncate max-w-[120px] ${
                dentistFilter === doc.id
                  ? 'bg-primary text-white shadow-sm font-extrabold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={doc.name}
            >
              {doc.name.replace('Dr. ', 'Dr. ')}
            </button>
          ))}
        </div>

        {/* Clinic Location Selector & Actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Location Badge */}
          <div className="hidden xl:flex items-center gap-1.5 bg-muted/40 border border-border/60 px-3 py-1.5 rounded-xl text-xs font-bold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {user?.clinic?.name || 'Downtown Clinic'}
          </div>

          {/* Search box */}
          <div className="relative w-36 sm:w-44">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-muted/30 border border-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={load}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Refresh appointments"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* New Appointment Button */}
          {canBook && (
            <Button
              onClick={handleOpenBooking}
              className="bg-primary hover:bg-primary/90 text-white font-extrabold text-xs shadow-sm h-9 px-4 rounded-xl cursor-pointer"
            >
              + New Appointment
            </Button>
          )}
        </div>
      </div>

      {/* Hygienist Banner */}
      {isHygienist && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 select-none animate-fade-in flex-shrink-0">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 animate-pulse" />
          <span>Hygienist Mode: You can view appointments and update status to In Progress / Ready For Doctor. Booking is restricted.</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 flex-shrink-0">
          <AlertTriangle className="h-4 w-4" />
          {error}
          <button onClick={load} className="ml-auto underline cursor-pointer">Retry</button>
        </div>
      )}

      {/* ─── Main Content Grid (Calendar + Sidebar) ─── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 overflow-hidden">
        {/* Left Side: Calendar Panel */}
        <div className="flex-1 min-w-0 flex flex-col h-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <MultiProviderCalendar
            selectedDateString={selectedDateString}
            filteredAppointments={filteredAppointments}
            dentistList={dentistList}
            hygienistList={hygienistList}
            assistantList={assistantList}
            role={role}
            canBook={canBook}
            savingId={savingId}
            handleStatusAdvance={handleStatusAdvance}
            handleOpenEdit={handleOpenEdit}
            handleDelete={handleDelete}
            handleOpenWorkspace={handleOpenWorkspace}
            handleOpenReApt={handleOpenReApt}
            loading={loading}
            dentistFilter={dentistFilter}
            setDentistFilter={setDentistFilter}
            handleOpenBooking={handleOpenBooking}
            setFormPatientName={setFormPatientName}
            setFormPatientId={setFormPatientId}
            setFormDate={setFormDate}
            setFormTime={setFormTime}
            setFormTreatment={setFormTreatment}
            setFormNotes={setFormNotes}
            setFormAssignedTo={setFormAssignedTo}
            setFormAssistantId={setFormAssistantId}
            setFormHygienistId={setFormHygienistId}
            setFormDentistId={setFormDentistId}
            setFormDentistName={setFormDentistName}
            setEditingApt={setEditingApt}
            setIsBookModalOpen={setIsBookModalOpen}
          />
        </div>

        {/* Right Side: Control/Summary Sidebar */}
        <div className="w-full lg:w-[280px] xl:w-[320px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1 pb-1">
          {/* Mini Calendar Widget */}
          <MiniCalendar selectedDateString={selectedDateString} onChange={setSelectedDateString} />

          {/* Appointment Types Legend */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm text-left">
            <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Appointment Types</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Emergency',    clr: 'bg-rose-500' },
                { label: 'New Patient',  clr: 'bg-sky-500' },
                { label: 'Restorative',  clr: 'bg-violet-500' },
                { label: 'Delivery',     clr: 'bg-orange-500' },
                { label: 'Hygiene',      clr: 'bg-emerald-500' },
                { label: 'Perio',        clr: 'bg-teal-500' },
                { label: 'Consultation', clr: 'bg-blue-500' },
                { label: 'Filling',      clr: 'bg-amber-500' },
              ].map(({ label, clr }) => (
                <div key={label} className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${clr}`} />
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Summary */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm text-left flex flex-col gap-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Today's Summary</h4>
            
            <div className="flex items-center justify-between border-b border-border/45 pb-2">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Total Apps.
              </span>
              <span className="text-xs font-extrabold text-foreground">
                {appointments.filter(a => a.date === selectedDateString).length}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/45 pb-2">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> New Patients
              </span>
              <span className="text-xs font-extrabold text-foreground">
                {appointments.filter(a => a.date === selectedDateString && a.type?.toLowerCase().includes('new patient')).length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Cancellations
              </span>
              <span className="text-xs font-extrabold text-foreground">
                {appointments.filter(a => a.date === selectedDateString && a.workflowStage === 'CANCELLED').length}
              </span>
            </div>
          </div>

          {/* Clinic Efficiency & Performance */}
          <div className="bg-primary text-primary-foreground border border-primary/20 rounded-2xl p-4 shadow-sm text-left flex flex-col gap-3 animate-pulse-subtle">
            <h4 className="text-xs font-black uppercase tracking-wider opacity-85">Clinic Efficiency</h4>
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold opacity-75 block">Revenue Projection</span>
              <div className="text-lg font-black tracking-tight">
                {(() => {
                  const prices = {
                    'Crown': 950,
                    'Implant': 1800,
                    'Bridge': 1100,
                    'Root Canal': 1100,
                    'Filling': 200,
                    'Cleaning': 150,
                    'Teeth Cleaning': 150,
                    'Consultation': 100
                  };
                  const rev = appointments
                    .filter(a => a.date === selectedDateString && a.workflowStage !== 'CANCELLED')
                    .reduce((sum, a) => sum + (prices[a.type] || 150), 0);
                  return rev > 0 ? `$${rev.toLocaleString()}` : '$12,450';
                })()}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="opacity-75">Chair Occupancy</span>
                <span>
                  {(() => {
                    const todayApts = appointments.filter(a => a.date === selectedDateString && a.workflowStage !== 'CANCELLED').length;
                    return todayApts > 0 ? `${Math.min(Math.round((todayApts / 12) * 100), 100)}%` : '85%';
                  })()}
                </span>
              </div>
              <div className="w-full bg-primary-foreground/20 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-primary-foreground h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: (() => {
                      const todayApts = appointments.filter(a => a.date === selectedDateString && a.workflowStage !== 'CANCELLED').length;
                      return todayApts > 0 ? `${Math.min(Math.round((todayApts / 12) * 100), 100)}%` : '85%';
                    })()
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking / Edit Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={handleCloseModal}
        title={editingApt ? 'Edit Appointment Details' : 'Book New Appointment'}
      >
        <form onSubmit={handleSubmitBooking} className="space-y-4 text-xs font-semibold text-left">

          {/* Patient name select */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              PATIENT NAME
            </label>
            {patientsLoading ? (
              <div className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground font-semibold flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading patients...
              </div>
            ) : (
              <select
                value={formPatientId}
                onChange={(e) => {
                  const selected = allPatients.find((p) => p.id === e.target.value);
                  setFormPatientId(e.target.value);
                  setFormPatientName(selected?.name || '');
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
                required
              >
                <option value="">Select Patient</option>
                {allPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Attending Dentist */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              ATTENDING DENTIST
            </label>
            {dentistList.length > 0 ? (
              <select
                value={formDentistId}
                onChange={(e) => {
                  const selected = dentistList.find((d) => d.id === e.target.value);
                  setFormDentistId(e.target.value);
                  setFormDentistName(selected?.name || '');
                  
                  if (selected) {
                    if (selected.assistantId) {
                      setFormAssistantId(selected.assistantId);
                    }
                    if (selected.hygienistId) {
                      setFormHygienistId(selected.hygienistId);
                    }
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
              >
                <option value="">Select Dentist</option>
                {dentistList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.email})
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground font-semibold flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading dentists...
              </div>
            )}
          </div>

          {/* Assistant & Hygienist */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                ASSISTANT
              </label>
              <select
                value={formAssistantId}
                onChange={(e) => setFormAssistantId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
              >
                <option value="">Select Assistant</option>
                {assistantList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                HYGIENIST
              </label>
              <select
                value={formHygienistId}
                onChange={(e) => setFormHygienistId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
              >
                <option value="">Select Hygienist</option>
                {hygienistList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="DATE" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                START TIME (HH:MM)
              </label>
              <select
                value={(() => {
                  if (formTime && !formTime.includes('AM') && !formTime.includes('PM') && formTime.includes(':')) {
                    const [h, m] = formTime.split(':');
                    const hr = parseInt(h, 10);
                    if (!isNaN(hr)) {
                      const suffix = hr >= 12 ? 'PM' : 'AM';
                      const displayHr = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
                      return `${displayHr.toString().padStart(2, '0')}:${m} ${suffix}`;
                    }
                  }
                  return formTime;
                })()}
                onChange={(e) => setFormTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
                required
              >
                {generateTimeOptions().map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Select
            label="TREATMENT TYPE"
            value={formTreatment}
            onChange={(e) => setFormTreatment(e.target.value)}
            options={[
              { value: '', label: 'Select Treatment' },
              { value: 'Cleaning', label: 'Prophylaxis / Cleaning' },
              { value: 'Filling', label: 'Composite Filling' },
              { value: 'Root Canal', label: 'Endodontic Root Canal' },
              { value: 'Crown', label: 'Crown / Restorative' },
              { value: 'Consultation', label: 'Consultation' },
              { value: 'Teeth Cleaning', label: 'Routine Hygiene' },
            ]}
          />

          <Input
            label="REMARKS / SYMPTOMS"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="Notes or reason for visit..."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" disabled={!formPatientId}>
              {editingApt ? 'Save Changes' : 'Schedule Visit'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* RE-APPOINTMENT MODAL */}
      <Modal
        isOpen={isReAptOpen}
        onClose={() => setIsReAptOpen(false)}
        title="Schedule Re-Appointment"
        size="2xl"
      >
        <div className="space-y-5 text-left p-1">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-500 rounded-lg">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-foreground">{reAptSource?.patientName}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Re-booking from previous: <span className="text-indigo-400 font-bold">{reAptTreatment}</span></p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Dentist</label>
            <select
              value={reAptDentistId}
              onChange={(e) => {
                setReAptDentistId(e.target.value);
              }}
              className="w-full text-xs font-bold bg-muted border border-border rounded-xl p-2.5 focus:outline-none cursor-pointer text-foreground"
            >
              {dentistList.length > 0 ? (
                dentistList.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))
              ) : (
                <option value="">Select Dentist</option>
              )}
            </select>
          </div>

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
                {[
                  { value: '09:00 AM', label: '09:00 AM' },
                  { value: '10:00 AM', label: '10:00 AM' },
                  { value: '11:00 AM', label: '11:00 AM' },
                  { value: '12:00 PM', label: '12:00 PM' },
                  { value: '01:00 PM', label: '01:00 PM' },
                  { value: '02:00 PM', label: '02:00 PM' },
                  { value: '03:00 PM', label: '03:00 PM' },
                  { value: '04:00 PM', label: '04:00 PM' }
                ].map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsReAptOpen(false)}
              className="flex-1 text-xs font-bold h-10 rounded-xl border border-border bg-muted hover:bg-muted/70 text-foreground cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
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

      {/* Hygienist Assignment Modal */}
      <Modal
        isOpen={isAssignHygienistOpen}
        onClose={() => setIsAssignHygienistOpen(false)}
        title="Dentist Treatment Completed"
      >
        <div className="space-y-4 text-xs font-semibold text-left">
          <p className="text-muted-foreground leading-relaxed">
            Choose the next clinical workflow step for <strong>{transitionApt?.patientName}</strong>:
          </p>

          <div className="border border-border p-4 rounded-xl space-y-3 bg-muted/20">
            <h4 className="font-bold text-foreground">Option 1: Hand Over to Hygienist for Cleaning</h4>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                SELECT HYGIENIST
              </label>
              <select
                value={selectedHygienistId}
                onChange={(e) => setSelectedHygienistId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
              >
                <option value="">Select Hygienist</option>
                {hygienistList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={confirmHygienistAndStart} disabled={!selectedHygienistId} className="w-full justify-center">
              Assign Hygienist & Transition (Cleaning Pending)
            </Button>
          </div>

          <div className="border border-border p-4 rounded-xl space-y-3 bg-primary/5 border-primary/20">
            <h4 className="font-bold text-primary">Option 2: Direct Complete Treatment</h4>
            <p className="text-[10px] text-muted-foreground">
              Select this if no hygiene cleaning is required for this visit. Invoicing and lab workflows will trigger instantly.
            </p>
            <Button onClick={directCompleteTreatment} className="w-full justify-center" variant="outline">
              Mark Treatment Completed (COMPLETED)
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAssignHygienistOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AppointmentsPage;

// ─── APPOINTMENT TYPE COLOR CONFIG ────────────────────────────────────────────
const APPT_TYPE_COLORS = {
  'Emergency':    { bg: 'bg-rose-50 dark:bg-rose-500/10',      border: 'border-l-4 border-rose-500',    text: 'text-rose-700 dark:text-rose-300',   header: 'text-rose-600 dark:text-rose-400',  icon: '🚨' },
  'New Patient':  { bg: 'bg-sky-50 dark:bg-sky-500/10',        border: 'border-l-4 border-sky-500',      text: 'text-sky-700 dark:text-sky-300',     header: 'text-sky-600 dark:text-sky-400',    icon: '👤' },
  'Restorative':  { bg: 'bg-violet-50 dark:bg-violet-500/10',  border: 'border-l-4 border-violet-500',   text: 'text-violet-700 dark:text-violet-300',header: 'text-violet-600 dark:text-violet-400',icon: '🦷' },
  'Delivery':     { bg: 'bg-orange-50 dark:bg-orange-500/10',  border: 'border-l-4 border-orange-500',   text: 'text-orange-700 dark:text-orange-300',header: 'text-orange-600 dark:text-orange-400',icon: '📦' },
  'Hygiene':      { bg: 'bg-emerald-50 dark:bg-emerald-500/10',border: 'border-l-4 border-emerald-500',  text: 'text-emerald-700 dark:text-emerald-300',header:'text-emerald-600 dark:text-emerald-400',icon:'✨' },
  'Perio':        { bg: 'bg-teal-50 dark:bg-teal-500/10',      border: 'border-l-4 border-teal-500',     text: 'text-teal-700 dark:text-teal-300',   header: 'text-teal-600 dark:text-teal-400',  icon: '🔬' },
  'Cleaning':     { bg: 'bg-emerald-50 dark:bg-emerald-500/10',border: 'border-l-4 border-emerald-500',  text: 'text-emerald-700 dark:text-emerald-300',header:'text-emerald-600 dark:text-emerald-400',icon:'✨' },
  'Crown':        { bg: 'bg-violet-50 dark:bg-violet-500/10',  border: 'border-l-4 border-violet-500',   text: 'text-violet-700 dark:text-violet-300',header: 'text-violet-600 dark:text-violet-400',icon: '👑' },
  'Root Canal':   { bg: 'bg-red-50 dark:bg-red-500/10',        border: 'border-l-4 border-red-500',      text: 'text-red-700 dark:text-red-300',     header: 'text-red-600 dark:text-red-400',    icon: '🦷' },
  'Implant':      { bg: 'bg-indigo-50 dark:bg-indigo-500/10',  border: 'border-l-4 border-indigo-500',   text: 'text-indigo-700 dark:text-indigo-300',header: 'text-indigo-600 dark:text-indigo-400',icon:'🔩' },
  'Consultation': { bg: 'bg-blue-50 dark:bg-blue-500/10',      border: 'border-l-4 border-blue-500',     text: 'text-blue-700 dark:text-blue-300',   header: 'text-blue-600 dark:text-blue-400',  icon: '💬' },
  'Filling':      { bg: 'bg-amber-50 dark:bg-amber-500/10',    border: 'border-l-4 border-amber-400',    text: 'text-amber-700 dark:text-amber-300', header: 'text-amber-600 dark:text-amber-400', icon: '🦷' },
  'default':      { bg: 'bg-slate-50 dark:bg-slate-500/10',    border: 'border-l-4 border-slate-500',    text: 'text-slate-700 dark:text-slate-300', header: 'text-slate-600 dark:text-slate-400', icon: '📋' },
};

function getTypeColors(type) {
  if (!type) return APPT_TYPE_COLORS.default;
  const key = Object.keys(APPT_TYPE_COLORS).find(k => k !== 'default' && type.toLowerCase().includes(k.toLowerCase()));
  return APPT_TYPE_COLORS[key] || APPT_TYPE_COLORS.default;
}

// 30-minute interval slots
const CAL_SLOTS = [
  { label: '08:00 AM', hour: 8, minute: 0, key: '08:00' },
  { label: '08:30 AM', hour: 8, minute: 30, key: '08:30' },
  { label: '09:00 AM', hour: 9, minute: 0, key: '09:00' },
  { label: '09:30 AM', hour: 9, minute: 30, key: '09:30' },
  { label: '10:00 AM', hour: 10, minute: 0, key: '10:00' },
  { label: '10:30 AM', hour: 10, minute: 30, key: '10:30' },
  { label: '11:00 AM', hour: 11, minute: 0, key: '11:00' },
  { label: '11:30 AM', hour: 11, minute: 30, key: '11:30' },
  { label: '12:00 PM', hour: 12, minute: 0, key: '12:00' },
  { label: '12:30 PM', hour: 12, minute: 30, key: '12:30' },
  { label: '01:00 PM', hour: 13, minute: 0, key: '13:00' },
  { label: '01:30 PM', hour: 13, minute: 30, key: '13:30' },
  { label: '02:00 PM', hour: 14, minute: 0, key: '14:00' },
  { label: '02:30 PM', hour: 14, minute: 30, key: '14:30' },
  { label: '03:00 PM', hour: 15, minute: 0, key: '15:00' },
  { label: '03:30 PM', hour: 15, minute: 30, key: '15:30' },
  { label: '04:00 PM', hour: 16, minute: 0, key: '16:00' },
  { label: '04:30 PM', hour: 16, minute: 30, key: '16:30' },
  { label: '05:00 PM', hour: 17, minute: 0, key: '17:00' },
];

function parseApptTime(timeStr) {
  if (!timeStr) return null;
  const t = String(timeStr).replace('.', ':');
  const parts = t.split(':');
  if (parts.length < 2) return null;
  let hr = parseInt(parts[0], 10);
  let min = parseInt(parts[1], 10) || 0;
  const isPM = t.toLowerCase().includes('pm');
  const isAM = t.toLowerCase().includes('am');
  if (isPM && hr < 12) hr += 12;
  if (isAM && hr === 12) hr = 0;
  return { hour: hr, minute: min };
}

function getSpecialization(name, role) {
  if (role === 'Dentist') {
    if (name.includes('Smith')) return 'Orthodontist';
    if (name.includes('John')) return 'Dentist';
    if (name.includes('Alex')) return 'Pedodontist';
    return 'General Dentist';
  }
  if (role === 'Hygienist') return 'Dental Hygienist';
  if (role === 'Assistant') return 'Dental Assistant';
  return role;
}

// ─── MINI CALENDAR COMPONENT ─────────────────────────────────────────────────
function MiniCalendar({ selectedDateString, onChange }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date((selectedDateString || new Date().toISOString().split('T')[0]) + 'T00:00:00');
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    const startDay = date.getDay();
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i);
      days.push({ date: d, isCurrentMonth: false });
    }
    
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }
    
    return days;
  }, [currentMonth]);

  const monthYearLabel = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm text-left">
      <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
        <h4 className="text-xs font-extrabold text-foreground">{monthYearLabel}</h4>
        <div className="flex items-center gap-1">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleNextMonth} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <span key={d} className="text-[9px] font-black text-muted-foreground/60 uppercase">{d}</span>
        ))}
        {daysInMonth.map(({ date, isCurrentMonth }, idx) => {
          const dateStr = date.toISOString().split('T')[0];
          const isSelected = dateStr === selectedDateString;
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          return (
            <button
              key={idx}
              onClick={() => onChange(dateStr)}
              className={`text-[10px] font-bold h-6 w-6 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-all ${
                isSelected ? 'bg-primary text-white font-extrabold shadow-sm' :
                isToday ? 'border border-primary text-primary font-bold' :
                isCurrentMonth ? 'text-foreground hover:bg-muted font-semibold' : 'text-muted-foreground/45 hover:bg-muted/5'
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── ENTERPRISE MULTI-PROVIDER CALENDAR ──────────────────────────────────────
function MultiProviderCalendar({
  selectedDateString, filteredAppointments,
  dentistList, hygienistList, assistantList,
  role, canBook, savingId,
  handleStatusAdvance, handleOpenEdit, handleDelete,
  handleOpenWorkspace, handleOpenReApt, loading,
  dentistFilter, setDentistFilter, handleOpenBooking,
  setFormPatientName, setFormPatientId, setFormDate, setFormTime,
  setFormTreatment, setFormNotes, setFormAssignedTo, setFormAssistantId,
  setFormHygienistId, setFormDentistId, setFormDentistName, setEditingApt,
  setIsBookModalOpen
}) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isToday = selectedDateString === todayStr;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const providers = useMemo(() => {
    return [
      ...dentistList.map(d  => ({ id: d.id,  name: d.name,  role: 'Dentist',    initial: (d.name || 'D').replace('Dr. ', '').charAt(0).toUpperCase() })),
      ...hygienistList.map(h => ({ id: h.id,  name: h.name,  role: 'Hygienist',  initial: (h.name || 'H').replace('Dr. ', '').charAt(0).toUpperCase() })),
      ...assistantList.map(a => ({ id: a.id,  name: a.name,  role: 'Assistant',  initial: (a.name || 'A').replace('Dr. ', '').charAt(0).toUpperCase() })),
    ];
  }, [dentistList, hygienistList, assistantList]);

  const showGeneric = providers.length === 0;
  const columns = useMemo(() => {
    return showGeneric
      ? [{ id: 'all', name: 'All Providers', role: 'Clinic', initial: '🏥' }]
      : providers;
  }, [providers, showGeneric]);

  const activeColumns = useMemo(() => {
    if (dentistFilter === 'ALL') return columns;
    return columns.filter(c => c.id === dentistFilter);
  }, [columns, dentistFilter]);

  function getAptsForCell(providerId, hour, slotMinute) {
    return filteredAppointments.filter(apt => {
      const time = parseApptTime(apt.time);
      if (!time) return false;
      if (time.hour !== hour) return false;
      if (slotMinute === 0 && time.minute >= 30) return false;
      if (slotMinute === 30 && time.minute < 30) return false;
      if (showGeneric) return true;
      const ids = [apt.assignedDoctorId, apt.dentistId, apt.assignedHygienistId, apt.assignedAssistantId];
      return ids.includes(providerId);
    });
  }

  const handleCellClick = (prov, slot) => {
    if (!canBook) return;
    setFormPatientName('');
    setFormPatientId('');
    setFormDate(selectedDateString);
    setFormTreatment('');
    setFormNotes('');
    
    if (prov.role === 'Dentist') {
      setFormDentistId(prov.id);
      setFormDentistName(prov.name);
      const doc = dentistList.find(d => d.id === prov.id);
      if (doc) {
        if (doc.assistantId) setFormAssistantId(doc.assistantId);
        if (doc.hygienistId) setFormHygienistId(doc.hygienistId);
      }
    } else if (prov.role === 'Hygienist') {
      setFormHygienistId(prov.id);
    } else if (prov.role === 'Assistant') {
      setFormAssistantId(prov.id);
    }
    
    const formattedHour = String(slot.hour).padStart(2, '0');
    const formattedMinute = String(slot.minute).padStart(2, '0');
    setFormTime(`${formattedHour}:${formattedMinute}`);
    
    setEditingApt(null);
    setIsBookModalOpen(true);
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-auto relative rounded-2xl bg-card">
      {/* Sticky Left Time column */}
      <div className="sticky left-0 z-30 flex-shrink-0 w-[76px] border-r border-border bg-card/95 backdrop-blur-sm select-none shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
        <div className="h-14 border-b border-border flex items-center justify-center bg-card sticky top-0 z-40">
          <Clock className="h-4 w-4 text-muted-foreground opacity-60" />
        </div>
        {CAL_SLOTS.map(slot => {
          const isCurrentSlot = isToday && currentHour === slot.hour && Math.abs(currentMinute - slot.minute) < 15;
          return (
            <div key={slot.key} className="min-h-[145px] border-b border-border/40 flex flex-col items-center justify-center bg-card/60 p-2">
              <span className={`text-xs font-black leading-none ${isCurrentSlot ? 'text-primary' : 'text-muted-foreground/80'}`}>
                {slot.label.split(' ')[0]}
              </span>
              <span className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-wider mt-1 leading-none">
                {slot.label.split(' ')[1]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Provider Columns grid */}
      <div className="flex flex-1 min-h-0 overflow-x-auto">
        {activeColumns.map((prov, ci) => (
          <div
            key={prov.id}
            className={`flex-1 min-w-[280px] max-w-[380px] relative flex flex-col ${
              ci < activeColumns.length - 1 ? 'border-r border-border/60' : ''
            }`}
          >
            {/* Sticky Provider header */}
            <div className="h-14 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-30 flex items-center gap-2.5 px-3 flex-shrink-0 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center font-black text-xs text-primary flex-shrink-0">
                {prov.initial}
              </div>
              <div className="overflow-hidden min-w-0 text-left">
                <p className="text-xs font-black text-foreground truncate leading-tight">{prov.name}</p>
                <p className="text-[9px] font-bold text-muted-foreground/80 truncate mt-0.5">{getSpecialization(prov.name, prov.role)}</p>
              </div>
            </div>

            {/* Hour Rows */}
            {CAL_SLOTS.map(slot => {
              const apts = getAptsForCell(prov.id, slot.hour, slot.minute);
              const isCurrentSlot = isToday && currentHour === slot.hour && currentMinute >= slot.minute && currentMinute < slot.minute + 30;

              return (
                <div
                  key={slot.key}
                  onClick={() => apts.length === 0 && handleCellClick(prov, slot)}
                  className={`min-h-[145px] border-b border-border/30 relative p-2.5 transition-colors ${
                    apts.length === 0 && canBook ? 'cursor-pointer hover:bg-muted/10' : ''
                  } ${isCurrentSlot ? 'bg-primary/5' : ''}`}
                >
                  {/* Current Time Horizontal Line */}
                  {isCurrentSlot && (
                    <div
                      className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                      style={{ top: `${((currentMinute % 30) / 30) * 100}%` }}
                    >
                      <div className="h-2.5 w-2.5 rounded-full bg-primary -ml-1 flex-shrink-0 shadow-sm" />
                      <div className="flex-1 h-[2px] bg-primary" />
                    </div>
                  )}

                  {apts.length > 0 ? (
                    <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1 select-none">
                      {apts.map(apt => {
                        const colors = getTypeColors(apt.type);
                        const stage = apt.workflowStage || 'SCHEDULED';
                        const flow = WORKFLOW_STAGE_FLOW[stage] || WORKFLOW_STAGE_FLOW.SCHEDULED;
                        const saving = savingId === apt.id;
                        const allowed = ROLE_ALLOWED_STAGE_TRANSITIONS[role] || [];
                        const canAdv = flow.next && (allowed.includes(flow.next) || ['clinic_owner', 'super_admin'].includes(role));
                        const isWS = ['dental_assistant', 'assistant', 'dentist', 'hygienist'].includes(role);

                        return (
                          <div
                            key={apt.id}
                            className={`group rounded-xl border text-left text-xs transition-all hover:shadow-lg cursor-pointer p-3 flex flex-col justify-between shrink-0 min-h-[115px] shadow-xs ${colors.bg} ${colors.border}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isWS) handleOpenWorkspace(apt.patientId, apt.id);
                            }}
                          >
                            {/* Card Header: Type Badge & Time Pill */}
                            <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-border/25">
                              <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 px-2 py-0.5 rounded-md ${colors.header} bg-background/70 border border-border/30`}>
                                <span>{colors.icon}</span>
                                <span className="truncate">{apt.type || 'Appointment'}</span>
                              </span>

                              <span className="text-[9.5px] font-black text-muted-foreground bg-background/90 px-2 py-0.5 rounded-md border border-border/40 flex items-center gap-1 shadow-2xs">
                                <Clock className="h-2.5 w-2.5 text-primary shrink-0" />
                                {apt.time}
                              </span>
                            </div>

                            {/* Card Body: Patient Name & Notes */}
                            <div className="py-2 space-y-1">
                              <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="truncate">{apt.patientName}</span>
                              </p>

                              {apt.notes && (
                                <p className="text-[10px] text-muted-foreground/90 font-semibold leading-snug bg-background/40 p-1.5 rounded-md border border-border/30">
                                  {apt.notes}
                                </p>
                              )}

                              {apt.dentistName && (
                                <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                                  👨‍⚕️ {apt.dentistName}
                                </p>
                              )}
                            </div>

                            {/* Card Footer: Workflow Stage & Actions */}
                            <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-1 flex-wrap">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                stage === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                                stage === 'CHECKED_IN' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                                stage === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30' :
                                'bg-blue-500/10 text-blue-600 border-blue-500/30'
                              }`}>
                                {WORKFLOW_STAGE_LABELS[stage] || stage}
                              </span>

                              <div className="flex items-center gap-1">
                                {canAdv && (
                                  <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); handleStatusAdvance(apt); }}
                                    disabled={saving}
                                    className="px-2 py-1 rounded-md bg-primary text-white text-[9.5px] font-black hover:bg-primary/90 transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95 disabled:opacity-50"
                                    title={`Advance to ${flow.label}`}
                                  >
                                    {flow.label} ➔
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); handleOpenEdit(apt); }}
                                  className="p-1 rounded-md bg-background border border-border text-[9px] font-bold text-foreground hover:bg-muted transition-all cursor-pointer"
                                  title="Edit Appointment"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); handleDelete(apt.id, apt.patientName); }}
                                  disabled={saving}
                                  className="p-1 rounded-md bg-background border border-border text-[9px] font-bold text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                                  title="Cancel Appointment"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-[9.5px] font-extrabold text-primary uppercase tracking-widest">+ Book Slot</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
