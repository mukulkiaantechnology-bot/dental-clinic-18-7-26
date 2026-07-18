import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Sparkles,
  AlertTriangle, Edit2, Trash2, Loader2, RefreshCw, ChevronRight, ChevronLeft, Search, User, RotateCcw, Clock
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
// Maps backend `workflowStage` → { nextStage (sent to API), label, badge color }

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


// Who can advance which workflowStages
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
  const predictNoShow = useAISchedulingStore((state) => state.predictNoShow);
  const suggestPatients = useAISchedulingStore((state) => state.suggestPatients);

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState(null);
  const [selectedDateString, setSelectedDateString] = useState(new Date().toISOString().split('T')[0]);
  const [savingId, setSavingId] = useState(null); // which appointment is being updated
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dentistFilter, setDentistFilter] = useState('ALL');

  // Re-appointment state (for front_desk role)
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

  // Dropdown option lists from backend
  const [allPatients, setAllPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [dentistList, setDentistList] = useState([]);
  const [assistantList, setAssistantList] = useState([]);
  const [hygienistList, setHygienistList] = useState([]);


  // ─── SCHEDULER DAYS ──────────────────────────────────────────────────────
  const schedulerDays = useMemo(() => {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        offset: i,
        dayName: weekdays[date.getDay()],
        dateString: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        label: i === 0 ? 'Today' : weekdays[date.getDay()],
      });
    }
    return days;
  }, []);

  const displayDateStr = useMemo(() => {
    try {
      const d = new Date(selectedDateString + 'T00:00:00');
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (_) {
      return selectedDateString;
    }
  }, [selectedDateString]);

  // ─── FETCH ON DAY CHANGE ─────────────────────────────────────────────────
  const load = useCallback(() => {
    fetchAppointments(selectedDateString);
  }, [fetchAppointments, selectedDateString]);

  useEffect(() => {
    load();
  }, [load]);


  // Fetch patients, dentists, assistants, and hygienists on mount
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


  // ─── FILTERED APPOINTMENTS ───────────────────────────────────────────────
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // Date filter
      if (appt.date !== selectedDateString) return false;

      // Search term filter
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const patientMatch = appt.patientName?.toLowerCase().includes(term);
        const typeMatch = appt.type?.toLowerCase().includes(term);
        const dentistMatch = appt.dentistName?.toLowerCase().includes(term);
        const notesMatch = appt.notes?.toLowerCase().includes(term);
        const statusMatch = appt.workflowStage?.toLowerCase().includes(term);
        if (!patientMatch && !typeMatch && !dentistMatch && !notesMatch && !statusMatch) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL') {
        if (appt.workflowStage !== statusFilter) return false;
      }

      // Dentist Filter
      if (dentistFilter !== 'ALL') {
        const docId = appt.assignedDoctorId || appt.dentistId;
        if (docId !== dentistFilter) return false;
      }

      return true;
    });
  }, [appointments, selectedDateString, searchTerm, statusFilter, dentistFilter]);

  // ─── HANDLERS ────────────────────────────────────────────────────────────
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
    // Try to match dentist from list
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
    // 1. Determine treatment price based on type
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

    // Trigger Invoice Creation
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

    // 2. Check if treatment is lab-related (Crown, Implant, Bridge)
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
    // Prefer workflowStage (new system), fallback to legacy status
    const currentStage = apt.workflowStage || 'SCHEDULED';
    const stageFlow = WORKFLOW_STAGE_FLOW[currentStage];

    if (!stageFlow?.next) return;

    // Check if this role can perform this stage transition
    const allowedStages = ROLE_ALLOWED_STAGE_TRANSITIONS[role] || [];
    if (!allowedStages.includes(stageFlow.next) &&
        !['clinic_owner', 'super_admin'].includes(role)) {
      toast.warning(
        `Your role (${role}) cannot advance to "${stageFlow.next}".`,
        'Restricted'
      );
      return;
    }

    // Start Treatment → patient goes directly to Assistant (skip dentist assignment modal)
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
    // Use the new /stage endpoint with workflowStage values
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

    // Assign hygienist
    const assignResult = await assignHygienist(transitionApt.id, selectedHygienistId);
    if (!assignResult.success) {
      toast.error(assignResult.error || 'Failed to assign hygienist');
      setSavingId(null);
      return;
    }

    // Advance to cleaning pending
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

  // ─── RE-APPOINTMENT HANDLER (Front Desk) ─────────────────────────────────
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

  const handleAISuggest = (slotLabel, suggestedData) => {
    if (!canBook) {
      toast.warning('Booking is restricted for your role.', 'Restricted Action');
      return;
    }
    
    // Auto-match patient from list
    const matchedPatient = allPatients.find(
      (p) => p.name.toLowerCase() === (suggestedData.name || '').toLowerCase()
    );
    if (matchedPatient) {
      setFormPatientId(matchedPatient.id);
      setFormPatientName(matchedPatient.name);
    } else {
      setFormPatientId('');
      setFormPatientName('');
    }
    
    setFormDentistId('');
    setFormDentistName('');
    setFormTime(slotLabel);
    setFormDate(selectedDateString);
    setFormTreatment(suggestedData.treatment === 'Teeth Cleaning' ? 'Cleaning' : 'Crown');
    setFormNotes(`AI Auto Fill: ${suggestedData.reason}`);
    setFormAssignedTo('dentist');
    setFormAssistantId('');
    setFormHygienistId('');
    setEditingApt(null);
    setIsBookModalOpen(true);
    toast.success(`Populated scheduling details for ${suggestedData.name}!`);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 11; hour++) {
      for (let min of ['00', '15', '30', '45']) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min} AM`;
        options.push(timeStr);
      }
    }
    for (let min of ['00', '15', '30', '45']) {
      options.push(`12:${min} PM`);
    }
    for (let hour = 1; hour <= 7; hour++) {
      for (let min of ['00', '15', '30', '45']) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min} PM`;
        options.push(timeStr);
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

  // ─── SLOT GRID ────────────────────────────────────────────────────────────
  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 w-full text-left animate-fade-in h-[calc(100vh-190px)] overflow-hidden pb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary fill-primary/10 animate-pulse" />
            Appointment Calendar
          </h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            Multi-provider daily scheduler with color-coded appointment types.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Refresh appointments"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canBook && (
            <Button
              onClick={handleOpenBooking}
              className="gap-2 select-none cursor-pointer bg-primary hover:bg-primary/90 text-white font-bold"
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
          <span>Hygienist Mode: You can view appointments and update status to In_Progress / Ready_For_Doctor. Booking is restricted.</span>
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



      {/* ─── Multi-Provider Calendar Grid ─── */}
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
      />

      {/* Booking / Edit Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={handleCloseModal}
        title={editingApt ? 'Edit Appointment Details' : 'Book New Appointment'}
      >
        <form onSubmit={handleSubmitBooking} className="space-y-4 text-xs font-semibold text-left">

          {/* ── Patient Dropdown Select ─────────────────────────── */}
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

          {/* ── Attending Dentist — Backend driven ──────────────────── */}
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
                  
                  // Auto-select assistant and hygienist if dentist has them assigned
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

          {/* ── Assistant & Hygienist Fields ───────────────────────── */}
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

      {/* ─── RE-APPOINTMENT MODAL ─── */}
      <Modal
        isOpen={isReAptOpen}
        onClose={() => setIsReAptOpen(false)}
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
              <p className="text-xs font-extrabold text-foreground">{reAptSource?.patientName}</p>
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
  'Emergency':    { bg: 'bg-rose-50 dark:bg-rose-500/10',      border: 'border-l-4 border-rose-400',    text: 'text-rose-700 dark:text-rose-300',   header: 'text-rose-600 dark:text-rose-400',  icon: '🚨' },
  'New Patient':  { bg: 'bg-sky-50 dark:bg-sky-500/10',        border: 'border-l-4 border-sky-400',      text: 'text-sky-700 dark:text-sky-300',     header: 'text-sky-600 dark:text-sky-400',    icon: '👤' },
  'Restorative':  { bg: 'bg-violet-50 dark:bg-violet-500/10',  border: 'border-l-4 border-violet-400',   text: 'text-violet-700 dark:text-violet-300',header: 'text-violet-600 dark:text-violet-400',icon: '🦷' },
  'Delivery':     { bg: 'bg-orange-50 dark:bg-orange-500/10',  border: 'border-l-4 border-orange-400',   text: 'text-orange-700 dark:text-orange-300',header: 'text-orange-600 dark:text-orange-400',icon: '📦' },
  'Hygiene':      { bg: 'bg-emerald-50 dark:bg-emerald-500/10',border: 'border-l-4 border-emerald-400',  text: 'text-emerald-700 dark:text-emerald-300',header:'text-emerald-600 dark:text-emerald-400',icon:'✨' },
  'Perio':        { bg: 'bg-teal-50 dark:bg-teal-500/10',      border: 'border-l-4 border-teal-400',     text: 'text-teal-700 dark:text-teal-300',   header: 'text-teal-600 dark:text-teal-400',  icon: '🔬' },
  'Cleaning':     { bg: 'bg-emerald-50 dark:bg-emerald-500/10',border: 'border-l-4 border-emerald-400',  text: 'text-emerald-700 dark:text-emerald-300',header:'text-emerald-600 dark:text-emerald-400',icon:'✨' },
  'Crown':        { bg: 'bg-violet-50 dark:bg-violet-500/10',  border: 'border-l-4 border-violet-400',   text: 'text-violet-700 dark:text-violet-300',header: 'text-violet-600 dark:text-violet-400',icon: '👑' },
  'Root Canal':   { bg: 'bg-red-50 dark:bg-red-500/10',        border: 'border-l-4 border-red-400',      text: 'text-red-700 dark:text-red-300',     header: 'text-red-600 dark:text-red-400',    icon: '🦷' },
  'Implant':      { bg: 'bg-indigo-50 dark:bg-indigo-500/10',  border: 'border-l-4 border-indigo-400',   text: 'text-indigo-700 dark:text-indigo-300',header: 'text-indigo-600 dark:text-indigo-400',icon:'🔩' },
  'Consultation': { bg: 'bg-blue-50 dark:bg-blue-500/10',      border: 'border-l-4 border-blue-400',     text: 'text-blue-700 dark:text-blue-300',   header: 'text-blue-600 dark:text-blue-400',  icon: '💬' },
  'Filling':      { bg: 'bg-amber-50 dark:bg-amber-500/10',    border: 'border-l-4 border-amber-400',    text: 'text-amber-700 dark:text-amber-300', header: 'text-amber-600 dark:text-amber-400', icon: '🦷' },
  'default':      { bg: 'bg-slate-50 dark:bg-slate-500/10',    border: 'border-l-4 border-slate-400',    text: 'text-slate-700 dark:text-slate-300', header: 'text-slate-600 dark:text-slate-400', icon: '📋' },
};

