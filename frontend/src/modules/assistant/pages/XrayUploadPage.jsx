import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Image, Upload, Plus, AlertCircle, FileText, CheckCircle2, UserCheck, Activity } from 'lucide-react';
import { useDentalAssistantStore, resolveFileUrl } from '../../../store/dentalAssistantStore';
import { useAppointmentStore } from '../../../store/appointmentStore';
import { useDentistStore } from '../../../store/dentistStore';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Badge } from '../../../shared/ui/Badge';
import { useToast } from '../../../shared/hooks/useToast';
import { XrayAIViewer } from '../../../shared/ui/XrayAIViewer';
import { Modal } from '../../../shared/ui/Modal';

export function XrayUploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get('id');
  const appointmentIdParam = searchParams.get('appointmentId');
  const isDetailPage = location.pathname.startsWith('/assistant/patients/');
  const toast = useToast();

  const { todayPatients, activePatientId, setActivePatientId, fetchTodayPatients, uploadXray, xrayClassifications, addXrayClassification } = useDentalAssistantStore();
  const { appointments, fetchAppointments, advanceStage, assignDoctor } = useAppointmentStore();
  const { patients: dentistPatients, fetchPatients, fetchPatientDetails, xrays } = useDentistStore();

  const [xrayType, setXrayType] = useState('Bitewing');
  const [notes, setNotes] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Modal State for custom classification
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [newClassification, setNewClassification] = useState('');

  useEffect(() => {
    fetchTodayPatients();
    fetchAppointments();
    fetchPatients();
  }, []);

  useEffect(() => {
    if (paramPatientId) {
      setActivePatientId(paramPatientId);
      fetchPatientDetails(paramPatientId);
    }
  }, [paramPatientId, setActivePatientId, fetchPatientDetails]);

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
  const isLocked = false;

  const patientXrays = useMemo(() => {
    return xrays[activePatientId] || [];
  }, [xrays, activePatientId]);

  const handlePatientSelect = (pId) => {
    navigate(`/assistant/xray?id=${pId}`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!activePatientId) {
      toast.error('Please select an active patient context first.');
      return;
    }
    if (!selectedFile) {
      toast.error('Please select a radiograph file to upload.');
      return;
    }

    setUploading(true);
    const result = await uploadXray(activePatientId, { type: xrayType, notes }, selectedFile);
    setUploading(false);

    if (result.success) {
      toast.success(`Successfully uploaded ${xrayType} radiograph for ${activePatient?.name || 'patient'}.`);
      setFileName('');
      setSelectedFile(null);
      setNotes('');
      setFilePreview(null);
      await fetchPatientDetails(activePatientId);
    } else {
      toast.error(result.error || 'Failed to upload radiograph.');
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

            {/* Split Uploader and Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form uploader */}
              {isLocked ? (
                <div className="md:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                  <AlertCircle className="h-10 w-10 text-amber-500 animate-pulse" />
                  <h4 className="text-sm font-bold text-foreground">Upload Disabled</h4>
                  <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                    This patient has been passed to the Dentist/Hygienist. Uploading new radiographs is locked.
                  </p>
                </div>
              ) : (
                <div className="md:col-span-1 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-sm text-foreground">Upload Scan</h3>
                  
                  <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-semibold">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">X-Ray Classification *</label>
                        <button
                          type="button"
                          onClick={() => setIsClassModalOpen(true)}
                          className="text-[10px] font-extrabold text-primary hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Add Custom
                        </button>
                      </div>
                      <select
                        value={xrayType}
                        onChange={(e) => setXrayType(e.target.value)}
                        className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
                      >
                        {xrayClassifications.map((t) => (
                          <option key={t} value={t}>{t} scan</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Select Radiograph File *</label>
                      <div className="border border-dashed border-border hover:border-primary bg-muted/30 hover:bg-muted/60 rounded-xl p-6 text-center transition-all cursor-pointer relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {filePreview ? (
                          <div className="space-y-2 flex flex-col items-center">
                            <img src={filePreview} alt="X-ray preview" className="h-20 w-20 object-cover rounded-lg border border-border shadow-sm" />
                            <p className="text-[10px] font-bold text-emerald-500 truncate max-w-xs">{fileName}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                            <p className="text-xs text-foreground font-bold">Drag files or click to browse</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Input
                      label="Diagnosis notes / Observations"
                      placeholder="e.g. Bone levels review..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="text-xs font-medium"
                    />

                    <Button type="submit" className="w-full h-10 gap-1.5 font-bold cursor-pointer" disabled={!selectedFile || uploading}>
                      <Plus className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Save Radiograph'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Radiographs Gallery */}
              <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-foreground">Radiographs Gallery</h3>
                {patientXrays.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-2 stroke-1" />
                    <p className="text-xs font-bold">No radiographs loaded</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5">Upload a scan for this patient to build history.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {patientXrays.map((x) => {
                      const typeMatch = x.notes?.match(/^\[([^\]]+)\]/);
                      const xType = typeMatch ? typeMatch[1] : 'X-Ray';
                      const displayNotes = x.notes?.replace(/^\[[^\]]+\]\s*/, '') || 'No notes added.';
                      const imageUrl = resolveFileUrl(x.fileUrl);
                      const displayDate = x.date instanceof Date
                        ? x.date.toISOString().split('T')[0]
                        : (typeof x.date === 'string' ? x.date.split('T')[0] : x.date);

                      return (
                      <div key={x.id} className="border border-border/80 bg-muted/30 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="aspect-[4/3] bg-slate-950 flex items-center justify-center relative">
                          {imageUrl ? (
                            <img src={imageUrl} alt={x.name} className="absolute inset-0 w-full h-full object-cover opacity-90" />
                          ) : (
                            <div className="absolute inset-0 bg-cover bg-center opacity-85" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1576086213369-97a306d36557?w=300')` }} />
                          )}
                          <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay" />
                          <span className="absolute top-2 left-2 text-[8px] font-black uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-md shadow-sm">{xType}</span>
                          <span className="absolute bottom-2 right-2 text-[8px] font-semibold text-white bg-slate-900/80 px-2 py-0.5 rounded-md shadow-sm">{displayDate}</span>
                        </div>
                        <div className="p-3.5 space-y-1.5 text-left">
                          <div className="flex items-center gap-1 text-xs font-extrabold text-foreground">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate max-w-[140px]">{x.name}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-semibold leading-normal">{displayNotes}</p>
                          <div className="flex items-center gap-1 border-t border-border/40 pt-1.5 text-[8px] font-bold text-emerald-500">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Saved to database
                          </div>
                        </div>
                      </div>
                    );})}
                  </div>
                )}
              </div>
            </div>

            <XrayAIViewer patientName={activePatient?.name} patientId={activePatientId} />
          </>
        ) : (
          <div className="bg-card border border-border p-16 rounded-3xl text-center flex flex-col items-center justify-center space-y-4 h-[60vh]">
            <Image className="h-10 w-10 text-muted-foreground/60 stroke-1 animate-pulse" />
            <h3 className="text-base font-bold text-foreground">Select Patient Workspace</h3>
            <p className="text-xs text-muted-foreground font-semibold">Choose a patient from the queue to start review or upload scan radiographs.</p>
          </div>
        )}
      </div>

      {/* Custom Classification Modal */}
      <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Add Custom X-Ray Classification">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newClassification.trim()) return;
            const val = newClassification.trim();
            addXrayClassification(val);
            setXrayType(val);
            setNewClassification('');
            setIsClassModalOpen(false);
          }}
          className="space-y-4 text-left text-xs font-semibold"
        >
          <Input label="Classification Name" value={newClassification} onChange={(e) => setNewClassification(e.target.value)} required placeholder="e.g. Cone Beam, 3D Scan" />
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsClassModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Classification</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default XrayUploadPage;
