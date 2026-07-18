import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  CheckSquare,
  Clipboard,
  AlertCircle,
  UserCheck,
  Loader2
} from 'lucide-react';
import { useDentalAssistantStore, DEFAULT_CHAIRSIDE_TASKS } from '../../../store/dentalAssistantStore';
import { useAppointmentStore } from '../../../store/appointmentStore';
import { useDentistStore } from '../../../store/dentistStore';
import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';
import { Badge } from '../../../shared/ui/Badge';

export function ChairsideToolsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get('id');
  const appointmentIdParam = searchParams.get('appointmentId');
  const isDetailPage = location.pathname.startsWith('/assistant/patients/');
  const toast = useToast();

  const {
    todayPatients,
    activePatientId,
    setActivePatientId,
    fetchTodayPatients,
    chairsideSessions,
    fetchChairsideSession,
    saveChairsideSession,
    toggleTaskStatus,
  } = useDentalAssistantStore();
  const { appointments, fetchAppointments, advanceStage, assignDoctor } = useAppointmentStore();
  const { patients: dentistPatients, fetchPatients } = useDentistStore();

  const [sessionLoading, setSessionLoading] = useState(false);
  const [activeStage, setActiveStage] = useState('Prep');
  const [time, setTime] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const timerRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    fetchTodayPatients();
    fetchAppointments();
    fetchPatients();
  }, []);

  useEffect(() => {
    if (paramPatientId) {
      setActivePatientId(paramPatientId);
    }
  }, [paramPatientId, setActivePatientId]);

  const activePatient = useMemo(() => {
    let pat = todayPatients.find((p) => p.id === activePatientId);
    if (!pat && activePatientId && dentistPatients.length > 0) {
      const dentistPatient = dentistPatients.find((dp) => dp.id === activePatientId);
      if (dentistPatient) {
        const apt = appointmentIdParam
          ? appointments.find((a) => a.id === appointmentIdParam)
          : appointments.find((a) => a.patientId === activePatientId);
        pat = {
          id: dentistPatient.id,
          appointmentId: apt?.id || '',
          name: dentistPatient.name,
          age: dentistPatient.age || 30,
          dentistName: apt?.dentistName || 'Not Assigned',
          treatmentType: apt?.type || 'General Consultation',
          status: apt?.status || 'Scheduled'
        };
      }
    }
    return pat;
  }, [todayPatients, activePatientId, dentistPatients, appointments, appointmentIdParam]);

  const activeDentistPatient = useMemo(() => dentistPatients.find((p) => p.id === activePatientId) || {}, [dentistPatients, activePatientId]);

  const activeAppointment = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (appointmentIdParam) {
      return appointments.find((a) => a.id === appointmentIdParam);
    }
    return appointments.find((a) => a.patientId === activePatientId && a.date === today)
      || appointments.find((a) => a.patientId === activePatientId);
  }, [appointments, activePatientId, appointmentIdParam]);

  const appointmentId = activeAppointment?.id;
  const session = appointmentId ? chairsideSessions[appointmentId] : null;
  const isLocked = false;

  useEffect(() => {
    if (!appointmentId) return;
    const load = async () => {
      setSessionLoading(true);
      const data = await fetchChairsideSession(appointmentId);
      if (data) {
        setActiveStage(data.activeStage || 'Prep');
        setTime(data.timerSeconds || 0);
        setTimerOn(data.timerRunning || false);
      }
      setSessionLoading(false);
    };
    load();
  }, [appointmentId, fetchChairsideSession]);

  const persistSession = useCallback(async (overrides = {}) => {
    if (!appointmentId || !session) return;
    await saveChairsideSession(appointmentId, {
      tasks: overrides.tasks ?? session.tasks,
      activeStage: overrides.activeStage ?? activeStage,
      timerSeconds: overrides.timerSeconds ?? time,
      timerRunning: overrides.timerRunning ?? timerOn,
    });
  }, [appointmentId, session, saveChairsideSession, activeStage, time, timerOn]);

  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerOn]);

  useEffect(() => {
    if (!appointmentId || !session) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistSession();
    }, 1500);
    return () => clearTimeout(saveTimerRef.current);
  }, [time, timerOn, activeStage, appointmentId, session, persistSession]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const resetTimer = async () => {
    setTime(0);
    setTimerOn(false);
    if (appointmentId) {
      await saveChairsideSession(appointmentId, {
        tasks: session?.tasks || DEFAULT_CHAIRSIDE_TASKS,
        activeStage,
        timerSeconds: 0,
        timerRunning: false,
      });
    }
  };

  const patientTasks = useMemo(() => {
    return session?.tasks || DEFAULT_CHAIRSIDE_TASKS;
  }, [session]);

  const sterilizationTasks = useMemo(() => patientTasks.filter((t) => t.category === 'Sterilization'), [patientTasks]);
  const instrumentTasks = useMemo(() => patientTasks.filter((t) => t.category === 'Instrument'), [patientTasks]);
  const stageTasks = useMemo(() => patientTasks.filter((t) => t.category === 'Stage'), [patientTasks]);

  const handlePatientSelect = (pId) => {
    navigate(`/assistant/chairside?id=${pId}`);
  };

  const handleTaskToggle = async (taskId) => {
    if (!appointmentId || isLocked) return;
    const res = await toggleTaskStatus(appointmentId, taskId);
    if (!res.success) {
      toast.error(res.error || 'Failed to save checklist');
    }
  };

  const handleStageChange = async (stage) => {
    if (isLocked || !appointmentId) return;
    setActiveStage(stage);
    await saveChairsideSession(appointmentId, {
      tasks: session?.tasks || DEFAULT_CHAIRSIDE_TASKS,
      activeStage: stage,
      timerSeconds: time,
      timerRunning: timerOn,
    });
  };

  const handleTimerToggle = async (running) => {
    if (isLocked || !appointmentId) return;
    setTimerOn(running);
    await saveChairsideSession(appointmentId, {
      tasks: session?.tasks || DEFAULT_CHAIRSIDE_TASKS,
      activeStage,
      timerSeconds: time,
      timerRunning: running,
    });
  };

  const handleAssignToDentist = async () => {
    if (!activeAppointment) {
      toast.error('No scheduled appointment found for today.');
      return;
    }
    const doctorId = activeAppointment.assignedDoctorId || activeAppointment.dentistId;
    if (doctorId && !activeAppointment.assignedDoctorId) {
      const assignRes = await assignDoctor(activeAppointment.id, doctorId);
      if (!assignRes.success) {
        toast.error(assignRes.error || 'Failed to assign dentist.');
        return;
      }
    }
    const res = await advanceStage(activeAppointment.id, 'TREATMENT_PENDING');
    if (res.success) {
      toast.success('Patient assigned to Dentist — treatment can begin.');
      fetchAppointments();
    } else {
      toast.error(res.error || 'Failed to assign to Dentist.');
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
        return <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold animate-pulse">In Prep</Badge>;
      case 'TREATMENT_PENDING':
        return <Badge className="bg-purple-500/10 text-purple-500 border border-purple-500/20 font-bold">Assigned to Dentist</Badge>;
      case 'CLEANING_PENDING':
        return <Badge className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold animate-pulse">In Hygiene</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">Completed</Badge>;
      default:
        return <Badge variant="secondary">{stage}</Badge>;
    }
  };

  if (sessionLoading && appointmentId) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-xs font-semibold">Loading chairside session...</span>
      </div>
    );
  }

  return (
    <div className={isDetailPage ? 'w-full text-left animate-fade-in' : 'grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in text-left'}>
      {!isDetailPage && (
        <div className="lg:col-span-1 bg-card border border-border p-4 rounded-3xl shadow-sm space-y-4">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary" /> Active Queue
            </h3>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {todayPatients.length === 0 ? (
              <p className="text-xs text-muted-foreground font-semibold italic text-center py-6">No patients scheduled today</p>
            ) : (
              todayPatients.map((p) => {
                const isActive = p.id === activePatientId;
                return (
                  <div
                    key={p.id}
                    onClick={() => handlePatientSelect(p.id)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      isActive ? 'bg-primary/5 border-primary shadow-xs' : 'bg-muted/10 border-border hover:bg-muted/30 hover:border-border/80'
                    }`}
                  >
                    <h4 className={`text-xs font-black truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{p.name}</h4>
                    <span className="text-[8px] text-muted-foreground font-semibold block mt-0.5">{p.treatmentType}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <div className={isDetailPage ? 'w-full space-y-6' : 'lg:col-span-2 space-y-6'}>
        {activePatient ? (
          <>
            <div className="bg-card border border-border p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-black text-foreground">{activePatient.name}</h3>
                  <Badge variant="secondary" className="text-[9px] font-bold">ID: #{activePatient.displayId || activePatient.id}</Badge>
                </div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Dentist: {activePatient.dentistName} &bull; Vitals: {activeDentistPatient.vitals || 'BP: 120/80'} &bull; Allergies:{' '}
                  <span className="text-rose-500 font-bold">{activeDentistPatient.allergies || 'None'}</span>
                </p>
              </div>
              {activeAppointment && (
                <div className="flex items-center gap-2">
                  {getStageBadge(activeAppointment.workflowStage)}
                  {(activeAppointment.workflowStage === 'CHECKED_IN' || activeAppointment.workflowStage === 'IN_PROGRESS') && (
                    <Button size="sm" onClick={handleAssignToDentist} className="font-bold text-xs gap-1 cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-3">
                      <UserCheck className="h-4 w-4" /> Assign to Dentist
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Sanitization Checklist
                </h3>
                <div className="space-y-3">
                  {sterilizationTasks.map((t) => (
                    <label key={t.id} className="flex items-start gap-3 p-3 bg-muted/20 hover:bg-muted/40 border border-border/60 hover:border-border rounded-xl cursor-pointer transition-colors text-left">
                      <input type="checkbox" disabled={isLocked} checked={t.completed} onChange={() => handleTaskToggle(t.id)} className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer" />
                      <span className={`text-xs font-semibold ${t.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.text}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  Instrument Setup
                </h3>
                <div className="space-y-3">
                  {instrumentTasks.map((t) => (
                    <label key={t.id} className="flex items-start gap-3 p-3 bg-muted/20 hover:bg-muted/40 border border-border/60 hover:border-border rounded-xl cursor-pointer transition-colors text-left">
                      <input type="checkbox" disabled={isLocked} checked={t.completed} onChange={() => handleTaskToggle(t.id)} className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer" />
                      <span className={`text-xs font-semibold ${t.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-foreground">Visit Stage Progression</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Intake', 'Prep', 'Assist', 'Post-Op'].map((stage) => (
                    <button
                      key={stage}
                      disabled={isLocked}
                      onClick={() => handleStageChange(stage)}
                      className={`py-2 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                        activeStage === stage ? 'bg-primary border-primary text-primary-foreground shadow-sm' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
                <div className="space-y-2 border-t border-border/60 pt-3 text-left">
                  {stageTasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 py-1 text-xs">
                      <input type="checkbox" disabled={isLocked} checked={t.completed} onChange={() => handleTaskToggle(t.id)} className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer" />
                      <span className={`font-semibold ${t.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                  <Clipboard className="h-4 w-4 text-primary" /> Timer
                </h3>
                <div className="flex flex-col items-center justify-center py-4 bg-muted/30 border border-border rounded-xl space-y-3">
                  <div className="text-3xl font-black font-mono tracking-widest text-foreground select-none">{formatTime(time)}</div>
                  <div className="flex gap-2">
                    {timerOn ? (
                      <Button size="xs" variant="outline" onClick={() => handleTimerToggle(false)} className="font-bold text-[10px] gap-1 border-amber-500/20 text-amber-500 hover:bg-amber-500/10 h-8 px-3 cursor-pointer">
                        <Pause className="h-3.5 w-3.5" /> Pause
                      </Button>
                    ) : (
                      <Button size="xs" onClick={() => handleTimerToggle(true)} className="font-bold text-[10px] gap-1 h-8 px-3 cursor-pointer">
                        <Play className="h-3.5 w-3.5" /> Start
                      </Button>
                    )}
                    <Button size="xs" variant="ghost" onClick={resetTimer} className="font-bold text-[10px] gap-1 text-muted-foreground hover:text-foreground h-8 px-2 cursor-pointer" disabled={time === 0}>
                      <RotateCcw className="h-3 w-3" /> Reset
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-card border border-border p-16 rounded-3xl text-center flex flex-col items-center justify-center space-y-4 h-[60vh]">
            <AlertCircle className="h-10 w-10 text-muted-foreground/60 stroke-1 animate-pulse" />
            <h3 className="text-base font-bold text-foreground">Select Patient Workspace</h3>
            <p className="text-xs text-muted-foreground font-semibold">Choose a patient from the queue to start setting up chairside tools and session checklists.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChairsideToolsPage;