function getTypeColors(type) {
  if (!type) return APPT_TYPE_COLORS.default;
  const key = Object.keys(APPT_TYPE_COLORS).find(k => k !== 'default' && type.toLowerCase().includes(k.toLowerCase()));
  return APPT_TYPE_COLORS[key] || APPT_TYPE_COLORS.default;
}

const CAL_HOURS = [
  { label: '8:00 AM', hour: 8 },  { label: '9:00 AM', hour: 9 },
  { label: '10:00 AM', hour: 10 },{ label: '11:00 AM', hour: 11 },
  { label: '12:00 PM', hour: 12 },{ label: '1:00 PM', hour: 13 },
  { label: '2:00 PM', hour: 14 }, { label: '3:00 PM', hour: 15 },
  { label: '4:00 PM', hour: 16 }, { label: '5:00 PM', hour: 17 },
];

function parseApptHour(timeStr) {
  if (!timeStr) return null;
  const t = String(timeStr).replace('.', ':');
  const parts = t.split(':');
  if (parts.length < 2) return null;
  let hr = parseInt(parts[0], 10);
  const isPM = t.toLowerCase().includes('pm');
  const isAM = t.toLowerCase().includes('am');
  if (isPM && hr < 12) hr += 12;
  if (isAM && hr === 12) hr = 0;
  return hr;
}

