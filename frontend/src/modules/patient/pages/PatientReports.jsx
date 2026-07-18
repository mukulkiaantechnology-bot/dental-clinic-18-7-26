import { useState, useMemo } from 'react';
import { Folder, FlaskConical, FileImage, Sparkles, CheckCircle2, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { usePatientStore } from '../../../store/patientStore';
import { useDentistStore } from '../../../store/dentistStore';
import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';

const resolveFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http') || fileUrl.startsWith('data:')) return fileUrl;
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${fileUrl}`;
};

export function PatientReports() {
  const { reports, labStatus, activePatientId, refreshReports } = usePatientStore();
  const updateXrayAIResult = useDentistStore((state) => state.updateXrayAIResult);
  const toast = useToast();

  const [activeSection, setActiveSection] = useState('xrays'); // 'xrays' | 'labs'
  const [selectedXrayId, setSelectedXrayId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Derive selected X-ray or fallback to first report
  const selectedXray = useMemo(() => {
    if (reports.length === 0) return null;
    const matched = reports.find((r) => r.id === selectedXrayId);
    return matched || reports[0];
  }, [reports, selectedXrayId]);

  const handleSelectXray = (xr) => {
    setSelectedXrayId(xr.id);
  };

  const handleRunAI = (xrId) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const mockReport = 'AI Diagnosis: Class II caries lesion detected on distal surface of tooth #14. Superficial decay approximating enamel-dentin junction. Confidence score: 96.8%. Recommend composite restoration.';
      updateXrayAIResult(activePatientId, xrId, mockReport);
      // Re-sync reports in patientStore
      refreshReports();
      // Update selected xray reference to show updated report
      const updatedReports = useDentistStore.getState().xrays[activePatientId] || [];
      const matched = updatedReports.find((r) => r.id === xrId);
      if (matched) setSelectedXrayId(matched.id);

      toast.success('AI Diagnostics model finished reading radiograph data.', 'Audit Finished');
      setIsAnalyzing(false);
    }, 2000);
  };

  const getTimelineSteps = (status) => {
    const steps = ['Created', 'Sent', 'In Progress', 'Ready', 'Delivered'];
    const currentIndex = steps.indexOf(status);
    return steps.map((step, index) => ({
      name: step,
      isCompleted: index < currentIndex,
      isActive: index === currentIndex,
      isPending: index > currentIndex
    }));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Clinical Files & Diagnostics</h2>
          <p className="text-[10px] text-muted-foreground font-semibold">
            Radiology imaging, AI diagnostics reports, and dental fabrication status logs.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 border border-border rounded-xl w-fit">
          <button
            onClick={() => setActiveSection('xrays')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${activeSection === 'xrays'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <FileImage className="h-3.5 w-3.5" />
            Radiographs ({reports.length})
          </button>
          <button
            onClick={() => setActiveSection('labs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${activeSection === 'labs'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Lab Status ({labStatus.length})
          </button>
        </div>
      </div>

      {/* Main viewport sections */}
      {activeSection === 'xrays' ? (
        reports.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left sidebar: File selector list */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                X-Ray Scan Folders
              </h3>
              <div className="space-y-3">
                {reports.map((xr) => {
                  const isSelected = selectedXray?.id === xr.id;
                  return (
                    <div
                      key={xr.id}
                      onClick={() => handleSelectXray(xr)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs font-semibold leading-normal ${isSelected
                        ? 'bg-primary/5 border-primary shadow-xs'
                        : 'bg-card border-border hover:border-border/80'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          <FileImage className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5 truncate">
                          <h4 className="font-extrabold text-foreground truncate">{xr.name}</h4>
                          <p className="text-[10px] text-muted-foreground">{xr.date}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right container: X-Ray viewer pane */}
            <div className="lg:col-span-2">
              {selectedXray ? (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground">{selectedXray.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-semibold">Captured: {selectedXray.date} · Clinic Radiology</p>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-extrabold bg-muted px-2 py-0.5 rounded">
                      ID: {selectedXray.id}
                    </span>
                  </div>

                  {/* Radiology Canvas Display */}
                  <div className="bg-slate-950 border border-slate-900 aspect-video rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-6 shadow-inner select-none group">
                    {/* Simulated Radiograph grid lines */}
                    <div className="absolute inset-0 bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-transparent via-transparent to-slate-950/80 pointer-events-none z-10" />

                    {/* Visual mockup of dental teeth X-Ray or actual uploaded file */}
                    {selectedXray.fileUrl ? (
                      <img
                        src={resolveFileUrl(selectedXray.fileUrl)}
                        alt={selectedXray.name}
                        className="absolute inset-0 w-full h-full object-contain z-0 opacity-95 filter saturate-0 contrast-125 brightness-90"
                      />
                    ) : (
                      <div className="relative z-0 opacity-80 flex gap-4 w-full h-full items-center justify-center filter saturate-0 contrast-150 brightness-75">
                        {/* CSS teeth block shapes simulating teeth radiographs */}
                        {[1, 2, 3, 4, 5].map((index) => (
                          <div key={index} className="flex flex-col items-center gap-1.5">
                            {/* Upper root */}
                            <div className="w-9 h-12 bg-linear-to-b from-slate-700 to-slate-400 rounded-t-full border border-slate-950/40" />
                            {/* Crown */}
                            <div className={`w-12 h-14 bg-slate-300 rounded-b-xl border-x border-b border-slate-950/45 shadow-sm relative flex items-center justify-center ${selectedXray.id === 'xr-1' && index === 3 ? 'bg-rose-950/60 ring-2 ring-rose-500 ring-offset-1 ring-offset-slate-950 animate-pulse' : ''
                              }`}>
                              <span className="text-[9px] text-slate-800 font-extrabold">#{index === 3 ? '14' : index === 4 ? '15' : '13'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Scan indicator */}
                    <div className="absolute top-3 right-3 z-20 bg-slate-900/80 backdrop-blur-xs border border-slate-800 text-[8px] tracking-widest text-slate-400 uppercase font-black px-2 py-0.5 rounded">
                      Dental radiograph view
                    </div>

                    {/* Diagnostics target indicator */}
                    {selectedXray.id === 'xr-1' && (
                      <div className="absolute bottom-4 left-4 z-20 bg-rose-500/90 text-white border border-rose-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-lg animate-bounce">
                        <AlertCircle className="h-3 w-3" /> Distal decay #14
                      </div>
                    )}
                  </div>

                  {/* Radiology notes */}
                  <div className="space-y-1.5 text-xs leading-normal font-semibold">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
                      Radiology Tech / Dentist Annotations
                    </span>
                    <p className="text-muted-foreground text-[11px] bg-muted/40 p-3 border border-border rounded-xl">
                      {selectedXray.notes || 'No notes reported.'}
                    </p>
                  </div>

                  {/* AI Diagnosis block */}
                  {selectedXray.isScanned ? (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                          AI Diagnostics Audit
                        </h4>
                        <span className="text-[8px] uppercase font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                          Computed Vision Active
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed font-semibold">
                        {selectedXray.aiReport}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/40 border border-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                          AI Intelligence Diagnostics
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-semibold">
                          Run computer vision audit scans to detect enamel decay, bone issues, or calculus.
                        </p>
                      </div>
                      <Button
                        onClick={() => handleRunAI(selectedXray.id)}
                        disabled={isAnalyzing}
                        className="cursor-pointer text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            Analyze Image
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8 border border-dashed border-border rounded-2xl text-center bg-card text-muted-foreground">
                  No radiograph scans synced in system profile.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl text-center bg-card">
            <Folder className="h-10 w-10 text-muted-foreground/50 mb-3 stroke-1" />
            <h4 className="text-sm font-bold text-foreground">No radiograph records</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              There are no X-rays, panorexes, or dental radiographs uploaded to your patient record folder.
            </p>
          </div>
        )
      ) : labStatus.length > 0 ? (
        <div className="space-y-6">
          {labStatus.map((c) => {
            const steps = getTimelineSteps(c.status);
            return (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-6">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">{c.type} Restoration Fabrication</h3>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      Lab Partner: {c.labName} · Case ID: #{c.id}
                    </p>
                  </div>
                  <div className="text-right text-xs font-semibold">
                    <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold block">
                      Expected Delivery
                    </span>
                    <span className="text-primary font-bold flex items-center gap-1 mt-0.5 justify-end">
                      <Calendar className="h-3.5 w-3.5" />
                      {c.expectedDelivery}
                    </span>
                  </div>
                </div>

                {/* Progress bar timeline horizontal */}
                <div className="relative py-4">
                  {/* Background track */}
                  <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-muted rounded-full -translate-y-1/2 z-0" />

                  {/* Active track filling */}
                  <div
                    className="absolute top-1/2 left-0 h-1.5 bg-primary rounded-full -translate-y-1/2 z-0 transition-all duration-500"
                    style={{
                      width: `${c.status === 'Created' ? '0%' :
                        c.status === 'Sent' ? '25%' :
                          c.status === 'In Progress' ? '50%' :
                            c.status === 'Ready' ? '75%' :
                              '100%'
                        }`
                    }}
                  />

                  {/* Timeline Nodes */}
                  <div className="relative z-10 flex justify-between">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center space-y-1.5 select-none">
                        <div
                          className={`w-6.5 h-6.5 rounded-full border-2 flex items-center justify-center font-bold text-[9px] transition-all ${step.isActive
                            ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-xs'
                            : step.isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-card border-border text-muted-foreground'
                            }`}
                        >
                          {step.isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] uppercase tracking-wider font-extrabold ${step.isActive ? 'text-primary' : step.isCompleted ? 'text-emerald-500' : 'text-muted-foreground'
                            }`}
                        >
                          {step.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes box */}
                {c.notes && (
                  <div className="text-[11px] leading-relaxed text-muted-foreground bg-muted/40 p-3 border border-border rounded-xl">
                    <strong className="text-[9px] uppercase text-foreground/80 tracking-wide block mb-0.5">
                      Technical Notes & Details
                    </strong>
                    {c.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl text-center bg-card">
          <FlaskConical className="h-10 w-10 text-muted-foreground/50 mb-3 stroke-1" />
          <h4 className="text-sm font-bold text-foreground">No active lab orders</h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            You do not have any pending crown, bridge, veneer, or implant cases dispatch log history.
          </p>
        </div>
      )}
    </div>
  );
}

export default PatientReports;
