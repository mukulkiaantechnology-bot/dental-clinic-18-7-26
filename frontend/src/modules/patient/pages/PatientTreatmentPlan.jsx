import { useState, useMemo } from 'react';
import { Activity, Info, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { usePatientStore } from '../../../store/patientStore';

export function PatientTreatmentPlan() {
  const { treatmentPlans, patientProfile } = usePatientStore();
  
  const [selectedTooth, setSelectedTooth] = useState(null);

  // Get current patient's odontogram
  const patientOdontogram = useMemo(() => {
    let chartData = patientProfile?.odontogram?.chartData;
    if (chartData) {
      while (typeof chartData === 'string') {
        try {
          chartData = JSON.parse(chartData);
        } catch (_e) {
          break;
        }
      }
      if (chartData && typeof chartData === 'object') {
        return chartData;
      }
    }
    return {};
  }, [patientProfile]);

  // Group procedures by status
  const proposedProcedures = useMemo(() => {
    return treatmentPlans.filter((t) => t.status === 'Proposed');
  }, [treatmentPlans]);

  const acceptedProcedures = useMemo(() => {
    return treatmentPlans.filter((t) => t.status === 'Accepted' || t.status === 'In Progress');
  }, [treatmentPlans]);

  const completedProcedures = useMemo(() => {
    return treatmentPlans.filter((t) => t.status === 'Completed');
  }, [treatmentPlans]);

  // Calculations
  const financialSummary = useMemo(() => {
    let proposed = 0;
    let accepted = 0;
    let completed = 0;

    treatmentPlans.forEach((plan) => {
      const cost = Number(plan.cost) || 0;
      if (plan.status === 'Proposed') proposed += cost;
      else if (plan.status === 'Accepted' || plan.status === 'In Progress') accepted += cost;
      else if (plan.status === 'Completed') completed += cost;
    });

    return { proposed, accepted, completed, total: proposed + accepted + completed };
  }, [treatmentPlans]);

  // Dental standard arches
  const upperTeeth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const lowerTeeth = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

  const getToothColor = (condition) => {
    switch (condition) {
      case 'Cavity':
        return 'bg-rose-500 text-white border-rose-600 shadow-rose-500/20';
      case 'Crown':
        return 'bg-indigo-500 text-white border-indigo-600 shadow-indigo-500/20';
      case 'Missing':
        return 'bg-slate-400 text-white border-slate-500 shadow-slate-500/10';
      case 'Implant':
        return 'bg-cyan-500 text-white border-cyan-600 shadow-cyan-500/20';
      case 'Healthy':
      default:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
  };

  // Find procedures associated with a specific tooth
  const toothProcedures = useMemo(() => {
    if (!selectedTooth) return [];
    return treatmentPlans.filter((p) => String(p.tooth) === String(selectedTooth));
  }, [selectedTooth, treatmentPlans]);

  return (
    <div className="space-y-6 text-left animate-fade-in pb-16 md:pb-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Care Plan & Charting</h2>
          <p className="text-[10px] text-muted-foreground font-semibold">
            Interactive clinical chart, proposed treatments, and completed recovery history.
          </p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Total Est. Treatment Cost</span>
          <div className="mt-2 flex items-baseline gap-1">
            <h3 className="text-2xl font-black text-foreground">${financialSummary.total.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Completed Treatments</span>
          <div className="mt-2 flex items-baseline gap-1">
            <h3 className="text-2xl font-black text-emerald-500">${financialSummary.completed.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-primary">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Active Approved Plans</span>
          <div className="mt-2 flex items-baseline gap-1">
            <h3 className="text-2xl font-black text-primary">${financialSummary.accepted.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-amber-500">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Proposed / Pending Review</span>
          <div className="mt-2 flex items-baseline gap-1">
            <h3 className="text-2xl font-black text-amber-500">${financialSummary.proposed.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Visual Dental Odontogram */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
              Interactive 32-Teeth Odontogram Chart
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold">
              Select any highlighted tooth to inspect detailed clinical conditions and care logs.
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap gap-3 text-[10px] font-extrabold uppercase tracking-wide">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span className="text-muted-foreground">Healthy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
              <span className="text-muted-foreground">Cavity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500 inline-block" />
              <span className="text-muted-foreground">Crown</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-400 inline-block" />
              <span className="text-muted-foreground">Missing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
              <span className="text-muted-foreground">Implant</span>
            </div>
          </div>
        </div>

        {/* Teeth Grid */}
        <div className="space-y-6 overflow-x-auto pb-2 select-none no-scrollbar">
          {/* Upper Arch */}
          <div className="space-y-2 min-w-[640px]">
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block text-center">
              Upper Maxillary Arch (Teeth 1 - 16)
            </span>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
              {upperTeeth.map((num) => {
                const rawCond = patientOdontogram[num];
                const condition = typeof rawCond === 'string' ? rawCond : (rawCond?.status || rawCond?.condition || 'Healthy');
                const isSelected = selectedTooth === num;
                return (
                  <button
                    key={num}
                    onClick={() => setSelectedTooth(isSelected ? null : num)}
                    className={`h-11 rounded-xl border flex flex-col items-center justify-center font-black text-xs cursor-pointer transition-all hover:scale-105 active:scale-95 ${getToothColor(
                      condition
                    )} ${isSelected ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-card' : ''}`}
                    title={`Tooth #${num}: ${condition}`}
                  >
                    <span>{num}</span>
                    {condition !== 'Healthy' && (
                      <span className="text-[7px] font-extrabold uppercase mt-0.5 tracking-tighter opacity-90 truncate max-w-full px-0.5">
                        {condition.slice(0, 3)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lower Arch */}
          <div className="space-y-2 min-w-[640px]">
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
              {lowerTeeth.map((num) => {
                const rawCond = patientOdontogram[num];
                const condition = typeof rawCond === 'string' ? rawCond : (rawCond?.status || rawCond?.condition || 'Healthy');
                const isSelected = selectedTooth === num;
                return (
                  <button
                    key={num}
                    onClick={() => setSelectedTooth(isSelected ? null : num)}
                    className={`h-11 rounded-xl border flex flex-col items-center justify-center font-black text-xs cursor-pointer transition-all hover:scale-105 active:scale-95 ${getToothColor(
                      condition
                    )} ${isSelected ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-card' : ''}`}
                    title={`Tooth #${num}: ${condition}`}
                  >
                    <span>{num}</span>
                    {condition !== 'Healthy' && (
                      <span className="text-[7px] font-extrabold uppercase mt-0.5 tracking-tighter opacity-90 truncate max-w-full px-0.5">
                        {condition.slice(0, 3)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block text-center pt-2">
              Lower Mandibular Arch (Teeth 17 - 32)
            </span>
          </div>
        </div>

        {/* Selected Tooth Detail Panel */}
        {selectedTooth ? (
          <div className="p-4 bg-muted/40 border border-border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <Info className="h-4 w-4 text-primary" />
                Tooth #{selectedTooth} Diagnostics
              </h4>
              <p className="text-xs text-muted-foreground leading-normal font-semibold">
                Status: <strong className="text-primary font-bold">{typeof patientOdontogram[selectedTooth] === 'string' ? patientOdontogram[selectedTooth] : (patientOdontogram[selectedTooth]?.status || patientOdontogram[selectedTooth]?.condition || 'Healthy')}</strong>
              </p>
            </div>
            <div className="text-xs font-semibold text-muted-foreground md:text-right">
              {toothProcedures.length > 0 ? (
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
                    Linked Care Plan
                  </span>
                  {toothProcedures.map((proc) => (
                    <div key={proc.id} className="text-foreground">
                      {proc.procedure} · <span className="text-emerald-500 font-extrabold">${proc.cost}</span> ({proc.status})
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-[11px]">No active treatments proposed/accepted for this tooth.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center p-3 bg-muted/20 border border-border/60 rounded-xl text-[10px] text-muted-foreground font-bold flex items-center justify-center gap-1.5">
            <Info className="h-4 w-4 text-muted-foreground/80" />
            Click any tooth box above to inspect clinical notes and procedure logs.
          </div>
        )}
      </div>

      {/* Lists of Care Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completed Procedures column */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 border-b border-border pb-3.5">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
            Completed Treatments ({completedProcedures.length})
          </h3>
          <div className="space-y-3">
            {completedProcedures.length > 0 ? (
              completedProcedures.map((proc) => (
                <div key={proc.id} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-xs text-foreground">{proc.procedure}</h4>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                        Tooth #{proc.tooth} · Resolved
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-500">${proc.cost}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground font-semibold italic text-center py-6">
                No completed procedures in current chart.
              </p>
            )}
          </div>
        </div>

        {/* Accepted / In Progress column */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 border-b border-border pb-3.5">
            <Activity className="h-4.5 w-4.5 text-primary" />
            Accepted / Scheduled ({acceptedProcedures.length})
          </h3>
          <div className="space-y-3">
            {acceptedProcedures.length > 0 ? (
              acceptedProcedures.map((proc) => (
                <div key={proc.id} className="p-3 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-xs text-foreground">{proc.procedure}</h4>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                        Tooth #{proc.tooth} · Approved
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-primary">${proc.cost}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground font-semibold italic text-center py-6">
                No active treatments currently scheduled.
              </p>
            )}
          </div>
        </div>

        {/* Proposed Procedures column */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 border-b border-border pb-3.5">
            <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
            Proposed Treatments ({proposedProcedures.length})
          </h3>
          <div className="space-y-3">
            {proposedProcedures.length > 0 ? (
              proposedProcedures.map((proc) => (
                <div key={proc.id} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-xs text-foreground">{proc.procedure}</h4>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                        Tooth #{proc.tooth} · Pending Approval
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-amber-500">${proc.cost}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal font-semibold">
                    Contact coordinator or call clinic to accept proposed care.
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground font-semibold italic text-center py-6">
                No proposed treatments pending review.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientTreatmentPlan;
