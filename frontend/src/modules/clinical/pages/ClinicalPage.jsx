import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Activity,
  Image as ImageIcon,
  Truck,
  Upload,
  Layers,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Clock
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { usePatientStore } from '../../../store/patientStore';
import { useLabStore } from '../../../store/labStore';
import { useDentistStore } from '../../../store/dentistStore';
import api from '../../../shared/utils/api';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { Badge } from '../../../shared/ui/Badge';
import { useToast } from '../../../shared/hooks/useToast';
import { Modal } from '../../../shared/ui/Modal';
import { MedicalAlertBanner } from '../../../shared/ui/MedicalAlertBanner';
import { PatientTimeline } from '../../../shared/ui/PatientTimeline';
import { CasePresentation } from '../../../shared/ui/CasePresentation';
import { ClinicalTestSandbox } from '../../../shared/ui/ClinicalTestSandbox';

// Mock X-Rays
const MOCK_XRAYS = [
  { id: 'xr-1', label: 'Panoramic Radiograph', date: '2026-05-14', url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=400' },
  { id: 'xr-2', label: 'Bitewing Right Posterior', date: '2026-05-14', url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400' },
  { id: 'xr-3', label: 'Periapical Tooth #14', date: '2026-04-20', url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400' }
];


const STANDARD_CONSENTS = {
  Extraction: "INFORMED CONSENT FOR TOOTH EXTRACTION\n\nI hereby authorize the clinical dentist to perform the extraction of the specified teeth. I understand that tooth extraction is an irreversible surgical procedure. The alternative treatment options (like restorative fillings or root canal therapy) have been discussed with me. I recognize the common risks of swelling, bruising, temporary or permanent paresthesia/numbness, root displacement, and bleeding. I agree to strictly follow the post-operative care instructions.",
  Implant: "INFORMED CONSENT FOR DENTAL IMPLANT PLACEMENT\n\nI authorize the surgical placement of a titanium dental implant inside my jawbone. I understand this is a multi-stage procedure taking 3 to 6 months for complete osseointegration. Alternatives like bridges or partial dentures have been explained. I recognize the risks of infection, sinus involvement, implant failure, bone integration rejection, nerve injury, or swelling. I confirm that I have disclosed all medical history including osteoporotic medicines or anticoagulants.",
  RCT: "INFORMED CONSENT FOR ENDODONTIC TREATMENT (ROOT CANAL)\n\nI authorize the dentist to perform root canal therapy on the specified tooth structure. I understand that the goal of RCT is to remove inflamed pulp tissues to preserve my natural tooth. I understand that despite high success rates, endodontic therapy can fail, requiring retreatment, apicoectomy, or extraction. I recognize that root-treated teeth are fragile and require a post-treatment crown to prevent fractures."
};

// Default perio chart structure for 32 teeth
const createDefaultPerioData = () => {
  const data = {};
  for (let i = 1; i <= 32; i++) {
    data[i] = { pocketDepth: [3, 2, 3], recession: [0, 0, 0], bop: [false, false, false], mobility: 0, furcation: 0 };
  }
  return data;
};

export function ClinicalPage() {
  const user = useAuthStore((state) => state.user);
  const patients = usePatientStore((state) => state.patients);
  const toast = useToast();

  const { labCases, fetchLabCases } = useLabStore();
  const {
    consentForms, fetchConsentForms, createConsentForm, updateConsentForm,
    clinicalTemplates, fetchProcedureTemplates, saveClinicalNote,
    treatmentPlans: dbTreatmentPlans, fetchPatientDetails, addProcedure, updateProcedureStatus, deleteProcedure
  } = useDentistStore();

  const [activeTab, setActiveTab] = useState(() => {
    if (user?.role === 'lab_coordinator') return 'lab';
    if (user?.role === 'assistant') return 'imaging';
    return 'notes';
  });

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const activePatient = patients.find((p) => p.id === selectedPatientId) || null;
  const [noteTemplate, setNoteTemplate] = useState('');
  const [clinicalNote, setClinicalNote] = useState('');

  // Treatment plan new item form state
  const [newPlanText, setNewPlanText] = useState('');
  const [newPlanCost, setNewPlanCost] = useState('150');

  // DB-backed treatment plans for selected patient
  const treatmentPlans = selectedPatientId ? (dbTreatmentPlans[selectedPatientId] || []) : [];

  // Perio Chart State — loaded from DB, saved to DB
  const [perioData, setPerioData] = useState(createDefaultPerioData);
  const [perioSaving, setPerioSaving] = useState(false);
  const [activePerioTooth, setActivePerioTooth] = useState(1);

  // Digital Consent Form states
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [consentType, setConsentType] = useState('Extraction');
  const [consentContent, setConsentContent] = useState(STANDARD_CONSENTS.Extraction);
  const [activeConsent, setActiveConsent] = useState(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchLabCases();
    fetchProcedureTemplates();
  }, [fetchLabCases, fetchProcedureTemplates]);

  // Load patient data including perio chart from DB when patient changes
  useEffect(() => {
    if (selectedPatientId) {
      fetchConsentForms(selectedPatientId);
      fetchPatientDetails(selectedPatientId);
      // Load perio chart from patient record
      api.get(`/patients/${selectedPatientId}`).then(({ data }) => {
        if (data.success && data.data?.perioChartData) {
          try {
            let parsed = typeof data.data.perioChartData === 'string'
              ? JSON.parse(data.data.perioChartData)
              : data.data.perioChartData;
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
            if (parsed && typeof parsed === 'object') {
              setPerioData(parsed);
            }
          } catch (_e) {
            setPerioData(createDefaultPerioData());
          }
        } else {
          setPerioData(createDefaultPerioData());
        }
      }).catch(() => setPerioData(createDefaultPerioData()));
    }
  }, [selectedPatientId, fetchConsentForms, fetchPatientDetails]);

  // Update consent content preview when type changes - deferred to avoid setState-in-effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setConsentContent(STANDARD_CONSENTS[consentType] || '');
    }, 0);
    return () => clearTimeout(timer);
  }, [consentType]);

  const getToothPerio = (num) => {
    const raw = perioData[num];
    if (!raw) {
      return { pocketDepth: [3, 2, 3], recession: [0, 0, 0], bop: [false, false, false], mobility: 0, furcation: 0 };
    }
    if (Array.isArray(raw)) {
      return { pocketDepth: raw, recession: [0, 0, 0], bop: [false, false, false], mobility: 0, furcation: 0 };
    }
    return {
      pocketDepth: raw.pocketDepth || [3, 2, 3],
      recession: raw.recession || [0, 0, 0],
      bop: raw.bop || [false, false, false],
      mobility: raw.mobility || 0,
      furcation: raw.furcation || 0
    };
  };

  const calculateAAPStage = () => {
    let maxPD = 0;
    let maxCAL = 0;
    let hasSevereFurc = false;
    let hasSevereMobility = false;
    let totalBOPPoints = 0;

    for (let i = 1; i <= 32; i++) {
      const tooth = getToothPerio(i);
      const pd = Math.max(...tooth.pocketDepth);
      const rec = Math.max(...tooth.recession);
      const cal = pd + rec;

      if (pd > maxPD) maxPD = pd;
      if (cal > maxCAL) maxCAL = cal;
      if (tooth.furcation >= 2) hasSevereFurc = true;
      if (tooth.mobility >= 2) hasSevereMobility = true;
      
      totalBOPPoints += tooth.bop.filter(Boolean).length;
    }

    const bopPercentage = Math.round((totalBOPPoints / 96) * 100);

    const perioStage = (() => {
      if (maxPD <= 3 && maxCAL <= 3) return 'Healthy / Gingivitis';
      if (maxPD <= 4 && maxCAL <= 4) return 'Stage I (Mild Periodontitis)';
      if (maxPD <= 5 && maxCAL <= 5) return 'Stage II (Moderate Periodontitis)';
      if (hasSevereFurc || hasSevereMobility || maxPD >= 7) return 'Stage IV (Advanced Periodontitis)';
      return 'Stage III (Severe Periodontitis)';
    })();
    return { stage: perioStage, bopPercentage, maxPD, maxCAL };
  };

  const aapSummary = calculateAAPStage();

  // Treatment plans sourced from dentistStore (DB-backed) — no local mock state

  // X-Ray upload state simulator
  const [xrays, setXrays] = useState(MOCK_XRAYS);

  // Templates text mappings
  const handleTemplateChange = (e) => {
    const val = e.target.value;
    setNoteTemplate(val);
    const tmpl = clinicalTemplates.find(t => t.id === val || t.label === val);
    if (tmpl) {
      setClinicalNote(tmpl.text);
    } else if (val === 'exam') {
      setClinicalNote(
        `COMPREHENSIVE EXAM:\n- Chief Complaint: General Checkup\n- Soft Tissue: WNL (Within Normal Limits)\n- Occlusion: Class I\n- Perio: Mild gingivitis, localized pocketing of 4mm on molars.\n- Plan: Recall 6 months.`
      );
    } else if (val === 'cleaning') {
      setClinicalNote(
        `PROPHYLAXIS / HYGIENE:\n- Plaque/Calculus: Light to Moderate\n- Scaling: Hand scaling completed.\n- Polishing: Prophy paste coarse mint.\n- Fluoride: Varnish applied.\n- Patient Ed: Re-instructed on flossing molar areas.`
      );
    } else if (val === 'endo') {
      setClinicalNote(
        `ENDODONTIC TREATMENT:\n- Diagnosis: Irreversible Pulpitis #14\n- Anesthesia: 1 carpule Lidocaine 2% with 1:100k epi.\n- Access: Obtained through occlusal.\n- Working Lengths: MB 19mm, DB 18.5mm, P 21mm.\n- Irrigation: NaOCl 2.5%.\n- Temporary: Cavit applied.`
      );
    }
  };

  // Save Notes Action
  const handleSaveNote = async () => {
    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;
    await saveClinicalNote(selectedPatientId, clinicalNote);
    toast.success(`Clinical note successfully saved to ${patient.name}'s medical chart.`);
  };

  // Edit Tooth Perio Metrics
  const handlePerioChange = (toothNum, field, index, value) => {
    setPerioData((prev) => {
      const current = getToothPerio(toothNum);
      let updatedField;
      if (index !== null && Array.isArray(current[field])) {
        updatedField = current[field].map((val, idx) => (idx === index ? value : val));
      } else {
        updatedField = value;
      }
      return {
        ...prev,
        [toothNum]: {
          ...current,
          [field]: updatedField
        }
      };
    });
  };

  // Save perio chart to DB
  const handleSavePerioChart = async () => {
    if (!selectedPatientId) {
      toast.warning('Please select a patient first.');
      return;
    }
    setPerioSaving(true);
    try {
      await api.put(`/patients/${selectedPatientId}/perio-chart`, { perioChartData: perioData });
      toast.success('Periodontal chart saved to patient EMR successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save periodontal chart.');
    } finally {
      setPerioSaving(false);
    }
  };

  // Add Treatment Plan item (DB-backed)
  const handleAddPlan = async (e) => {
    e.preventDefault();
    if (!newPlanText || !selectedPatientId) {
      toast.warning('Please select a patient and enter a procedure description.');
      return;
    }
    await addProcedure(selectedPatientId, {
      tooth: 'General',
      procedure: newPlanText,
      cost: Number(newPlanCost) || 0
    });
    setNewPlanText('');
    toast.success('Treatment procedure added and saved to patient record.');
  };

  // Cycle treatment plan status (DB-backed)
  const handleTogglePlanStatus = async (id) => {
    if (!selectedPatientId) return;
    const item = treatmentPlans.find(p => p.id === id);
    if (!item) return;
    const nextStatus = item.status === 'Proposed' ? 'Accepted' : item.status === 'Accepted' ? 'In_Progress' : item.status === 'In_Progress' ? 'Completed' : 'Proposed';
    await updateProcedureStatus(selectedPatientId, id, nextStatus);
  };

  // Delete Treatment Plan item (DB-backed)
  const handleDeletePlan = async (id) => {
    if (!selectedPatientId) return;
    await deleteProcedure(selectedPatientId, id);
    toast.success('Procedure removed from treatment plan.');
  };

  // Mock Upload X-Ray
  const handleXrayUpload = () => {
    const name = prompt('Enter X-Ray label/name:');
    if (!name) return;
    setXrays((prev) => [
      {
        id: `xr-${Date.now()}`,
        label: name,
        date: new Date().toISOString().split('T')[0],
        url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400'
      },
      ...prev
    ]);
    toast.success(`X-Ray Scan "${name}" uploaded successfully.`);
  };

  // Digital Signature drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSignConsentSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureBase64 = canvas.toDataURL();
    await updateConsentForm(selectedPatientId, activeConsent.id, {
      signature: signatureBase64,
      status: 'Signed',
      signedAt: new Date().toISOString()
    });
    toast.success('Informed consent digitally signed and saved to Patient EMR archive!');
    setIsSignModalOpen(false);
    setActiveConsent(null);
  };

  const handleCreateConsentSubmit = async (e) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;
    await createConsentForm(selectedPatientId, {
      patientName: patient.name,
      type: consentType,
      content: consentContent
    });
    toast.success(`Proposed ${consentType} consent form successfully created.`);
    setIsConsentModalOpen(false);
  };

  // Check tab permissions
  const tabs = [
    { id: 'notes', label: 'EHR Chart Notes', icon: FileText, allowedRoles: ['super_admin', 'clinic_owner', 'dentist', 'hygienist'] },
    { id: 'timeline', label: 'Clinical Timeline', icon: Clock, allowedRoles: ['super_admin', 'clinic_owner', 'dentist', 'dental_assistant', 'hygienist', 'patient'] },
    { id: 'presentation', label: 'Case Presentation', icon: FileText, allowedRoles: ['super_admin', 'clinic_owner', 'dentist', 'dental_assistant', 'patient'] },
    { id: 'consent', label: 'Digital Consents', icon: FileText, allowedRoles: ['super_admin', 'clinic_owner', 'dentist', 'dental_assistant', 'hygienist', 'patient'] },
    { id: 'perio', label: 'Periodontic Chart', icon: Activity, allowedRoles: ['super_admin', 'clinic_owner', 'dentist', 'hygienist'] },
    { id: 'treatment', label: 'Treatment Plans', icon: Layers, allowedRoles: ['super_admin', 'clinic_owner', 'dentist'] },
    { id: 'imaging', label: 'Imaging & Scans', icon: ImageIcon, allowedRoles: ['super_admin', 'clinic_owner', 'dentist', 'hygienist', 'assistant'] },
    { id: 'lab', label: 'Lab Cases Tracker', icon: Truck, allowedRoles: ['super_admin', 'clinic_owner', 'dentist', 'lab_coordinator'] }
  ];

  const allowedTabs = tabs.filter((t) => t.allowedRoles.includes(user?.role || ''));

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      {/* Title Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Clinical Workspace</h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            Access diagnostic imaging panels, EHR notes, periodontal charts, and prosthetic lab orders.
          </p>
        </div>
        {activePatient && <MedicalAlertBanner patient={activePatient} />}
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-px overflow-x-auto select-none">
        {allowedTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-sm min-h-[50vh]">
        {/* Tab: Timeline */}
        {activeTab === 'timeline' && (
          <PatientTimeline patientId={selectedPatientId} />
        )}

        {/* Tab: Case Presentation */}
        {activeTab === 'presentation' && (
          <CasePresentation patientId={selectedPatientId} />
        )}

        {/* Tab 1: EHR Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-foreground uppercase tracking-wider mb-2">EHR Clinical Progress Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Active Patient File"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                options={[
                  { value: '', label: 'Select Patient' },
                  ...patients.map((p) => ({ value: p.id, label: p.name }))
                ]}
              />
              <Select
                label="Clinical Template"
                value={noteTemplate}
                onChange={handleTemplateChange}
                options={[
                  { value: '', label: 'Select Template' },
                  { value: 'exam', label: 'Standard Hygiene Exam' },
                  { value: 'cleaning', label: 'Prophylaxis/Scaling Note' },
                  { value: 'endo', label: 'Endodontic Root Canal' }
                ]}
              />
            </div>
            
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note Editor</label>
              <textarea
                value={clinicalNote}
                onChange={(e) => setClinicalNote(e.target.value)}
                className="w-full h-64 bg-card border border-border rounded-lg p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all leading-relaxed"
                placeholder="Select a template or begin typing progress notes..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveNote} className="gap-2 select-none font-bold">
                <Save className="h-4 w-4" />
                Sign & Save Note
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Periodontal Charting */}
        {activeTab === 'perio' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex flex-col lg:flex-row justify-between gap-4 border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground uppercase tracking-wider mb-1">Periodontal Examination Chart</h3>
                <p className="text-xs text-muted-foreground font-semibold">Interactive 6-point pocket charting, recessions, BOP bleeding, furcation and mobility audits.</p>
              </div>

              {/* Staging Summary */}
              <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-4 text-xs font-bold self-start">
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase block">AAP Periodontitis Stage</span>
                  <span className="text-primary text-sm font-extrabold">{aapSummary.stage}</span>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase block">BOP / Bleeding Index</span>
                  <span className="text-rose-500 text-sm font-extrabold">{aapSummary.bopPercentage}%</span>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase block">Max PD / CAL</span>
                  <span className="text-foreground text-sm font-extrabold">{aapSummary.maxPD}mm / {aapSummary.maxCAL}mm</span>
                </div>
              </div>
            </div>

            {/* Split layout: 32 Teeth Grid (Left) + Selected Tooth Editor (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Visual Grid of Teeth Arches */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Maxillary Upper Arch */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Maxillary Arch (Teeth 1-16)</span>
                  <div className="grid grid-cols-8 sm:grid-cols-16 gap-2 border border-border/60 p-3 bg-muted/10 rounded-xl overflow-x-auto">
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((tNum) => {
                      const tooth = getToothPerio(tNum);
                      const maxPD = Math.max(...tooth.pocketDepth);
                      const isHighRisk = maxPD >= 4;
                      const hasBop = tooth.bop.some(Boolean);
                      
                      let colorClass = 'bg-card text-foreground border-border hover:bg-muted/30';
                      if (activePerioTooth === tNum) {
                        colorClass = 'bg-primary/10 text-primary border-primary';
                      } else if (isHighRisk) {
                        colorClass = 'bg-rose-500/10 text-rose-600 border-rose-500/30';
                      } else if (hasBop || Math.max(...tooth.recession) > 0) {
                        colorClass = 'bg-amber-500/10 text-amber-600 border-amber-500/30';
                      }

                      return (
                        <button
                          key={tNum}
                          type="button"
                          onClick={() => setActivePerioTooth(tNum)}
                          className={`flex flex-col items-center gap-1.5 p-2 border rounded-lg min-w-[42px] cursor-pointer transition-all hover:scale-105 shadow-sm text-center ${colorClass}`}
                        >
                          <span className="text-[10px] font-extrabold">#{tNum}</span>
                          <div className="text-[8px] font-mono leading-none tracking-tighter">
                            <div>{tooth.pocketDepth.join('')}</div>
                            {Math.max(...tooth.recession) > 0 && <div className="text-amber-500 mt-0.5">-{tooth.recession.join('')}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mandibular Lower Arch */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Mandibular Arch (Teeth 17-32)</span>
                  <div className="grid grid-cols-8 sm:grid-cols-16 gap-2 border border-border/60 p-3 bg-muted/10 rounded-xl overflow-x-auto">
                    {Array.from({ length: 16 }, (_, i) => i + 17).map((tNum) => {
                      const tooth = getToothPerio(tNum);
                      const maxPD = Math.max(...tooth.pocketDepth);
                      const isHighRisk = maxPD >= 4;
                      const hasBop = tooth.bop.some(Boolean);
                      
                      let colorClass = 'bg-card text-foreground border-border hover:bg-muted/30';
                      if (activePerioTooth === tNum) {
                        colorClass = 'bg-primary/10 text-primary border-primary';
                      } else if (isHighRisk) {
                        colorClass = 'bg-rose-500/10 text-rose-600 border-rose-500/30';
                      } else if (hasBop || Math.max(...tooth.recession) > 0) {
                        colorClass = 'bg-amber-500/10 text-amber-600 border-amber-500/30';
                      }

                      return (
                        <button
                          key={tNum}
                          type="button"
                          onClick={() => setActivePerioTooth(tNum)}
                          className={`flex flex-col items-center gap-1.5 p-2 border rounded-lg min-w-[42px] cursor-pointer transition-all hover:scale-105 shadow-sm text-center ${colorClass}`}
                        >
                          <span className="text-[10px] font-extrabold">#{tNum}</span>
                          <div className="text-[8px] font-mono leading-none tracking-tighter">
                            <div>{tooth.pocketDepth.join('')}</div>
                            {Math.max(...tooth.recession) > 0 && <div className="text-amber-500 mt-0.5">-{tooth.recession.join('')}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3.5 bg-muted/40 rounded-xl border border-border/60 flex items-start gap-2.5">
                  <AlertCircle className="h-4.5 w-4.5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                    Legend: Teeth with pocket depths of <span className="text-rose-500 font-bold">4mm+</span> appear in red (bone loss risk). Teeth with recession or bleeding (BOP) appear in <span className="text-amber-500 font-bold">yellow</span>. Select a tooth to view details and update scores.
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Periodontal Scoring Editor */}
              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm text-xs font-semibold space-y-4">
                <div className="border-b border-border pb-3">
                  <h4 className="font-black text-sm uppercase text-primary">Tooth #{activePerioTooth} Perio Editor</h4>
                  <span className="text-[10px] text-muted-foreground">Adjust clinical measurements below to calculate periodontics staging.</span>
                </div>

                {/* Pocket Depths Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Buccal Pocket Depths (mm)</label>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((idx) => (
                      <div key={idx} className="flex-1 text-center">
                        <span className="text-[9px] text-muted-foreground block mb-1">{idx === 0 ? 'Mesial' : idx === 1 ? 'Center' : 'Distal'}</span>
                        <input
                          type="number"
                          min="1"
                          max="9"
                          value={getToothPerio(activePerioTooth).pocketDepth[idx]}
                          onChange={(e) => handlePerioChange(activePerioTooth, 'pocketDepth', idx, Number(e.target.value) || 1)}
                          className="w-full h-9 text-center bg-muted border border-border rounded-lg font-black text-xs outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recession Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Gingival Recession (mm)</label>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((idx) => (
                      <div key={idx} className="flex-1 text-center">
                        <span className="text-[9px] text-muted-foreground block mb-1">{idx === 0 ? 'Mesial' : idx === 1 ? 'Center' : 'Distal'}</span>
                        <input
                          type="number"
                          min="0"
                          max="9"
                          value={getToothPerio(activePerioTooth).recession[idx]}
                          onChange={(e) => handlePerioChange(activePerioTooth, 'recession', idx, Number(e.target.value) || 0)}
                          className="w-full h-9 text-center bg-muted border border-border rounded-lg font-black text-xs outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bleeding on Probing (BOP) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Bleeding on Probing (BOP)</label>
                  <div className="flex gap-2 justify-between">
                    {[0, 1, 2].map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const currentVal = getToothPerio(activePerioTooth).bop[idx];
                          handlePerioChange(activePerioTooth, 'bop', idx, !currentVal);
                        }}
                        className={`flex-1 p-2 border rounded-lg text-center font-bold text-[10px] cursor-pointer transition-all ${
                          getToothPerio(activePerioTooth).bop[idx]
                            ? 'bg-rose-500 text-white border-rose-600'
                            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                        }`}
                      >
                        {idx === 0 ? 'Mesial' : idx === 1 ? 'Center' : 'Distal'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobility & Furcation Grade */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Mobility Class</label>
                    <Select
                      value={getToothPerio(activePerioTooth).mobility}
                      onChange={(e) => handlePerioChange(activePerioTooth, 'mobility', null, Number(e.target.value))}
                      options={[
                        { value: '0', label: 'Class 0 (Normal)' },
                        { value: '1', label: 'Class 1 (Slight)' },
                        { value: '2', label: 'Class 2 (Moderate)' },
                        { value: '3', label: 'Class 3 (Severe)' }
                      ]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Furcation Grade</label>
                    <Select
                      value={getToothPerio(activePerioTooth).furcation}
                      onChange={(e) => handlePerioChange(activePerioTooth, 'furcation', null, Number(e.target.value))}
                      options={[
                        { value: '0', label: 'None' },
                        { value: '1', label: 'Grade I (Incipient)' },
                        { value: '2', label: 'Grade II (Patent)' },
                        { value: '3', label: 'Grade III (Through)' }
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Save perio chart to DB */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSavePerioChart}
                disabled={perioSaving || !selectedPatientId}
                className="gap-2 select-none font-bold"
              >
                <Save className="h-4 w-4" />
                {perioSaving ? 'Saving Chart...' : 'Save Periodontal Chart'}
              </Button>
            </div>
          </div>
        )}


        {/* Tab 3: Treatment Plans */}
        {activeTab === 'treatment' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground uppercase tracking-wider mb-1">Patient Treatment Planner</h3>
                <p className="text-xs text-muted-foreground font-semibold">All procedures are saved to the database and persist across sessions.</p>
              </div>
            </div>

            {!selectedPatientId ? (
              <div className="text-center py-12 text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">Select a patient above to view and edit their treatment plan.</p>
              </div>
            ) : (
              <>
                {/* Add item */}
                <form onSubmit={handleAddPlan} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <Input
                    label="Procedure Description"
                    placeholder="e.g. Resin Composite #12 Buccal"
                    value={newPlanText}
                    onChange={(e) => setNewPlanText(e.target.value)}
                  />
                  <Input
                    label="Estimated Fee ($)"
                    type="number"
                    value={newPlanCost}
                    onChange={(e) => setNewPlanCost(e.target.value)}
                  />
                  <Button type="submit" className="h-10 select-none">
                    Add Procedure
                  </Button>
                </form>

                {/* List */}
                {treatmentPlans.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No treatment procedures yet. Add the first one above.</p>
                  </div>
                ) : (
                  <div className="space-y-3 mt-2">
                    {treatmentPlans.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card hover:bg-muted/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleTogglePlanStatus(item.id)}>
                          <CheckCircle
                            className={`h-5 w-5 transition-colors flex-shrink-0 ${
                              item.status === 'Completed'
                                ? 'text-emerald-500 fill-emerald-500/10'
                                : item.status === 'In_Progress' || item.status === 'Accepted'
                                ? 'text-blue-500 fill-blue-500/10'
                                : 'text-muted-foreground'
                            }`}
                          />
                          <div>
                            <h5 className="text-xs font-bold text-foreground">{item.procedure || item.description}</h5>
                            <span className="text-[10px] text-muted-foreground font-semibold">Tooth: {item.tooth || 'General'} · Fee: ${item.cost}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              item.status === 'Completed' ? 'success'
                              : item.status === 'In_Progress' ? 'info'
                              : item.status === 'Accepted' ? 'info'
                              : 'secondary'
                            }
                            className="text-[10px] font-semibold py-0.5 px-2 cursor-pointer"
                            onClick={() => handleTogglePlanStatus(item.id)}
                          >
                            {item.status?.replace('_', ' ')}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(item.id)}
                            className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove procedure"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab: Digital Consent Forms */}
        {activeTab === 'consent' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground uppercase tracking-wider">Digital Consent Forms</h3>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Create, review, and capture digital patient signatures for informed consents.</p>
              </div>
              <Button onClick={() => setIsConsentModalOpen(true)} className="gap-2 select-none">
                <Plus className="h-4 w-4" />
                New Consent Form
              </Button>
            </div>

            {/* Consent Create Modal */}
            {isConsentModalOpen && (
              <Modal title="Create Informed Consent" onClose={() => setIsConsentModalOpen(false)}>
                <form onSubmit={handleCreateConsentSubmit} className="space-y-4">
                  <Select
                    label="Consent Type"
                    value={consentType}
                    onChange={(e) => setConsentType(e.target.value)}
                    options={[
                      { value: 'Extraction', label: 'Tooth Extraction Consent' },
                      { value: 'Implant', label: 'Dental Implant Consent' },
                      { value: 'RCT', label: 'Root Canal (Endodontic) Consent' }
                    ]}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Consent Content Preview</label>
                    <textarea
                      value={consentContent}
                      onChange={(e) => setConsentContent(e.target.value)}
                      className="w-full h-48 bg-card border border-border rounded-lg p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsConsentModalOpen(false)}>Cancel</Button>
                    <Button type="submit">Create Consent</Button>
                  </div>
                </form>
              </Modal>
            )}

            {/* Sign Modal */}
            {isSignModalOpen && activeConsent && (
              <Modal title="Digital Signature Capture" onClose={() => { setIsSignModalOpen(false); setActiveConsent(null); }}>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground font-semibold">Patient: Please sign below to acknowledge informed consent for <span className="text-foreground font-bold">{activeConsent.type}</span>.</p>
                  <div className="border border-border rounded-xl overflow-hidden bg-white">
                    <canvas
                      ref={canvasRef}
                      width={480}
                      height={200}
                      className="w-full touch-none cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <div className="flex justify-between gap-2">
                    <Button type="button" variant="outline" onClick={clearCanvas}>Clear Signature</Button>
                    <Button onClick={handleSignConsentSubmit}>Save Signed Consent</Button>
                  </div>
                </div>
              </Modal>
            )}

            {/* Consent list */}
            <div className="space-y-3">
              {(consentForms || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">No consent forms yet. Create a new one above.</p>
                </div>
              ) : (
                (consentForms || []).map((cf) => (
                  <div key={cf.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-card hover:bg-muted/10 transition-colors">
                    <div>
                      <h5 className="text-sm font-bold text-foreground">{cf.type} Consent</h5>
                      <span className="text-[11px] text-muted-foreground font-semibold">Patient: {cf.patientName} · Created: {new Date(cf.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cf.status === 'Signed' ? 'success' : 'warning'} className="text-[10px]">{cf.status || 'Pending'}</Badge>
                      {cf.status !== 'Signed' && (
                        <Button
                          size="sm"
                          onClick={() => { setActiveConsent(cf); setIsSignModalOpen(true); }}
                          className="text-xs gap-1.5"
                        >
                          Sign
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Imaging & Scans */}
        {activeTab === 'imaging' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground uppercase tracking-wider">Imaging Cabinet</h3>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Upload dental radiographs, bitewings, or panoramic X-ray imagery.</p>
              </div>
              <Button onClick={handleXrayUpload} className="gap-2 select-none">
                <Upload className="h-4 w-4" />
                Upload Radiograph Scan
              </Button>
            </div>

            {/* X-Ray Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {xrays.map((xr) => (
                <div key={xr.id} className="border border-border rounded-xl bg-muted/10 overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-all">
                  <div className="relative h-48 bg-black overflow-hidden flex items-center justify-center">
                    <img
                      src={xr.url}
                      alt={xr.label}
                      className="max-h-full max-w-full object-contain filter contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                      <span className="text-xs font-bold text-white tracking-wide truncate">{xr.label}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-card flex justify-between items-center text-xs font-semibold text-muted-foreground border-t border-border">
                    <span>Uploaded: {xr.date}</span>
                    <Badge variant="secondary" className="text-[9px]">DICOM format</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Lab Cases */}
        {activeTab === 'lab' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-foreground uppercase tracking-wider mb-2">Prosthetic Lab Order Tracking</h3>
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Case ID</th>
                    <th className="py-3 px-4 font-semibold">Patient</th>
                    <th className="py-3 px-4 font-semibold">Appliance Details</th>
                    <th className="py-3 px-4 font-semibold">Target Laboratory</th>
                    <th className="py-3 px-4 font-semibold">Shipment Stage</th>
                    <th className="py-3 px-4 font-semibold">Est. Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {labCases.map((lc) => (
                    <tr key={lc.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-bold text-primary">{lc.id}</td>
                      <td className="py-3 px-4 font-bold">{lc.patientName}</td>
                      <td className="py-3 px-4 font-semibold">{lc.appliance}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-muted-foreground">{lc.labName}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            lc.status === 'Received'
                              ? 'success'
                              : lc.status === 'In Fabrication'
                              ? 'info'
                              : 'warning'
                          }
                          className="text-[10px] font-semibold py-0.5 px-2"
                        >
                          {lc.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-muted-foreground">{lc.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <ClinicalTestSandbox />
    </div>
  );
}
export default ClinicalPage;
