import { useState, useMemo } from 'react';
import { Layers, Wrench, Activity, Save, CheckCircle2, ChevronRight, MessageSquare, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLabStore } from '../../../store/labStore';
import { Button } from '../../../shared/ui/Button';
import { useToast } from '../../../shared/hooks/useToast';

export function CrownTrackingPage() {
  const navigate = useNavigate();
  const { labCases, activeCaseId, crownCases, updateCrownTracking, updateCaseStatus } = useLabStore();
  const toast = useToast();

  const activeCase = useMemo(() => {
    return labCases.find((c) => c.id === activeCaseId);
  }, [labCases, activeCaseId]);

  const activeCrownDetails = useMemo(() => {
    return crownCases.find((cc) => cc.caseId === activeCaseId) || {
      caseId: activeCaseId,
      toothNumber: '14',
      material: 'Ceramic',
      shade: 'A2',
      notes: ''
    };
  }, [crownCases, activeCaseId]);

  // Form State
  const [toothNumber, setToothNumber] = useState(() => activeCrownDetails?.toothNumber || '14');
  const [material, setMaterial] = useState(() => activeCrownDetails?.material || 'Ceramic');
  const [shade, setShade] = useState(() => activeCrownDetails?.shade || 'A2');
  const [notes, setNotes] = useState(() => activeCrownDetails?.notes || '');

  const handleSaveTracking = (e) => {
    e.preventDefault();
    if (!activeCaseId) {
      toast.error('Please select a lab case first.');
      return;
    }

    updateCrownTracking(activeCaseId, {
      toothNumber,
      material,
      shade,
      notes
    });

    toast.success(`Crown tracking details synced for case ${activeCaseId}!`);
  };

  const handleTransitionStatus = (nextStatus) => {
    updateCaseStatus(activeCaseId, nextStatus);
    toast.success(`Case status set to: ${nextStatus}`);
  };

  const materialOptions = ['Zirconia', 'Ceramic', 'Metal'];
  const shadeOptions = ['A1', 'A2', 'A3', 'A3.5', 'B1', 'B2', 'B3', 'C1', 'C2', 'D2', 'Bleach-OM1'];

  // Visual Teeth Grid mapping (1-16 upper jaw, 17-32 lower jaw)
  const teethUpper = Array.from({ length: 16 }, (_, i) => String(i + 1));
  const teethLower = Array.from({ length: 16 }, (_, i) => String(32 - i));

  return (
    <div key={activeCaseId} className="space-y-6 text-left animate-fade-in pb-16 md:pb-0">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-foreground">
          <Layers className="h-6 w-6 text-primary" />
          Crown Fabrication & Shade Tracking
        </h2>
        <p className="text-xs text-muted-foreground font-semibold">
          Configure prosthetic configurations, select custom shades/materials, and audit production workflows.
        </p>
      </div>

      {/* Tab Switcher: Crown Tracking | Implant Cases */}
      <div className="flex p-0.5 bg-muted rounded-xl border border-border w-full md:w-auto self-start">
        <button
          onClick={() => navigate('/lab/crown')}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer bg-background text-foreground shadow-sm"
        >
          <Layers className="h-3.5 w-3.5" />
          Crown Tracking
        </button>
        <button
          onClick={() => navigate('/lab/implant')}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <Wrench className="h-3.5 w-3.5" />
          Implant Cases
        </button>
      </div>

      {activeCase ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Tooth Selection Grid */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-primary" />
                Select Target Tooth Configuration
              </h3>

              <div className="space-y-4">
                {/* Upper Jaw row */}
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Maxillary Arc (Upper Jaw)</span>
                  <div className="flex flex-wrap gap-1">
                    {teethUpper.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setToothNumber(t)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer border flex items-center justify-center ${
                          toothNumber === t
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                            : 'bg-muted/40 border-border text-foreground hover:bg-muted/80'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lower Jaw row */}
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Mandibular Arc (Lower Jaw)</span>
                  <div className="flex flex-wrap gap-1">
                    {teethLower.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setToothNumber(t)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer border flex items-center justify-center ${
                          toothNumber === t
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                            : 'bg-muted/40 border-border text-foreground hover:bg-muted/80'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Material & Shade setup */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-foreground">Prosthetic Customization Specifications</h3>
              
              <form onSubmit={handleSaveTracking} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Material selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Crown Material *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {materialOptions.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMaterial(m)}
                          className={`py-2 border rounded-xl font-bold transition-all text-xs cursor-pointer ${
                            material === m
                              ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                              : 'bg-muted/40 border-border text-foreground hover:bg-muted/80'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shade selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">VITA Shade Guide Selection *</label>
                    <select
                      value={shade}
                      onChange={(e) => setShade(e.target.value)}
                      className="w-full bg-muted border border-border rounded-xl p-2.5 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                    >
                      {shadeOptions.map((s) => (
                        <option key={s} value={s}>{s} shade</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fabrication Lab Notes</label>
                  <textarea
                    placeholder="Specific requests, translucency details, custom margins..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full text-xs font-medium bg-muted border border-border rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>

                <Button type="submit" className="w-full h-10 gap-1.5 font-bold cursor-pointer">
                  <Save className="h-4 w-4" /> Save Crown Specifications
                </Button>
              </form>
            </div>
          </div>

          {/* Logistics & timeline panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Active Case Details Panel */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-foreground">Production Case Card</h3>

              <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-3 text-xs leading-normal">
                <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Case ID:</span><span className="font-extrabold text-foreground">#{activeCase.id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Patient:</span><span className="font-extrabold text-foreground">{activeCase.patientName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Dentist:</span><span className="font-extrabold text-foreground">{activeCase.dentistName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-semibold">External Lab:</span><span className="font-extrabold text-foreground">{activeCase.labName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Case Type:</span><span className="font-extrabold text-primary">{activeCase.type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Est. Delivery:</span><span className="font-extrabold text-foreground">{activeCase.expectedDelivery}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Selected Tooth:</span><span className="font-extrabold text-indigo-500 bg-indigo-500/10 px-2 rounded">#{toothNumber}</span></div>
              </div>

              {/* Status Update Quick Triggers */}
              <div className="space-y-2 pt-3 border-t border-border/60">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Transition Case Stage</label>
                <div className="flex flex-col gap-2">
                  {[
                    { status: 'Sent', label: 'Send to Lab' },
                    { status: 'In Progress', label: 'Start Production' },
                    { status: 'Ready', label: 'QC Audit Complete' },
                    { status: 'Delivered', label: 'Confirm Hand-off' }
                  ].map((step) => (
                    <button
                      key={step.status}
                      onClick={() => handleTransitionStatus(step.status)}
                      disabled={activeCase.status === step.status}
                      className={`w-full py-2.5 border rounded-xl text-left px-4 font-bold text-xs flex items-center justify-between cursor-pointer transition-all ${
                        activeCase.status === step.status
                          ? 'bg-primary/10 border-primary/20 text-primary pointer-events-none'
                          : 'bg-muted/40 border-border text-foreground hover:bg-muted/80'
                      }`}
                    >
                      <span>{step.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/80" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Internal Lab log */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-primary" />
                Lab Dispatch History
              </h3>

              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-[9px] text-muted-foreground font-bold border-b border-border/40 pb-1.5">
                    <span>{new Date().toLocaleDateString()}</span>
                    <span className="text-emerald-500 font-extrabold uppercase">Log Added</span>
                  </div>
                  <p className="font-semibold text-foreground leading-normal">Crown tooth #{toothNumber} material set to {material} ({shade} shade).</p>
                  <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 pt-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Synchronized back to Dentist EHR note history</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-2xl text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-foreground">No active case selected</h3>
          <p className="text-xs text-muted-foreground font-semibold mt-1">Please select an active case in the header to configure crown details.</p>
        </div>
      )}
    </div>
  );
}

export default CrownTrackingPage;
