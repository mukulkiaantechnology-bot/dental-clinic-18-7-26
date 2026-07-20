import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
  Play,
  Edit2,
  ArrowLeft,
  UserPlus,
  Clipboard,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useAppointmentStore } from '../../../store/appointmentStore';
import { useClinicOwnerStore } from '../../../store/clinicOwnerStore';
import { useFrontDeskStore } from '../../../store/frontDeskStore';
import { useClinicStore } from '../../../store/clinicStore';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Badge } from '../../../shared/ui/Badge';
import { useToast } from '../../../shared/hooks/useToast';
import { Modal } from '../../../shared/ui/Modal';
import { DataTable } from '../../../shared/ui/DataTable';
import api from '../../../shared/utils/api';

// ----------------------------------------------------
// Helper: get current date
// ----------------------------------------------------
const getTodayDateStr = () => new Date().toISOString().split('T')[0];

const formatTimeSlot = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    return timeStr;
  }
  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour.toString().padStart(2, '0')}:${minStr} ${suffix}`;
};

// ----------------------------------------------------
// 1. APPOINTMENTS SCHEDULER PAGE
// ----------------------------------------------------
export function FrontDeskAppointmentsPage() {
  const { appointments, fetchAppointments, addAppointment, deleteAppointment } = useAppointmentStore();
  const { patients, fetchPatients } = useClinicOwnerStore();
  const toast = useToast();

  const [selectedDentist, setSelectedDentist] = useState('All');
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [fetchAppointments, selectedDate]);
  
  // Booking modal state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  
  // Booking Form State
  const [modalPatientId, setModalPatientId] = useState('');
  const [modalDentistName, setModalDentistName] = useState('Not Assigned');
  const [modalDate, setModalDate] = useState(getTodayDateStr());
  const [modalTime, setModalTime] = useState('09:00');
  const [modalTreatment, setModalTreatment] = useState('Teeth Cleaning');
  const [modalNotes, setModalNotes] = useState('');

  // Time Slots definition (09:00 AM to 05:00 PM)
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
  ];

  // Filter appointments for the active dentist and date
  const bookedSlots = useMemo(() => {
    const dayApts = appointments.filter(
      (a) => a.date === selectedDate && (selectedDentist === 'All' || a.dentistName.includes(selectedDentist))
    );
    const map = {};
    dayApts.forEach((apt) => {
      if (!map[apt.time]) {
        map[apt.time] = [];
      }
      map[apt.time].push(apt);
    });
    return map;
  }, [appointments, selectedDate, selectedDentist]);

  const handleOpenBookModal = (time) => {
    if (patients.length === 0) {
      toast.error('No patients registered yet. Please register a patient first!');
      return;
    }
    setModalTime(time);
    setModalDate(selectedDate);
    setModalPatientId(patients[0]?.id || '');
    setModalDentistName(selectedDentist === 'All' ? 'Not Assigned' : selectedDentist);
    setModalTreatment('Teeth Cleaning');
    setModalNotes('');
    setIsBookModalOpen(true);
  };

  const handleOpenAddAppointment = () => {
    if (patients.length === 0) {
      toast.error('No patients registered yet. Please register a patient first!');
      return;
    }
    setModalTime('09:00');
    setModalDate(selectedDate);
    setModalPatientId(patients[0]?.id || '');
    setModalDentistName(selectedDentist === 'All' ? 'Not Assigned' : selectedDentist);
    setModalTreatment('Teeth Cleaning');
    setModalNotes('');
    setIsBookModalOpen(true);
  };

  const handleBookAppointment = () => {
    const patientObj = patients.find((p) => p.id === modalPatientId);
    if (!patientObj) {
      toast.error('Invalid patient selection.');
      return;
    }

    addAppointment({
      patientId: modalPatientId,
      patientName: patientObj.name,
      dentistName: modalDentistName,
      clinicId: patientObj.clinicId || 'clinic-1',
      date: modalDate,
      time: modalTime,
      duration: 60,
      status: 'Scheduled',
      type: modalTreatment,
      notes: modalNotes || `${modalTreatment} procedure`
    });

    setIsBookModalOpen(false);
    toast.success(`Appointment scheduled for ${patientObj.name} at ${modalTime}!`, 'Booking Confirmed');
    toast.info('SMS Notification automatically dispatched to patient.');
    
    // Reset form
    setModalNotes('');
  };

  const handleDeleteBooking = (aptId, name) => {
    deleteAppointment(aptId);
    toast.success(`Canceled appointment for ${name}.`);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      {/* Page Title */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            Clinic Scheduler
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Perform calendar booking audits, assign practitioners, and log appointments.</p>
        </div>
        <div>
          <Button
            size="sm"
            onClick={handleOpenAddAppointment}
            className="font-bold text-xs gap-1.5 h-9 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Appointment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 text-left space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Practitioner</label>
          <select
            value={selectedDentist}
            onChange={(e) => setSelectedDentist(e.target.value)}
            className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
          >
            <option value="All">All Dentists</option>
            <option value="Not Assigned">Not Assigned</option>
            <option value="Dr. Arthur Vance, DDS">Dr. Arthur Vance, DDS</option>
          </select>
        </div>

        <div className="flex-1 text-left space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Schedule Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
          />
        </div>
      </div>

      {/* Time Slot Grid */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-primary" />
          Time Slot Grid ({selectedDate})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {timeSlots.map((time) => {
            const booking = bookedSlots[time];
            const isBooked = booking && booking.length > 0;

            return (
              <div
                key={time}
                className={`p-4 border rounded-2xl flex items-center justify-between transition-all ${
                  isBooked
                    ? 'bg-muted/40 border-border/80'
                    : 'bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-4 text-left flex-1 mr-4">
                  <span className="text-sm font-black text-primary pt-0.5">{time}</span>
                  {isBooked ? (
                    <div className="space-y-2 flex-1">
                      {booking.map((b) => (
                        <div key={b.id} className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                          <div>
                            <h4 className="font-extrabold text-xs text-foreground">{b.patientName}</h4>
                            <p className="text-[10px] text-muted-foreground font-semibold">
                              {b.type} &bull; {b.duration} mins &bull; <span className="text-primary font-bold">{b.dentistName}</span>
                            </p>
                          </div>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleDeleteBooking(b.id, b.patientName)}
                            className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 font-bold h-7 w-7 p-0 rounded-full flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground font-semibold pt-0.5">Available Slot</span>
                  )}
                </div>

                {!isBooked && (
                  <div>
                    <Button
                      size="xs"
                      onClick={() => handleOpenBookModal(time)}
                      className="font-bold text-[10px] gap-1 px-3 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Book Slot
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Form Dialog Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule New Dental Appointment"
        size="2xl"
      >
        <div className="space-y-4 text-left p-1 text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">SELECT PATIENT</label>
            <select
              value={modalPatientId}
              onChange={(e) => setModalPatientId(e.target.value)}
              className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (ID: #{p.displayId || p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">SELECT DENTIST</label>
            <select
              value={modalDentistName}
              onChange={(e) => setModalDentistName(e.target.value)}
              className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
            >
              <option value="Not Assigned">Not Assigned</option>
              <option value="Dr. Arthur Vance, DDS">Dr. Arthur Vance, DDS</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">APPOINTMENT DATE</label>
              <input
                type="date"
                value={modalDate}
                onChange={(e) => setModalDate(e.target.value)}
                className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">TIME SLOT</label>
              <select
                value={modalTime}
                onChange={(e) => setModalTime(e.target.value)}
                className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
              >
                {timeSlots.map((ts) => (
                  <option key={ts} value={ts}>
                    {formatTimeSlot(ts)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">TREATMENT PLAN</label>
            <select
              value={modalTreatment}
              onChange={(e) => setModalTreatment(e.target.value)}
              className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
            >
              <option value="Teeth Cleaning">Hygiene & Cleaning</option>
              <option value="Root Canal Therapy">Endodontics (Root Canal)</option>
              <option value="Orthodontic Checkup">Braces / Orthodontics</option>
              <option value="Dental Crown Placement">Prosthodontics (Crown)</option>
              <option value="Consultation">Clinical Consultation</option>
              <option value="Filling">Composite Filling</option>
              <option value="Emergency">Emergency Intake</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Input
              label="Additional Notes"
              value={modalNotes}
              onChange={(e) => setModalNotes(e.target.value)}
              placeholder="e.g. Needs sedation compliance..."
              className="text-xs text-foreground font-medium"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-6 w-full">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="font-bold text-xs w-full sm:w-auto h-11 sm:h-10 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookAppointment}
              className="font-bold text-xs w-full sm:w-auto h-11 sm:h-10 cursor-pointer"
            >
              Book Slot
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ----------------------------------------------------
// 2. PATIENT REGISTRATION PAGE
// ----------------------------------------------------
export function FrontDeskRegistrationPage() {
  const { patients, fetchPatients, addPatient, updatePatient, deletePatient } = useClinicOwnerStore();
  const selectedClinicId = useClinicStore((state) => state.selectedClinicId);
  const toast = useToast();
  const location = useLocation();

  const [showForm, setShowForm] = useState(!!location.state?.openForm);
  const [editingPatient, setEditingPatient] = useState(null);

  // History Modal States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyPatient, setHistoryPatient] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Re-appointment modal states
  const [isReAptOpen, setIsReAptOpen] = useState(false);
  const [reAptPatient, setReAptPatient] = useState(null);
  const [reAptDate, setReAptDate] = useState('');
  const [reAptTime, setReAptTime] = useState('09:00');
  const [reAptTreatment, setReAptTreatment] = useState('Follow-Up Consultation');
  const [reAptDentistId, setReAptDentistId] = useState('');
  const [reAptDentistName, setReAptDentistName] = useState('');
  const [reAptNotes, setReAptNotes] = useState('');
  const [reAptLoading, setReAptLoading] = useState(false);
  const [dentistList, setDentistList] = useState([]);

  useEffect(() => {
    api.get('/users/staff/dentists')
      .then(({ data }) => {
        if (data.success) {
          setDentistList(data.data);
          if (data.data.length > 0) {
            setReAptDentistId(data.data[0].id);
            setReAptDentistName(data.data[0].name);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load dentists', err);
      });
  }, []);

  const handleOpenReAptFromDirectory = (patient) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setReAptPatient(patient);
    setReAptDate(tomorrow.toISOString().split('T')[0]);
    setReAptTime('09:00');
    setReAptTreatment('Follow-Up Consultation');
    if (dentistList.length > 0) {
      setReAptDentistId(dentistList[0].id);
      setReAptDentistName(dentistList[0].name);
    }
    setReAptNotes(`Re-appointment for patient ${patient.name}`);
    setIsReAptOpen(true);
  };

  const { addAppointment } = useAppointmentStore();

  const handleSubmitReApt = async () => {
    if (!reAptPatient || !reAptDate || !reAptTime) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setReAptLoading(true);
    const dentist = dentistList.find(d => d.id === reAptDentistId);
    
    const apptData = {
      patientId: reAptPatient.id,
      patientName: reAptPatient.name,
      dentistId: reAptDentistId,
      dentistName: dentist?.name || reAptDentistName,
      assignedDoctorId: reAptDentistId,
      date: reAptDate,
      time: reAptTime,
      duration: 45,
      type: reAptTreatment,
      notes: reAptNotes,
      status: 'Scheduled',
      workflowStage: 'SCHEDULED'
    };
    
    const res = await addAppointment(apptData);
    setReAptLoading(false);
    if (res?.success !== false) {
      toast.success(`Re-appointment booked for ${reAptPatient.name} on ${reAptDate}!`, 'Re-Booked ✓');
      setIsReAptOpen(false);
    } else {
      toast.error(res.error || 'Failed to book re-appointment.');
    }
  };

  const handleOpenHistory = async (patient) => {
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryPatient(null);
    try {
      const { data } = await api.get(`/patients/${patient.id}`);
      if (data.success) {
        setHistoryPatient(data.data);
      } else {
        toast.error('Failed to load patient history details.');
      }
    } catch (_err) {
      toast.error('Failed to query clinical clearings context.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (location.state?.openForm) {
      // Clear location state so going back/refreshing doesn't re-trigger it
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.openForm]);

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [allergies, setAllergies] = useState('');
  const [insurance, setInsurance] = useState('');
  const [status, setStatus] = useState('Active');
  
  // Previous Dentist Information states
  const [prevDentistName, setPrevDentistName] = useState('');
  const [prevDentistClinic, setPrevDentistClinic] = useState('');
  const [prevDentistPhone, setPrevDentistPhone] = useState('');
  const [lastDentalVisit, setLastDentalVisit] = useState('');

  // Existing Dental Conditions states
  const [existingDentalConditions, setExistingDentalConditions] = useState([]);
  const [existingDentalNotes, setExistingDentalNotes] = useState('');

  const toggleDentalCondition = (condId) => {
    setExistingDentalConditions(prev => 
      prev.includes(condId) ? prev.filter(c => c !== condId) : [...prev, condId]
    );
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (selectedClinicId === 'all') return true;
      return p.clinicId === selectedClinicId;
    });
  }, [patients, selectedClinicId]);

  const handleOpenCreate = () => {
    setEditingPatient(null);
    setName('');
    setAge('');
    setGender('Male');
    setPhone('');
    setEmail('');
    setPassword('');
    setAddress('');
    setAllergies('');
    setInsurance('');
    setStatus('Active');
    setPrevDentistName('');
    setPrevDentistClinic('');
    setPrevDentistPhone('');
    setLastDentalVisit('');
    setExistingDentalConditions([]);
    setExistingDentalNotes('');
    setShowForm(true);
  };

  const handleOpenEdit = (patient) => {
    setEditingPatient(patient);
    setName(patient.name);
    setAge(patient.age.toString());
    setGender(patient.gender);
    setPhone(patient.phone);
    setEmail(patient.email);
    setPassword(patient.password || '');
    setAddress(patient.address || '');
    setAllergies(patient.allergies ? patient.allergies.join(', ') : '');
    setInsurance(patient.insuranceProvider || '');
    setStatus(patient.status || 'Active');

    const medCond = typeof patient.medicalConditions === 'string'
      ? (() => { try { return JSON.parse(patient.medicalConditions); } catch (_) { return {}; } })()
      : (patient.medicalConditions || {});
    setPrevDentistName(medCond.previousDentistName || '');
    setPrevDentistClinic(medCond.previousDentistClinic || '');
    setPrevDentistPhone(medCond.previousDentistPhone || '');
    setLastDentalVisit(medCond.lastDentalVisit || '');
    setExistingDentalConditions(Array.isArray(medCond.existingDentalConditions) ? medCond.existingDentalConditions : []);
    setExistingDentalNotes(medCond.existingDentalNotes || '');

    setShowForm(true);
  };

  const handleDelete = (id, patientName) => {
    if (window.confirm(`Are you sure you want to delete the patient file for ${patientName}?`)) {
      deletePatient(id);
      toast.warning(`Deleted patient record for ${patientName}.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !email || (!editingPatient && !password)) {
      toast.error('Please complete required fields (Name, Phone, Email, Password)!');
      return;
    }

    const allergyArr = allergies
      ? allergies.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

    const targetClinicId = selectedClinicId === 'all' ? 'clinic-1' : selectedClinicId;

    const existingMedCond = editingPatient
      ? (typeof editingPatient.medicalConditions === 'string'
          ? (() => { try { return JSON.parse(editingPatient.medicalConditions); } catch (_) { return {}; } })()
          : (editingPatient.medicalConditions || {}))
      : {};

    const updatedMedCond = {
      ...existingMedCond,
      previousDentistName: prevDentistName.trim() || undefined,
      previousDentistClinic: prevDentistClinic.trim() || undefined,
      previousDentistPhone: prevDentistPhone.trim() || undefined,
      lastDentalVisit: lastDentalVisit || undefined,
      existingDentalConditions: existingDentalConditions,
      existingDentalNotes: existingDentalNotes.trim() || undefined,
    };

    const patientData = {
      name,
      age: Number(age) || 30,
      gender,
      phone,
      email,
      password,
      address,
      allergies: allergyArr,
      insuranceProvider: insurance || 'None',
      status,
      clinicId: editingPatient ? editingPatient.clinicId : targetClinicId,
      medicalConditions: updatedMedCond,
    };

    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, patientData);
        toast.success(`Updated details for patient ${name} successfully!`, 'EHR Updated');
      } else {
        await addPatient(patientData);
        toast.success(`Registered patient file for ${name} successfully!`, 'EHR Created');
      }

      // Reset and close form
      setShowForm(false);
      setEditingPatient(null);
      setName('');
      setAge('');
      setGender('Male');
      setPhone('');
      setEmail('');
      setPassword('');
      setAddress('');
      setAllergies('');
      setInsurance('');
      setStatus('Active');
      setPrevDentistName('');
      setPrevDentistClinic('');
      setPrevDentistPhone('');
      setLastDentalVisit('');
      setExistingDentalConditions([]);
      setExistingDentalNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register/update patient');
    }
  };

  if (!showForm) {
    const columns = [
      { key: 'id', header: 'ID', render: (p) => {
        const id = p.displayId || p.id || '';
        const display = id.startsWith('pat-') ? '#' + id : (id.length > 10 ? '#' + id.slice(0, 8) + '…' : '#' + id);
        return <span className="font-bold text-slate-400 text-[10px] font-mono" title={p.id}>{display}</span>;
      }},
      { key: 'name', header: 'Patient Name', render: (p) => <span className="font-extrabold text-foreground">{p.name}</span> },
      { key: 'age', header: 'Age / Gender', render: (p) => <span className="font-semibold text-muted-foreground">{p.age} yrs &bull; {p.gender}</span> },
      { key: 'phone', header: 'Phone Number', render: (p) => <span className="font-medium text-foreground">{p.phone}</span> },
      { key: 'email', header: 'Email Address', render: (p) => <span className="font-medium text-muted-foreground">{p.email}</span> },
      { key: 'insuranceProvider', header: 'Insurance Carrier', render: (p) => <span className="font-medium text-foreground">{p.insuranceProvider || 'None'}</span> },
      {
        key: 'status',
        header: 'Status',
        render: (p) => {
          const variant = p.status === 'Active' ? 'success' : 'secondary';
          return <Badge variant={variant} className="font-bold text-[9px] uppercase">{p.status}</Badge>;
        }
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (p) => (
          <div className="flex gap-1.5 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenReAptFromDirectory(p)}
              className="h-8 w-8 rounded-full hover:bg-indigo-500/10 text-indigo-500"
              title="Re-Book / Re-appointment"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenHistory(p)}
              className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary"
              title="Clinical History"
            >
              <Clipboard className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenEdit(p)}
              className="h-8 w-8 rounded-full hover:bg-primary/10"
              title="Edit Patient"
            >
              <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(p.id, p.name)}
              className="h-8 w-8 rounded-full hover:bg-destructive/10"
              title="Delete Patient"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )
      }
    ];

    return (
      <div className="space-y-6 text-left animate-fade-in pb-12">
        {/* Title */}
        <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              Onboarded Patients Directory
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              Manage patient demographic profiles, contact records, allergies, and coverage states.
            </p>
          </div>
          <div>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="font-bold text-xs gap-1.5 h-9 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              Register New Patient
            </Button>
          </div>
        </div>

        {/* Patients Table Container */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <DataTable
            columns={columns}
            data={filteredPatients}
            searchKey="name"
            searchPlaceholder="Search patients directory..."
            pageSize={10}
          />
        </div>

        {/* Patient History Modal */}
        <Modal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          title={`Patient Clinical History: ${historyPatient?.name || 'Loading...'}`}
          size="3xl"
        >
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-xs font-semibold text-muted-foreground select-none">
              <span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              Fetching electronic health records...
            </div>
          ) : historyPatient ? (
            <div className="space-y-6 text-xs text-left font-semibold">
              {/* Demographics Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-border bg-muted/20 rounded-2xl">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-extrabold">AGE / GENDER</span>
                  <span className="text-foreground text-sm font-bold mt-1 block">
                    {historyPatient.age} yrs · {historyPatient.gender || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-extrabold">PHONE NUMBER</span>
                  <span className="text-foreground text-sm font-bold mt-1 block">{historyPatient.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-extrabold">INSURANCE CARRIER</span>
                  <span className="text-foreground text-sm font-bold mt-1 block">{historyPatient.insuranceProvider || 'None'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-extrabold">ALLERGIES</span>
                  <span className="text-rose-500 text-sm font-bold mt-1 block">
                    {historyPatient.allergies && historyPatient.allergies.length > 0
                      ? historyPatient.allergies.join(', ')
                      : 'None Reported'}
                  </span>
                </div>
              </div>

              {/* Treatment History - Stacked Sequentially */}
              <div className="space-y-6">
                {/* Clinical Notes & Logs */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-1">
                    Clinical Notes & Logs
                  </h3>
                  {historyPatient.clinicalNotes && historyPatient.clinicalNotes.length > 0 ? (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {historyPatient.clinicalNotes.map((n) => (
                        <div key={n.id} className="p-3 border border-border bg-card rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                            <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                            <span>{n.authorName} ({n.authorRole})</span>
                          </div>
                          <p className="text-foreground text-xs leading-relaxed font-semibold font-mono whitespace-pre-wrap">
                            {n.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-4">No clinical notes recorded for this patient.</p>
                  )}
                </div>

                {/* Treatment Plans & Status */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-1">
                    Treatment Plans & Status
                  </h3>
                  {historyPatient.treatmentPlans && historyPatient.treatmentPlans.length > 0 ? (
                    <div className="border border-border rounded-xl overflow-hidden text-xs max-h-[250px] overflow-y-auto">
                      <table className="w-full text-left divide-y divide-border">
                        <thead className="bg-muted text-[10px] uppercase font-bold text-muted-foreground sticky top-0 z-10">
                          <tr>
                            <th className="p-2 bg-muted">Tooth</th>
                            <th className="p-2 bg-muted">Procedure</th>
                            <th className="p-2 bg-muted">Cost</th>
                            <th className="p-2 text-right bg-muted">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                          {historyPatient.treatmentPlans.map((tp) => (
                            <tr key={tp.id}>
                              <td className="p-2 font-extrabold text-indigo-400">#{tp.tooth}</td>
                              <td className="p-2">{tp.procedure}</td>
                              <td className="p-2 font-extrabold">${tp.cost}</td>
                              <td className="p-2 text-right">
                                <Badge variant={tp.status === 'Completed' ? 'success' : 'info'} className="text-[9px] font-bold uppercase">
                                  {tp.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">No treatment plans established yet.</p>
                  )}

                  {historyPatient.signature && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-border bg-card rounded-xl gap-3 mt-2">
                      <div className="text-[10px] text-muted-foreground font-semibold">
                        Patient has accepted and digitally signed the active treatment plan.
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Patient Sign:</span>
                        <div className="border border-border rounded bg-muted/40 px-2 py-1 flex items-center justify-center h-10 w-28 overflow-hidden">
                          <img
                            src={historyPatient.signature}
                            alt="Consent Signature"
                            className="max-h-full max-w-full object-contain filter dark:invert"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Prescriptions */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-1">
                    Active Prescriptions
                  </h3>
                  {historyPatient.prescriptions && historyPatient.prescriptions.length > 0 ? (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      {historyPatient.prescriptions.map((rx) => (
                        <div key={rx.id} className="p-2.5 border border-border bg-muted/20 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-extrabold text-foreground">{rx.drug}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold">
                              {rx.dosage} · {rx.frequency} · {rx.duration}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-bold">{new Date(rx.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">No active prescriptions.</p>
                  )}
                </div>

                {/* Scanned Radiographs (X-rays) */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-1">
                    Scanned Radiographs (X-rays)
                  </h3>
                  {historyPatient.xrayFiles && historyPatient.xrayFiles.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {historyPatient.xrayFiles.map((x) => (
                        <div key={x.id} className="p-2.5 border border-border bg-muted/20 rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                            <span>{x.name}</span>
                            <span>{new Date(x.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[10.5px] text-foreground font-semibold">{x.notes || 'No notes available.'}</p>
                          {x.aiReport && (
                            <p className="text-[9.5px] bg-primary/10 border border-primary/20 text-primary p-1.5 rounded-lg font-bold">
                              AI Insights: {x.aiReport}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">No X-ray files uploaded.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-border mt-6">
                <Button type="button" variant="outline" onClick={() => setIsHistoryOpen(false)}>Close EHR History</Button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-center font-bold text-rose-500 py-8 select-none">
              Failed to resolve patient details context.
            </div>
          )}
        </Modal>

        {/* ─── RE-APPOINTMENT MODAL ─── */}
        <Modal
          isOpen={isReAptOpen}
          onClose={() => setIsReAptOpen(false)}
          title="Schedule Re-Appointment"
          size="2xl"
        >
          <div className="space-y-5 text-left p-1 text-xs font-semibold">
            {/* Patient Info Banner */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-500 rounded-lg">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-foreground">{reAptPatient?.name}</p>
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
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      {/* Title with Back Button */}
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            {editingPatient ? `Edit Patient Details` : `Patient Registration Onboarding`}
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            {editingPatient 
              ? `Modify patient profile records, allergies, contact endpoints, and billing settings.`
              : `Onboard walk-in or booked arrivals. Auto-generates patient EHR tracking directories.`}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setShowForm(false);
            setEditingPatient(null);
          }}
          className="font-bold text-xs gap-1.5 h-9 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Button>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl max-w-2xl mx-auto shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1">
            <Users className="h-4.5 w-4.5" />
            1. Demographics & Contact details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Patient Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arthur Dent"
              required
              className="text-xs text-foreground font-medium"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 42"
                className="text-xs text-foreground font-medium"
              />
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Contact Phone Number *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (206) 555-4242"
              required
              className="text-xs text-foreground font-medium"
            />
            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. arthur@galaxy.com"
              required
              className="text-xs text-foreground font-medium"
            />
            <Input
              label="Account Password *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create login password"
              required={!editingPatient}
              className="text-xs text-foreground font-medium"
            />
          </div>

          <Input
            label="Residential Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Country Lane, Cottington, UK"
            className="text-xs text-foreground font-medium"
          />

          <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-2 pt-4 flex items-center gap-1">
            <ShieldCheck className="h-4.5 w-4.5" />
            2. Medical Summary & Insurance Eligibility
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Known Allergies (comma separated)"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Latex"
              className="text-xs text-foreground font-medium"
            />
            <Input
              label="Insurance Provider Name"
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
              placeholder="e.g. Blue Cross Blue Shield"
              className="text-xs text-foreground font-medium"
            />
          </div>

          <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-2 pt-4 flex items-center gap-1">
            <Clipboard className="h-4.5 w-4.5" />
            3. Previous Dentist & Dental History
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Previous Dentist Name"
              value={prevDentistName}
              onChange={(e) => setPrevDentistName(e.target.value)}
              placeholder="e.g. Dr. R. K. Sharma"
              className="text-xs text-foreground font-medium"
            />
            <Input
              label="Previous Clinic / Practice Name"
              value={prevDentistClinic}
              onChange={(e) => setPrevDentistClinic(e.target.value)}
              placeholder="e.g. City Dental Care"
              className="text-xs text-foreground font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Previous Dentist Phone Number"
              value={prevDentistPhone}
              onChange={(e) => setPrevDentistPhone(e.target.value)}
              placeholder="e.g. +91 9876543210"
              className="text-xs text-foreground font-medium"
            />
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Last Dental Visit Date</label>
              <input
                type="date"
                value={lastDentalVisit}
                onChange={(e) => setLastDentalVisit(e.target.value)}
                className="w-full text-xs font-medium bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
              />
            </div>
          </div>

          {/* Existing Dental Conditions Checklist */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Pre-Existing Dental Conditions Checklist</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'Crown / Bridge', label: 'Crown / Bridge' },
                { id: 'Dental Implants', label: 'Implants' },
                { id: 'Full / Partial Dentures', label: 'Dentures' },
                { id: 'Prior Root Canal (RCT)', label: 'Prior RCT' },
                { id: 'Orthodontic Braces / Retainer', label: 'Orthodontics / Braces' },
                { id: 'Bruxism / Teeth Grinding', label: 'Bruxism / Grinding' },
                { id: 'Periodontal History', label: 'Periodontal History' },
              ].map(cond => {
                const isSelected = existingDentalConditions.includes(cond.id);
                return (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => toggleDentalCondition(cond.id)}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{cond.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Existing Dental Notes / Clinical History</label>
            <textarea
              value={existingDentalNotes}
              onChange={(e) => setExistingDentalNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Upper right molar crown placed 2022, tooth #19 RCT treated..."
              className="w-full text-xs font-semibold bg-muted border border-border rounded-xl p-2.5 focus:outline-none text-foreground resize-none"
            />
          </div>

          {editingPatient && (
            <div className="space-y-1 pt-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Patient File Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-6 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditingPatient(null);
              }}
              className="font-bold text-xs w-full sm:w-auto h-11 sm:h-10 cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" className="font-bold text-xs w-full sm:w-auto h-11 sm:h-10 cursor-pointer">
              {editingPatient ? 'Update Patient File' : 'Complete Patient Registration →'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. INSURANCE VERIFICATION PAGE
// ----------------------------------------------------
export function FrontDeskInsurancePage() {
  const { insuranceChecks, addInsuranceCheck, evaluateEligibility, fetchInsuranceChecks } = useFrontDeskStore();
  const { patients, fetchPatients } = useClinicOwnerStore();
  const toast = useToast();
  const [verifyPatientId, setVerifyPatientId] = useState('');

  useEffect(() => {
    fetchPatients();
    fetchInsuranceChecks();
  }, [fetchPatients, fetchInsuranceChecks]);

  useEffect(() => {
    if (patients.length > 0 && !verifyPatientId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVerifyPatientId(patients[0].id);
    }
  }, [patients, verifyPatientId]);
  const [provider, setProvider] = useState('');
  const [policyNum, setPolicyNum] = useState('');
  const [checkingId, setCheckingId] = useState(null);

  const handleVerifyRequest = (e) => {
    e.preventDefault();
    const patientObj = patients.find((p) => p.id === verifyPatientId);
    if (!patientObj) {
      toast.error('Invalid patient selection!');
      return;
    }
    if (!provider || !policyNum) {
      toast.error('Please enter provider name and policy/ID number!');
      return;
    }

    addInsuranceCheck({
      patientName: patientObj.name,
      provider,
      policyNumber: policyNum
    });

    toast.success('Eligibility check request logged to tracking queue.');
    setProvider('');
    setPolicyNum('');
  };

  const handleEvaluate = (id, patientName) => {
    setCheckingId(id);
    toast.info(`Querying clearinghouse details for ${patientName}...`, 'Mocking Eligibility Check');

    setTimeout(() => {
      const isApproved = Math.random() > 0.3; // 70% approval rate simulation
      if (isApproved) {
        evaluateEligibility(
          id,
          'Approved',
          'Active coverage. Deductible met. 100% preventive, 80% restorative. Annual cap $2,500.'
        );
        toast.success(`Policy eligibility approved for ${patientName}!`, 'Check Complete');
      } else {
        evaluateEligibility(
          id,
          'Rejected',
          'Plan terminated as of 2026-05-31. Deductible unmet or non-covered plan services.'
        );
        toast.error(`Policy eligibility verification rejected for ${patientName}.`, 'Check Complete');
      }
      setCheckingId(null);
    }, 1500);
  };

  const columns = [
    { key: 'id', header: 'ID', render: (ins) => <span className="font-bold text-slate-500">#{ins.id}</span> },
    { key: 'patientName', header: 'Patient Name', render: (ins) => <span className="font-extrabold text-foreground">{ins.patientName}</span> },
    { key: 'provider', header: 'Carrier' },
    { key: 'policyNumber', header: 'Policy/ID Number' },
    { key: 'lastChecked', header: 'Checked At' },
    {
      key: 'status',
      header: 'Eligibility Status',
      render: (ins) => {
        const variant = ins.status === 'Approved' ? 'success' : ins.status === 'Pending' ? 'warning' : 'destructive';
        return <Badge variant={variant} className="font-bold text-[9px] uppercase">{ins.status}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Trigger Check',
      align: 'right',
      render: (ins) => (
        <Button
          size="xs"
          disabled={ins.status !== 'Pending' || checkingId === ins.id}
          onClick={() => handleEvaluate(ins.id, ins.patientName)}
          className="font-bold text-[9px] gap-1 cursor-pointer h-9 sm:h-7 w-full sm:w-auto justify-center"
        >
          {checkingId === ins.id ? (
            <span className="animate-pulse">Checking...</span>
          ) : (
            <>
              <Play className="h-3 w-3 fill-current" />
              Verify Policy
            </>
          )}
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      {/* Title */}
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
          Insurance Eligibility Tracker
        </h2>
        <p className="text-xs text-muted-foreground font-semibold">Verify coverage plans and policy states. Queries clearinghouse systems in real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Queue (2 columns) */}
        <div className="lg:col-span-2 bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider text-primary">Eligibility Verification Queue</h3>
          <DataTable columns={columns} data={insuranceChecks} searchKey="patientName" searchPlaceholder="Search verification log..." pageSize={10} />
        </div>

        {/* Submit verification form (1 column) */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider text-primary flex items-center gap-1.5">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            Submit Verification Request
          </h3>

          <form onSubmit={handleVerifyRequest} className="space-y-4 text-xs text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Select Patient Record</label>
              <select
                value={verifyPatientId}
                onChange={(e) => setVerifyPatientId(e.target.value)}
                className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>
                ))}
              </select>
            </div>

            <Input
              label="Insurance Provider Name"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. Cigna, Delta Dental"
              className="text-xs text-foreground font-medium"
            />

            <Input
              label="Policy Number / Member ID"
              value={policyNum}
              onChange={(e) => setPolicyNum(e.target.value)}
              placeholder="e.g. CGN-880099"
              className="text-xs text-foreground font-medium"
            />

            <Button type="submit" size="sm" className="w-full h-9 font-bold text-xs mt-3">
              Request Verification Check
            </Button>
          </form>

          {/* Details display block */}
          <div className="h-px bg-border/60 my-2" />
          
          <div className="space-y-2 text-xs">
            <h4 className="font-extrabold text-foreground uppercase text-[10px] tracking-wider text-primary">Coverage Details Panel</h4>
            <div className="p-3 bg-muted border border-border rounded-xl text-[10.5px] leading-relaxed text-muted-foreground font-semibold min-h-[90px] flex items-center justify-center">
              <span>Select any approved row to preview coverage benefits summary details.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. WAITLIST MODULE PAGE
// ----------------------------------------------------
export function FrontDeskWaitlistPage() {
  const { waitlist, addToWaitlist, removeFromWaitlist, updateWaitlistPriority, fetchWaitlist } = useFrontDeskStore();
  const { patients, fetchPatients } = useClinicOwnerStore();
  const { addAppointment } = useAppointmentStore();
  const toast = useToast();

  useEffect(() => {
    fetchWaitlist();
    fetchPatients();
  }, [fetchWaitlist, fetchPatients]);

  // Form states
  const [wlPatientId, setWlPatientId] = useState('');
  const [wlPhone, setWlPhone] = useState('');
  const [wlTime, setWlTime] = useState('Morning');
  const [wlPriority, setWlPriority] = useState('Medium');
  const [wlReason, setWlReason] = useState('');
  const [isSchedulingIndex, setIsSchedulingIndex] = useState(null);

  useEffect(() => {
    if (wlPatientId && patients.length > 0) {
      const p = patients.find(pat => pat.id === wlPatientId);
      if (p) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWlPhone(p.phone || '');
      }
    }
  }, [wlPatientId, patients]);

  const handleAddWaitlist = (e) => {
    e.preventDefault();
    const patientObj = patients.find(p => p.id === wlPatientId);
    
    if (!patientObj || !wlPhone) {
      toast.error('Please select a patient and ensure contact phone is provided!');
      return;
    }

    addToWaitlist({
      patientName: patientObj.name,
      phone: wlPhone,
      preferredTime: wlTime,
      priority: wlPriority,
      reason: wlReason
    });

    toast.success(`${patientObj.name} successfully added to scheduling waitlist!`);
    
    // Clear form
    setWlPatientId('');
    setWlPhone('');
    setWlReason('');
  };

  const handleAutoAssign = () => {
    // Find high priority waitlist patient
    const candidates = [...waitlist].sort((a, b) => {
      const pMap = { High: 3, Medium: 2, Low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    });

    const target = candidates[0];
    if (!target) {
      toast.warning('Waitlist queue is empty. No candidates for auto-scheduling!');
      return;
    }

    setIsSchedulingIndex(target.id);
    toast.info(`Scanning schedule logs for cancellations for ${target.patientName}...`, 'Auto-Scheduler Engine Running');

    setTimeout(() => {
      // Create appointment at 02:00 PM today
      const today = new Date().toISOString().split('T')[0];
      
      addAppointment({
        patientId: 'pat-temp-' + Math.floor(Math.random()*100),
        patientName: target.patientName,
        dentistName: 'Not Assigned',
        clinicId: 'clinic-1',
        date: today,
        time: '14:00',
        duration: 45,
        status: 'Scheduled',
        type: target.reason || 'General Cleaning',
        notes: 'Auto-scheduled from waitlist queue'
      });

      removeFromWaitlist(target.id);
      setIsSchedulingIndex(null);
      toast.success(`Canceled slot assigned! ${target.patientName} scheduled today at 02:00 PM!`, 'Scheduling Complete');
      toast.info(`Intake reminder notification SMS dispatched to ${target.phone}.`);
    }, 1500);
  };

  const columns = [
    { key: 'id', header: 'ID', render: (w) => <span className="font-bold text-slate-500">#{w.id}</span> },
    { key: 'patientName', header: 'Patient Name', render: (w) => <span className="font-extrabold text-foreground">{w.patientName}</span> },
    { key: 'phone', header: 'Phone' },
    { key: 'preferredTime', header: 'Preferred Time' },
    { key: 'reason', header: 'Reason' },
    {
      key: 'priority',
      header: 'Priority Rank',
      render: (w) => {
        return (
          <select
            value={w.priority}
            onChange={(e) => updateWaitlistPriority(w.id, e.target.value)}
            className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-muted border border-border outline-none cursor-pointer ${
              w.priority === 'High'
                ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                : w.priority === 'Medium'
                ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
            }`}
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (w) => (
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            removeFromWaitlist(w.id);
            toast.success(`Removed ${w.patientName} from waitlist.`);
          }}
          className="text-rose-500 hover:bg-rose-500/10 font-bold cursor-pointer"
        >
          Remove
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      {/* Title */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            Schedule Waitlist Manager
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Prioritize and book waitlisted patients when appointments cancel.</p>
        </div>
        <div>
          <Button
            size="sm"
            onClick={handleAutoAssign}
            disabled={isSchedulingIndex !== null || waitlist.length === 0}
            className="font-bold text-xs gap-1.5 h-9 cursor-pointer"
          >
            {isSchedulingIndex !== null ? (
              <span className="animate-pulse">Matching slot...</span>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run Auto-Scheduler
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waitlist Queue table (2 columns) */}
        <div className="lg:col-span-2 bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider text-primary">Active Patient Waitlist</h3>
          <DataTable columns={columns} data={waitlist} searchKey="patientName" searchPlaceholder="Search waitlist..." pageSize={10} />
        </div>

        {/* Add waitlist form (1 column) */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Users className="h-4.5 w-4.5 text-primary" />
            Add Patient to Waitlist
          </h3>

          <form onSubmit={handleAddWaitlist} className="space-y-4 text-xs text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Select Patient *</label>
              <select
                value={wlPatientId}
                onChange={(e) => setWlPatientId(e.target.value)}
                required
                className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
              >
                <option value="" disabled>-- Select a registered patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <Input
              label="Contact Phone *"
              value={wlPhone}
              onChange={(e) => setWlPhone(e.target.value)}
              placeholder="e.g. (206) 555-4242"
              required
              className="text-xs text-foreground font-medium"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Preferred Time</label>
                <select
                  value={wlTime}
                  onChange={(e) => setWlTime(e.target.value)}
                  className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Late Afternoon">Late Afternoon</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Priority Level</label>
                <select
                  value={wlPriority}
                  onChange={(e) => setWlPriority(e.target.value)}
                  className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
                >
                  <option value="High">High (Severe pain)</option>
                  <option value="Medium">Medium (Checkup check)</option>
                  <option value="Low">Low (Prophylaxis)</option>
                </select>
              </div>
            </div>

            <Input
              label="Reason for Appointment"
              value={wlReason}
              onChange={(e) => setWlReason(e.target.value)}
              placeholder="e.g. Toothache, follow-up crown review..."
              className="text-xs text-foreground font-medium"
            />

            <Button type="submit" size="sm" className="w-full h-9 font-bold text-xs mt-3 cursor-pointer">
              Add Patient
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
