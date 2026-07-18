import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FileText, Save, AlertCircle, Clipboard, Plus, Sparkles, UserCheck, Activity, Clock } from 'lucide-react';
import { useDentalAssistantStore } from '../../../store/dentalAssistantStore';
import { useAppointmentStore } from '../../../store/appointmentStore';
import { useDentistStore } from '../../../store/dentistStore';
import { useAINotesStore } from '../../../store/aiNotesStore';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Badge } from '../../../shared/ui/Badge';
import { useToast } from '../../../shared/hooks/useToast';
import { Modal } from '../../../shared/ui/Modal';

export function ClinicalNotesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get('id');
  const isDetailPage = location.pathname.startsWith('/assistant/patients/');
  const toast = useToast();

  const {
    todayPatients,
    activePatientId,
    setActivePatientId,
    fetchTodayPatients,
    saveAssistantNote,
    quickTemplates,
    addQuickTemplate,
    assistantActions,
    addAssistantAction
  } = useDentalAssistantStore();
  const { appointments, fetchAppointments, advanceStage, assignDoctor } = useAppointmentStore();
  const { patients: dentistPatients, fetchPatients } = useDentistStore();

  const activePatient = useMemo(() => {
    let pat = todayPatients.find((p) => p.id === activePatientId);
    if (!pat && activePatientId && dentistPatients.length > 0) {
      const dentistPatient = dentistPatients.find((dp) => dp.id === activePatientId);
      if (dentistPatient) {
        const apt = appointments.find((a) => a.patientId === activePatientId);
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
  }, [todayPatients, activePatientId, dentistPatients, appointments]);

  const activeDentistPatient = useMemo(() => dentistPatients.find((p) => p.id === activePatientId) || {}, [dentistPatients, activePatientId]);

  const activeAppointment = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.find((a) => a.patientId === activePatientId && a.date === today)
      || appointments.find((a) => a.patientId === activePatientId);
  }, [appointments, activePatientId]);
  const isLocked = false; // Always editable for Dental Assistant
  const rawDbNotes = useDentistStore((state) => state.clinicalNotes[activePatientId]);
  const dbNotes = rawDbNotes || [];
  const fetchPatientDetails = useDentistStore((state) => state.fetchPatientDetails);

  useEffect(() => {
    if (activePatientId) {
      fetchPatientDetails(activePatientId);
    }
  }, [activePatientId, fetchPatientDetails]);

  // Form State
  const [dentistName, setDentistName] = useState(() => activePatient?.dentistName || activePatient?.assignedDoctorName || 'Not Assigned');
  const [procedureType, setProcedureType] = useState(() => activePatient?.treatmentType || 'General Dental');

  useEffect(() => {
    if (activePatient) {
      setDentistName(activePatient.dentistName || activePatient.assignedDoctorName || 'Not Assigned');
      setProcedureType(activePatient.treatmentType || 'General Dental');
    }
  }, [activePatient]);
  const [observations, setObservations] = useState('');

  useEffect(() => {
    if (activePatient?.dentistName) {
      setDentistName(activePatient.dentistName);
    }
  }, [activePatient?.dentistName]);

  const generateNote = useAINotesStore((state) => state.generateNote);
  const isGenerating = useAINotesStore((state) => state.isGenerating);

  // Actions Checkboxes state
  const [actions, setActions] = useState(() => {
    const initialActions = {};
    initialActions['sterilization'] = true;
    initialActions['instruments'] = true;
    return initialActions;
  });

  // Modal States
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateLabel, setNewTemplateLabel] = useState('');
  const [newTemplateText, setNewTemplateText] = useState('');

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [newActionLabel, setNewActionLabel] = useState('');

  useEffect(() => {
    fetchTodayPatients();
    fetchAppointments();
    fetchPatients();
  }, []);

  useEffect(() => {
    if (paramPatientId) {
      setActivePatientId(paramPatientId);
    }
  }, [paramPatientId]);

  // Keep actions sync with store actions when user adds custom actions
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActions(prev => {
      const next = { ...prev };
      assistantActions.forEach(act => {
        if (next[act.key] === undefined) {
          next[act.key] = false;
        }
      });
      return next;
    });
  }, [assistantActions]);

  const handlePatientSelect = (pId) => {
    navigate(`/assistant/notes?id=${pId}`);
  };

  const handleGenerateAINote = async () => {
    if (!activePatientId) {
      toast.error('Select a patient context first.');
      return;
    }
    toast.info('Generating AI structured assistant note...', 'Clinical AI Gen Active');
    const noteText = await generateNote({
      patientName: activePatient?.name,
      treatmentType: activePatient?.treatmentType || 'General Dental'
    });
    
    const spacer = observations ? '\n\n' : '';
    setObservations((prev) => prev + spacer + noteText);
    toast.success('AI note successfully compiled.');
  };

  const handleAddCustomTemplate = (e) => {
    e.preventDefault();
    if (!newTemplateLabel.trim() || !newTemplateText.trim()) return;
    const idVal = `tmpl_${Date.now()}`;
    addQuickTemplate({
      id: idVal,
      label: newTemplateLabel.trim(),
      text: newTemplateText.trim()
    });
    setObservations(newTemplateText.trim());
    setNewTemplateLabel('');
    setNewTemplateText('');
    setIsTemplateModalOpen(false);
  };

  const handleAddCustomAction = (e) => {
    e.preventDefault();
    if (!newActionLabel.trim()) return;
    const labelVal = newActionLabel.trim();
    const keyVal = labelVal.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    addAssistantAction({
      key: keyVal,
      label: labelVal
    });
    setActions(prev => ({ ...prev, [keyVal]: true }));
    setNewActionLabel('');
    setIsActionModalOpen(false);
  };

  const handleToggleAction = (key) => {
    setActions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!activePatientId) return;
    if (!observations.trim()) return;

    const selectedActions = [];
    assistantActions.forEach(act => {
      if (actions[act.key]) {
        selectedActions.push(act.label);
      }
    });

    const result = await saveAssistantNote(activePatientId, {
      dentistName,
      procedureType: activePatient?.treatmentType || procedureType,
      observations,
      actions: selectedActions
    });

    if (result.success) {
      toast.success('Clinical note saved to database.');
      await fetchPatientDetails(activePatientId);
      setObservations('');
      setActions(() => {
        const reset = {};
        assistantActions.forEach(act => {
          reset[act.key] = act.key === 'sterilization' || act.key === 'instruments';
        });
        return reset;
      });
    } else {
      toast.error(result.error || 'Failed to save clinical note.');
    }
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
      toast.success('Patient record successfully passed to Dentist!');
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

  return (
    <div className={isDetailPage ? "w-full text-left animate-fade-in" : "grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in text-left"}>
      {/* ─── LEFT COLUMN: Patient Queue ─── */}
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
                      isActive
                        ? 'bg-primary/5 border-primary shadow-xs'
                        : 'bg-muted/10 border-border hover:bg-muted/30 hover:border-border/80'
                    }`}
                  >
                    <h4 className={`text-xs font-black truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {p.name}
                    </h4>
                    <span className="text-[8px] text-muted-foreground font-semibold block mt-0.5">
                      {p.treatmentType}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── RIGHT COLUMN: Workspace Detail ─── */}
      <div className={isDetailPage ? "w-full space-y-6" : "lg:col-span-2 space-y-6"}>
        {activePatient ? (
          <>
            {/* Vitals Summary Card */}
            <div className="bg-card border border-border p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-black text-foreground">{activePatient.name}</h3>
                  <Badge variant="secondary" className="text-[9px] font-bold">ID: #{activePatient.displayId || activePatient.id}</Badge>
                </div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Dentist: {activePatient.dentistName} &bull; Vitals: {activeDentistPatient.vitals || 'BP: 120/80'} &bull; Allergies: <span className="text-rose-500 font-bold">{activeDentistPatient.allergies || 'None'}</span>
                </p>
              </div>

              {activeAppointment && (
                <div className="flex items-center gap-2">
                  {getStageBadge(activeAppointment.workflowStage)}
                  {(activeAppointment.workflowStage === 'CHECKED_IN' || activeAppointment.workflowStage === 'IN_PROGRESS') && (
                    <Button
                      size="sm"
                      onClick={handleAssignToDentist}
                      className="font-bold text-xs gap-1 cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-3"
                    >
                      <UserCheck className="h-4 w-4" /> Assign to Dentist
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Notes Form and History */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form Entry */}
              {isLocked ? (
                <div className="md:col-span-2 bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                  <AlertCircle className="h-10 w-10 text-amber-500 animate-pulse" />
                  <h4 className="text-sm font-bold text-foreground">Assistant Workspace Signed Off</h4>
                  <p className="text-xs text-muted-foreground font-semibold max-w-sm leading-relaxed">
                    This patient's assistant intake protocols are completed. The session has been assigned to the Dentist or passed to Hygiene, and modifications are locked.
                  </p>
                </div>
              ) : (
                <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-sm text-foreground">New Clinical Entry</h3>

                  {/* Templates */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Quick Templates</label>
                      <button
                        type="button"
                        onClick={() => setIsTemplateModalOpen(true)}
                        className="text-[10px] font-extrabold text-primary hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Custom
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {quickTemplates.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => {
                            setObservations(tmpl.text);
                            toast.info(`Applied: ${tmpl.label}`);
                          }}
                          className="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-xl text-[10px] font-bold text-foreground cursor-pointer transition-colors"
                        >
                          📝 {tmpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSaveNote} className="space-y-4 text-xs font-semibold">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Dentist Provider" value={dentistName} onChange={(e) => setDentistName(e.target.value)} className="text-xs font-medium" />
                      <Input label="Procedure category" value={activePatient?.treatmentType || procedureType} onChange={(e) => setProcedureType(e.target.value)} disabled={!!activePatient} className="text-xs font-medium" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Clinical Observations & notes *</label>
                        <button
                          type="button"
                          onClick={handleGenerateAINote}
                          disabled={isGenerating}
                          className="text-[10px] font-extrabold text-primary hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer select-none"
                        >
                          {isGenerating ? (
                            <>
                              <Clock className="h-3.5 w-3.5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 text-primary" />
                              Generate AI Note
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Enter clinical observations..."
                        rows={5}
                        className="w-full text-xs font-medium bg-muted border border-border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Actions Undertaken</label>
                        <button
                          type="button"
                          onClick={() => setIsActionModalOpen(true)}
                          className="text-[10px] font-extrabold text-primary hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Action
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {assistantActions.map((act) => (
                          <label key={act.key} className="flex items-center gap-2.5 p-2 bg-muted/30 border border-border/60 hover:border-border rounded-xl cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!actions[act.key]}
                              onChange={() => handleToggleAction(act.key)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                            />
                            <span className="text-[11px] font-bold text-foreground">{act.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-10 gap-1.5 font-bold cursor-pointer" disabled={!observations.trim()}>
                      <Save className="h-4 w-4" /> Save clinical observations
                    </Button>
                  </form>
                </div>
              )}

              {/* History list */}
              <div className="md:col-span-1 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                  <Clipboard className="h-4 w-4 text-primary" /> Note History
                </h3>
                {dbNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-2 stroke-1" />
                    <p className="text-xs font-bold">No entries found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {dbNotes.map((note) => (
                      <div key={note.id} className="p-3 bg-muted/40 border border-border rounded-xl space-y-2 text-[11px] text-left">
                        <div className="flex justify-between items-center text-[9px] text-muted-foreground font-bold border-b border-border/40 pb-1.5">
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                          <span className="text-primary font-black uppercase">
                            {note.authorName} ({note.authorRole === 'dental_assistant' ? 'Assistant' : note.authorRole === 'hygienist' ? 'Hygienist' : note.authorRole === 'dentist' ? 'Dentist' : note.authorRole})
                          </span>
                        </div>
                        <p className="font-semibold text-foreground leading-normal whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-card border border-border p-16 rounded-3xl text-center flex flex-col items-center justify-center space-y-4 h-[60vh]">
            <FileText className="h-10 w-10 text-muted-foreground/60 stroke-1 animate-pulse" />
            <h3 className="text-base font-bold text-foreground">Select Patient Workspace</h3>
            <p className="text-xs text-muted-foreground font-semibold">Choose a patient from the queue to start recording observations and clinical notes.</p>
          </div>
        )}
      </div>

      {/* Templates Modals */}
      <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Create Assistant Note Template">
        <form onSubmit={handleAddCustomTemplate} className="space-y-4 text-left text-xs font-semibold">
          <Input label="Template Label" value={newTemplateLabel} onChange={(e) => setNewTemplateLabel(e.target.value)} required placeholder="e.g. Scaling Support" />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase block">Template Observation Text</label>
            <textarea value={newTemplateText} onChange={(e) => setNewTemplateText(e.target.value)} required rows={5} className="w-full text-xs bg-muted border border-border rounded-lg p-2.5 focus:outline-none text-foreground font-medium" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Template</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} title="Add Assistant Action Checkbox">
        <form onSubmit={handleAddCustomAction} className="space-y-4 text-left text-xs font-semibold">
          <Input label="Action Label" value={newActionLabel} onChange={(e) => setNewActionLabel(e.target.value)} required placeholder="e.g. Varnish applied" />
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsActionModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Action</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ClinicalNotesPage;
