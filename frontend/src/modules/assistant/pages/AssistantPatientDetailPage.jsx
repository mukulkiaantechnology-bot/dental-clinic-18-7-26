import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Activity, Image as ImageIcon, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { useDentalAssistantStore } from '../../../store/dentalAssistantStore';
import { useDentistStore } from '../../../store/dentistStore';
import { useAppointmentStore } from '../../../store/appointmentStore';
import api from '../../../shared/utils/api';
import { Button } from '../../../shared/ui/Button';
import { Badge } from '../../../shared/ui/Badge';
import { useToast } from '../../../shared/hooks/useToast';
import { ChairsideToolsPage } from './ChairsideToolsPage';
import { XrayUploadPage } from './XrayUploadPage';
import { ClinicalNotesPage } from './ClinicalNotesPage';

export function AssistantPatientDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { todayPatients, setActivePatientId, fetchTodayPatients } = useDentalAssistantStore();
  const dentistPatients = useDentistStore((state) => state.patients);
  const fetchPatients = useDentistStore((state) => state.fetchPatients);
  const fetchPatientDetails = useDentistStore((state) => state.fetchPatientDetails);
  const { appointments, fetchAppointments, advanceStage } = useAppointmentStore();
  const toast = useToast();

  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get('tab') || 'chairside';
  const dentistPatient = dentistPatients.find((dp) => dp.id === id) || {};

  // Find or construct assistant patient metadata
  const appointmentId = searchParams.get('appointmentId');
  let assistantPatient = todayPatients.find((p) => p.id === id);

  if (!assistantPatient && dentistPatient.id) {
    const apt = appointmentId 
      ? appointments.find((a) => a.id === appointmentId) 
      : appointments.find((a) => a.patientId === id);
    
    assistantPatient = {
      id: dentistPatient.id,
      appointmentId: apt?.id || '',
      name: dentistPatient.name,
      age: dentistPatient.age || 30,
      dentistName: apt?.dentistName || 'Not Assigned',
      treatmentType: apt?.type || 'General Consultation',
      status: apt?.status || 'Scheduled'
    };
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTodayPatients(),
          fetchPatients(),
          fetchAppointments(),
          id ? fetchPatientDetails(id) : Promise.resolve()
        ]);
      } catch (err) {
        console.error('Error loading assistant patient details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    if (id) {
      setActivePatientId(id);
    }
  }, [id, setActivePatientId]);

  useEffect(() => {
    if (id && (!searchParams.get('id') || !searchParams.get('tab'))) {
      setSearchParams({
        tab: searchParams.get('tab') || 'chairside',
        id: searchParams.get('id') || id
      });
    }
  }, [id, searchParams, setSearchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center flex-1">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <h3 className="text-md font-bold text-foreground">Loading patient details...</h3>
      </div>
    );
  }

  if (!assistantPatient) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive animate-bounce mb-4" />
        <h3 className="text-lg font-bold text-foreground">Patient Not Found</h3>
        <p className="text-sm text-muted-foreground mt-2">The requested patient record could not be located in today's schedule.</p>
        <Button onClick={() => navigate('/assistant/patients')} className="mt-6">Back to Today's Patients</Button>
      </div>
    );
  }

  const patient = {
    ...assistantPatient,
    ...dentistPatient
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const activeAppointment = appointmentId 
    ? appointments.find(a => a.id === appointmentId) 
    : (appointments.find(a => a.patientId === id && a.date === todayStr) || appointments.find(a => a.patientId === id));

  const handleSaveAndFinalize = async () => {
    try {
      const { data } = await api.put(`/patients/${patient.id}`, { status: 'Active' });
      if (data.success) {
        if (activeAppointment && activeAppointment.workflowStage !== 'COMPLETED') {
          await advanceStage(activeAppointment.id, 'COMPLETED');
        }
        toast.success('Patient treatment finalized & record updated successfully.');
        await fetchPatients();
        navigate('/assistant/patients');
      } else {
        toast.error('Failed to finalize patient treatment.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error finalizing patient treatment.');
    }
  };

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName, id: id });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Waiting':
      case 'Checked_In':
      case 'Ready_For_Doctor':
        return <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-[10px]">Waiting (Pending)</Badge>;
      case 'In Treatment':
      case 'In_Progress':
        return <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold text-[10px] animate-pulse">In Treatment</Badge>;
      case 'Completed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-[10px]">Completed</Badge>;
      default:
        return <Badge variant="secondary" className="font-bold text-[10px]">{status}</Badge>;
    }
  };

  const tabs = [
    { key: 'chairside', label: 'Chairside Tools', icon: Activity },
    { key: 'xray', label: 'X-Ray Upload', icon: ImageIcon },
    { key: 'notes', label: 'Clinical Notes', icon: FileText }
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in flex-1 flex flex-col h-full min-w-0 w-full">
      {/* Patient Profile Card Header */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-black text-foreground">{patient.name}</h2>
            <Badge variant="secondary" className="font-bold">ID: #{patient.displayId || patient.id}</Badge>
            {getStatusBadge(patient.status)}
          </div>
          <p className="text-xs font-semibold text-muted-foreground leading-relaxed max-w-xl">
            {patient.history || 'No active medical notes logged for this patient.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs">
          <div className="p-3 bg-muted/50 border border-border rounded-xl">
            <span className="text-muted-foreground block mb-1 font-semibold uppercase text-[9px] tracking-wider font-extrabold">Assigned Dentist</span>
            <span className="font-extrabold text-foreground">{patient.dentistName}</span>
          </div>
          <div className="p-3 bg-muted/50 border border-border rounded-xl">
            <span className="text-muted-foreground block mb-1 font-semibold uppercase text-[9px] tracking-wider font-extrabold">Procedure</span>
            <span className="font-extrabold text-primary">{patient.treatmentType}</span>
          </div>
          <div className="p-3 bg-muted/50 border border-border rounded-xl">
            <span className="text-muted-foreground block mb-1 font-semibold uppercase text-[9px] tracking-wider font-extrabold">Allergies</span>
            <span className={`font-extrabold ${patient.allergies === 'None' ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`}>
              {patient.allergies || 'None'}
            </span>
          </div>
          <div className="p-3 bg-muted/50 border border-border rounded-xl">
            <span className="text-muted-foreground block mb-1 font-semibold uppercase text-[9px] tracking-wider">Vitals</span>
            <span className="font-extrabold text-foreground">{patient.vitals || 'BP: 120/80'}</span>
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
      <div className="flex-1 flex flex-col min-h-0 bg-background mt-4">
        {activeTab === 'chairside' && <ChairsideToolsPage />}
        {activeTab === 'xray' && <XrayUploadPage />}
        {activeTab === 'notes' && <ClinicalNotesPage />}
      </div>
    </div>
  );
}

export default AssistantPatientDetailPage;
