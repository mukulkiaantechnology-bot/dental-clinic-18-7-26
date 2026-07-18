import { useState, useMemo, useEffect } from 'react';
import { Columns, Calendar, User, ArrowRight, ArrowLeft, FlaskConical, AlertCircle } from 'lucide-react';
import { useLabStore } from '../../../store/labStore';
import { Badge } from '../../../shared/ui/Badge';
import { useToast } from '../../../shared/hooks/useToast';

const COLUMNS = ['Created', 'Sent', 'In Progress', 'Ready', 'Delivered'];

const COLUMN_COLORS = {
  'Created': 'border-t-blue-500 bg-blue-500/5',
  'Sent': 'border-t-orange-500 bg-orange-500/5',
  'In Progress': 'border-t-amber-500 bg-amber-500/5',
  'Ready': 'border-t-indigo-500 bg-indigo-500/5',
  'Delivered': 'border-t-emerald-500 bg-emerald-500/5'
};

const BADGE_COLORS = {
  'Created': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Sent': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'In Progress': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Ready': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  'Delivered': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
};

export function StatusBoardPage() {
  const { labCases, activeCaseId, setActiveCaseId, updateCaseStatus, fetchLabCases } = useLabStore();
  const toast = useToast();

  useEffect(() => {
    fetchLabCases();
  }, [fetchLabCases]);

  // Mobile Swipe/Select View State
  const [mobileActiveColumn, setMobileActiveColumn] = useState('Created');

  // Move Case to Next or Previous column
  const moveCase = (caseId, direction) => {
    const caseObj = labCases.find((c) => c.id === caseId);
    if (!caseObj) return;

    const currentIndex = COLUMNS.indexOf(caseObj.status);
    let nextIndex = currentIndex;

    if (direction === 'forward') {
      nextIndex = Math.min(currentIndex + 1, COLUMNS.length - 1);
    } else if (direction === 'backward') {
      nextIndex = Math.max(currentIndex - 1, 0);
    }

    if (nextIndex !== currentIndex) {
      const nextStatus = COLUMNS[nextIndex];
      updateCaseStatus(caseId, nextStatus);
      toast.success(`Moved Case ${caseId} to: ${nextStatus}`);
    }
  };

  // Group cases by column
  const groupedCases = useMemo(() => {
    const groups = {};
    COLUMNS.forEach((col) => {
      groups[col] = labCases.filter((c) => c.status === col);
    });
    return groups;
  }, [labCases]);

  return (
    <div className="space-y-6 text-left animate-fade-in pb-16 md:pb-0">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-foreground">
          <Columns className="h-6 w-6 text-primary" />
          Prosthesis Status Board
        </h2>
        <p className="text-xs text-muted-foreground font-semibold">
          Interactive Kanban tracking case transitions. Drag-and-drop workflow status updates.
        </p>
      </div>

      {/* Mobile Tab Column Selector */}
      <div className="md:hidden flex p-0.5 bg-muted rounded-xl border border-border overflow-x-auto whitespace-nowrap scrollbar-none">
        {COLUMNS.map((col) => (
          <button
            key={col}
            onClick={() => setMobileActiveColumn(col)}
            className={`flex-1 text-center py-2 px-3 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
              mobileActiveColumn === col
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {col} ({groupedCases[col]?.length || 0})
          </button>
        ))}
      </div>

      {/* Desktop Multi-column Kanban Board */}
      <div className="hidden md:grid grid-cols-5 gap-4 items-start h-[calc(100vh-220px)] min-h-[500px]">
        {COLUMNS.map((col) => (
          <div
            key={col}
            className={`border border-border/80 border-t-4 rounded-2xl p-4 flex flex-col h-full overflow-hidden shadow-sm ${COLUMN_COLORS[col]}`}
          >
            {/* Column Title */}
            <div className="flex justify-between items-center mb-3">
              <span className="font-extrabold text-xs text-foreground uppercase tracking-wider">{col}</span>
              <span className="text-[10px] font-black bg-muted/80 text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                {groupedCases[col]?.length || 0}
              </span>
            </div>

            {/* Cards List container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 no-scrollbar">
              {groupedCases[col]?.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border/60 rounded-xl text-center min-h-[120px]">
                  <FlaskConical className="h-5 w-5 text-muted-foreground/30 mb-1" />
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Empty Column</span>
                </div>
              ) : (
                groupedCases[col].map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setActiveCaseId(c.id)}
                    className={`bg-card border p-3.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group text-left ${
                      activeCaseId === c.id
                        ? 'border-primary ring-1 ring-primary/20'
                        : 'border-border/60 hover:border-border'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase text-primary tracking-wider">{c.type}</span>
                        <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{c.id}</span>
                      </div>
                      
                      <h4 className="font-extrabold text-xs text-foreground group-hover:text-primary transition-colors">
                        {c.patientName}
                      </h4>

                      <div className="h-px bg-border/40" />

                      <div className="space-y-1 text-[10px] font-semibold text-muted-foreground">
                        <div className="flex items-center gap-1.5"><User className="h-3 w-3 text-indigo-400 flex-shrink-0" /> {c.dentistName}</div>
                        <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-indigo-400 flex-shrink-0" /> {c.expectedDelivery}</div>
                      </div>
                    </div>

                    {/* Quick navigation arrows */}
                    <div className="mt-3 pt-3.5 border-t border-border/40 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        disabled={col === 'Created'}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveCase(c.id, 'backward');
                        }}
                        className="p-1 hover:bg-secondary text-muted-foreground hover:text-foreground rounded disabled:opacity-30 cursor-pointer"
                        title="Move Stage Back"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        disabled={col === 'Delivered'}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveCase(c.id, 'forward');
                        }}
                        className="p-1 hover:bg-secondary text-muted-foreground hover:text-foreground rounded disabled:opacity-30 cursor-pointer"
                        title="Move Stage Next"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Column detail list */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Current Stage: <strong className="text-foreground">{mobileActiveColumn}</strong>
          </span>
          <span className="text-[10px] font-bold bg-muted text-muted-foreground border px-2 py-0.5 rounded-full">
            {groupedCases[mobileActiveColumn]?.length || 0} Cases
          </span>
        </div>

        {groupedCases[mobileActiveColumn]?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-2xl text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40 mb-2 stroke-1" />
            <p className="text-xs font-bold text-foreground">No cases in {mobileActiveColumn}</p>
            <p className="text-[10px] text-muted-foreground/80 mt-0.5">Use actions on cases to transition stages.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {groupedCases[mobileActiveColumn].map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveCaseId(c.id)}
                className={`bg-card border p-4 rounded-2xl shadow-sm hover:border-primary/20 space-y-3 text-left relative overflow-hidden transition-all ${
                  activeCaseId === c.id ? 'border-primary ring-1 ring-primary/20' : 'border-border'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">{c.patientName}</h3>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                      Case #{c.id} · Type: <strong className="text-primary">{c.type}</strong>
                    </span>
                  </div>
                  <Badge className={BADGE_COLORS[mobileActiveColumn]}>{mobileActiveColumn}</Badge>
                </div>

                <div className="h-px bg-border/60" />

                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-muted-foreground">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider block text-muted-foreground/80">Dentist</span>
                    <span className="text-foreground">{c.dentistName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider block text-muted-foreground/80">Expected Delivery</span>
                    <span className="text-foreground">{c.expectedDelivery}</span>
                  </div>
                </div>

                <div className="h-px bg-border/60" />

                <div className="flex gap-2 justify-between items-center">
                  <button
                    disabled={mobileActiveColumn === 'Created'}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCase(c.id, 'backward');
                    }}
                    className="flex-1 py-1.5 border border-border bg-muted/40 hover:bg-muted text-[10px] font-bold text-foreground rounded-lg flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    disabled={mobileActiveColumn === 'Delivered'}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCase(c.id, 'forward');
                    }}
                    className="flex-1 py-1.5 border border-border bg-muted/40 hover:bg-muted text-[10px] font-bold text-foreground rounded-lg flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30"
                  >
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatusBoardPage;
