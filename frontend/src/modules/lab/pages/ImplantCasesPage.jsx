import { useState, useMemo } from 'react';
import { Wrench, Layers, CheckCircle2, ChevronRight, Activity, ShieldCheck, AlertCircle, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLabStore } from '../../../store/labStore';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { useToast } from '../../../shared/hooks/useToast';

export function ImplantCasesPage() {
  const navigate = useNavigate();
  const { labCases, activeCaseId, implantCases, updateImplantStage, updateCaseStatus } = useLabStore();
  const toast = useToast();

  const activeCase = useMemo(() => {
    return labCases.find((c) => c.id === activeCaseId);
  }, [labCases, activeCaseId]);

  const activeImplantDetails = useMemo(() => {
    return implantCases.find((i) => i.caseId === activeCaseId) || {
      caseId: activeCaseId,
      stage: 'Planning',
      planningNotes: '',
      dimensions: 'Platform: 4.5mm, Length: 10.0mm',
      surgicalNotes: ''
    };
  }, [implantCases, activeCaseId]);

  // Form State
  const [stage, setStage] = useState(() => activeImplantDetails?.stage || 'Planning');
  const [planningNotes, setPlanningNotes] = useState(() => activeImplantDetails?.planningNotes || '');
  const [dimensions, setDimensions] = useState(() => activeImplantDetails?.dimensions || 'Platform: 4.5mm, Length: 10.0mm');
  const [surgicalNotes, setSurgicalNotes] = useState(() => activeImplantDetails?.surgicalNotes || '');

  const handleSaveImplant = (e) => {
    e.preventDefault();
    if (!activeCaseId) {
      toast.error('Select an active case first.');
      return;
    }

    updateImplantStage(activeCaseId, {
      stage,
      planningNotes,
      dimensions,
      surgicalNotes
    });

    toast.success(`Implant staging specifications updated for case ${activeCaseId}!`);
  };

  const handleStageChange = (newStage) => {
    setStage(newStage);
    updateImplantStage(activeCaseId, { stage: newStage });
    
    // Also keep the main case status in sync
    let relatedStatus = 'In Progress';
    if (newStage === 'Ready') relatedStatus = 'Ready';
    if (newStage === 'Delivered') relatedStatus = 'Delivered';
    updateCaseStatus(activeCaseId, relatedStatus);

    toast.success(`Implant stage transitioned to ${newStage}`);
  };

  return (
    <div key={activeCaseId} className="space-y-6 text-left animate-fade-in pb-16 md:pb-0">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-foreground">
          <Wrench className="h-6 w-6 text-primary" />
          Surgical Implant Staging & Logistics
        </h2>
        <p className="text-xs text-muted-foreground font-semibold">
          Coordinate implant planning models, update manufacturing statuses, and manage surgical guide preparations.
        </p>
      </div>

      {/* Tab Switcher: Crown Tracking | Implant Cases */}
      <div className="flex p-0.5 bg-muted rounded-xl border border-border w-full md:w-auto self-start">
        <button
          onClick={() => navigate('/lab/crown')}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <Layers className="h-3.5 w-3.5" />
          Crown Tracking
        </button>
        <button
          onClick={() => navigate('/lab/implant')}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer bg-background text-foreground shadow-sm"
        >
          <Wrench className="h-3.5 w-3.5" />
          Implant Cases
        </button>
      </div>

      {activeCase ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main settings form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stage Timeline Controls */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-primary" />
                Implant Case Staging Timeline
              </h3>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-muted/40 border border-border rounded-xl">
                {['Planning', 'Manufacturing', 'Ready', 'Delivered'].map((step, idx, arr) => (
                  <div key={step} className="flex-1 flex items-center justify-between sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleStageChange(step)}
                      className={`px-4 py-2 border rounded-xl text-xs font-black transition-all cursor-pointer ${
                        stage === step
                          ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                          : 'bg-background border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {step}
                    </button>
                    {idx < arr.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block mx-auto" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Customization Details form */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Surgical & Guide Parameters Setup
              </h3>

              <form onSubmit={handleSaveImplant} className="space-y-4 text-xs font-semibold">
                <Input
                  label="Fixture Dimensions (Diameter & Length) *"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="e.g. Platform: 4.5mm, Length: 11.5mm..."
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Planning & Diagnostic notes</label>
                    <textarea
                      placeholder="e.g. Custom abutment. Angled screw channel..."
                      value={planningNotes}
                      onChange={(e) => setPlanningNotes(e.target.value)}
                      rows={4}
                      className="w-full text-xs font-medium bg-muted border border-border rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Surgical Guide Specs</label>
                    <textarea
                      placeholder="Surgical guide drill sleeve parameters, key diameter..."
                      value={surgicalNotes}
                      onChange={(e) => setSurgicalNotes(e.target.value)}
                      rows={4}
                      className="w-full text-xs font-medium bg-muted border border-border rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-10 gap-1.5 font-bold cursor-pointer">
                  <Save className="h-4 w-4" /> Save Implant Parameters
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar production details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-foreground">Implant Workflow Log</h3>

              <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-3 text-xs leading-normal">
                <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Case ID:</span><span className="font-extrabold text-foreground">{activeCase.id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Patient:</span><span className="font-extrabold text-foreground">{activeCase.patientName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Dentist:</span><span className="font-extrabold text-foreground">{activeCase.dentistName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-semibold">External Lab:</span><span className="font-extrabold text-foreground">{activeCase.labName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Plan Stage:</span><span className="font-extrabold text-indigo-500 bg-indigo-500/10 px-2 rounded">{stage}</span></div>
              </div>

              <div className="h-px bg-border/60" />

              <div className="space-y-3 leading-normal">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sync Log status</h4>
                <div className="p-3 bg-muted border border-border rounded-xl text-[10px] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-500 font-extrabold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Synchronized to Dentist EHR note history</span>
                  </div>
                  <p className="text-muted-foreground font-semibold">Updates to this page append logs detailing surgical dimensions to clinical chart.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-2xl text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-foreground">No active case selected</h3>
          <p className="text-xs text-muted-foreground font-semibold mt-1">Please select an active case in the header to view surgical implant logs.</p>
        </div>
      )}
    </div>
  );
}

export default ImplantCasesPage;