function MultiProviderCalendar({
  selectedDateString, filteredAppointments,
  dentistList, hygienistList, assistantList,
  role, canBook, savingId,
  handleStatusAdvance, handleOpenEdit, handleDelete,
  handleOpenWorkspace, handleOpenReApt, loading,
}) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isToday = selectedDateString === todayStr;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Build provider columns from all staff lists
  const providers = [
    ...dentistList.map(d  => ({ id: d.id,  name: d.name,  role: 'Dentist',    initial: (d.name || 'D').charAt(0).toUpperCase() })),
    ...hygienistList.map(h => ({ id: h.id,  name: h.name,  role: 'Hygienist',  initial: (h.name || 'H').charAt(0).toUpperCase() })),
    ...assistantList.map(a => ({ id: a.id,  name: a.name,  role: 'Assistant',  initial: (a.name || 'A').charAt(0).toUpperCase() })),
  ];
  const showGeneric = providers.length === 0;
  const columns = showGeneric
    ? [{ id: 'all', name: 'All Providers', role: 'Clinic', initial: '🏥' }]
    : providers;

  function getAptsForCell(providerId, hour) {
    return filteredAppointments.filter(apt => {
      if (parseApptHour(apt.time) !== hour) return false;
      if (showGeneric) return true;
      const ids = [apt.assignedDoctorId, apt.dentistId, apt.assignedHygienistId, apt.assignedAssistantId];
      return ids.includes(providerId);
    });
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* ── Legend bar ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-2.5 border-b border-border bg-muted/30 flex-shrink-0">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Types:</span>
        {[
          ['Emergency',    'bg-rose-500'],
          ['New Patient',  'bg-sky-500'],
          ['Restorative',  'bg-violet-500'],
          ['Delivery',     'bg-orange-500'],
          ['Hygiene',      'bg-emerald-500'],
          ['Perio',        'bg-teal-500'],
          ['Consultation', 'bg-blue-500'],
          ['Filling',      'bg-amber-500'],
        ].map(([lbl, clr]) => (
          <span key={lbl} className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground">
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${clr}`} />
            {lbl}
          </span>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
          <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-lg">
            {filteredAppointments.length} appt{filteredAppointments.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex flex-1 min-h-0 overflow-auto">

        {/* Time-of-day column */}
        <div className="flex-shrink-0 w-[72px] border-r border-border bg-muted/20 select-none">
          <div className="h-[56px] border-b border-border flex items-center justify-center">
            <Clock className="h-4 w-4 text-muted-foreground opacity-50" />
          </div>
          {CAL_HOURS.map(slot => (
            <div key={slot.hour} className="h-[96px] border-b border-border/40 flex items-start justify-end px-2 pt-2">
              <span className={`text-[10px] font-bold leading-none ${isToday && currentHour === slot.hour ? 'text-rose-500' : 'text-muted-foreground/70'}`}>
                {slot.label}
              </span>
            </div>
          ))}
        </div>

        {/* Provider columns */}
        <div className="flex flex-1 overflow-x-auto">
          {columns.map((prov, ci) => (
            <div
              key={prov.id}
              className={`flex-1 min-w-[175px] max-w-[280px] ${ci < columns.length - 1 ? 'border-r border-border' : ''}`}
            >
              {/* Provider header */}
              <div className="h-[56px] border-b border-border bg-card/80 sticky top-0 z-10 flex items-center gap-2 px-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center font-black text-xs text-primary flex-shrink-0">
                  {prov.initial}
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-[11px] font-extrabold text-foreground truncate leading-tight">{prov.name}</p>
                  <p className="text-[9px] font-semibold text-muted-foreground">{prov.role}</p>
                </div>
              </div>

              {/* Hour rows */}
              {CAL_HOURS.map(slot => {
                const apts = getAptsForCell(prov.id, slot.hour);
                const isCurrentHour = isToday && currentHour === slot.hour;

                return (
                  <div
                    key={slot.hour}
                    className={`h-[96px] border-b border-border/30 relative px-1 py-1 overflow-y-auto ${isCurrentHour ? 'bg-rose-50/30 dark:bg-rose-500/5' : 'hover:bg-muted/10'} transition-colors`}
                  >
                    {/* Red "now" line */}
                    {isCurrentHour && (
                      <div
                        className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                        style={{ top: `${(currentMinute / 60) * 100}%` }}
                      >
                        <div className="h-2 w-2 rounded-full bg-rose-500 -ml-0.5 flex-shrink-0 shadow-sm" />
                        <div className="flex-1 h-px bg-rose-500/60" />
                      </div>
                    )}

                    {apts.length > 0 ? (
                      <div className="space-y-1">
                        {apts.map(apt => {
                          const colors  = getTypeColors(apt.type);
                          const stage   = apt.workflowStage || 'SCHEDULED';
                          const flow    = WORKFLOW_STAGE_FLOW[stage] || WORKFLOW_STAGE_FLOW.SCHEDULED;
                          const saving  = savingId === apt.id;
                          const allowed = ROLE_ALLOWED_STAGE_TRANSITIONS[role] || [];
                          const canAdv  = flow.next && (allowed.includes(flow.next) || ['clinic_owner', 'super_admin'].includes(role));
                          const isWS    = ['dental_assistant', 'assistant', 'dentist', 'hygienist'].includes(role);

                          return (
                            <div
                              key={apt.id}
                              className={`group rounded-md border text-left text-xs transition-all hover:shadow-md cursor-pointer overflow-hidden ${colors.bg} ${colors.border}`}
                              onClick={() => isWS && handleOpenWorkspace(apt.patientId, apt.id)}
                            >
                              {/* Card header */}
                              <div className="px-2 py-1.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-[10px] font-black leading-tight flex items-center gap-1 truncate ${colors.header}`}>
                                    <span className="text-[11px]">{colors.icon}</span>
                                    <span className="truncate">{apt.type || 'Appointment'}</span>
                                  </span>
                                  <span className="text-[8px] font-bold text-muted-foreground flex-shrink-0">{apt.time}</span>
                                </div>
                                <p className={`text-[10px] font-extrabold mt-0.5 truncate ${colors.text}`}>{apt.patientName}</p>
                                {apt.notes && (
                                  <p className="text-[8px] text-muted-foreground font-medium truncate mt-0.5">{apt.notes}</p>
                                )}
                              </div>

                              {/* Action strip — shown on hover */}
                              <div className="px-2 pb-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                                {canAdv && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleStatusAdvance(apt); }}
                                    disabled={saving}
                                    className="flex items-center gap-0.5 text-[7.5px] font-black uppercase bg-white/70 dark:bg-black/25 border border-current/20 px-1.5 py-0.5 rounded hover:bg-primary hover:text-white hover:border-primary transition-colors cursor-pointer disabled:opacity-50"
                                    title={flow.label}
                                  >
                                    {saving ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <ChevronRight className="h-2.5 w-2.5" />}
                                    {flow.label}
                                  </button>
                                )}
                                {canBook && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleOpenEdit(apt); }}
                                    className="p-0.5 rounded bg-white/60 dark:bg-black/20 hover:bg-primary hover:text-white transition-colors cursor-pointer"
                                    title="Edit"
                                  ><Edit2 className="h-2.5 w-2.5" /></button>
                                )}
                                {['super_admin', 'clinic_owner', 'front_desk', 'frontdesk'].includes(role) && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleDelete(apt.id, apt.patientName); }}
                                    disabled={saving}
                                    className="p-0.5 rounded bg-white/60 dark:bg-black/20 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                                    title="Cancel"
                                  ><Trash2 className="h-2.5 w-2.5" /></button>
                                )}
                                {(role === 'front_desk' || role === 'frontdesk') && stage === 'COMPLETED' && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleOpenReApt(apt); }}
                                    className="flex items-center gap-0.5 text-[7px] font-black uppercase bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30 px-1.5 py-0.5 rounded hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                                  ><RotateCcw className="h-2 w-2" />Re-Book</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center pointer-events-none">
                        <span className="text-[8px] text-muted-foreground/30 italic select-none">—</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
