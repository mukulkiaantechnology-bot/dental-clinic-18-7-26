import { useState, useMemo, useEffect } from 'react';
import { Columns, Calendar, User, ArrowRight, ArrowLeft, FlaskConical, AlertCircle } from 'lucide-react';
import { useLabStore } from '../../../store/labStore';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { Modal } from '../../../shared/ui/Modal';
import { useToast } from '../../../shared/hooks/useToast';
import { openReportInNewTab } from '../../dashboard/pages/DentistPages';

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
  const { labCases, activeCaseId, setActiveCaseId, updateCaseStatus, fetchLabCases, deleteCaseComment } = useLabStore();
  const toast = useToast();

  useEffect(() => {
    fetchLabCases();
    const interval = setInterval(() => {
      fetchLabCases();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchLabCases]);

  // Mobile Swipe/Select View State
  const [mobileActiveColumn, setMobileActiveColumn] = useState('Created');

  // Case Comment Modal State
  const [commentingCase, setCommentingCase] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentRole, setCommentRole] = useState('Lab Technician');
  const [files, setFiles] = useState([]);
  const activeCommentingCase = commentingCase ? (labCases.find(c => c.id === commentingCase.id) || commentingCase) : null;

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

                    {/* Quick navigation arrows & Notes button */}
                    <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between gap-1">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommentingCase(c);
                        }}
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                          Array.isArray(c.comments) && c.comments.length > 0
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20'
                        }`}
                        title="View Doctor Chat & Notes"
                      >
                        💬 Notes ({Array.isArray(c.comments) ? c.comments.length : 0})
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

      {/* Doctor ↔ Lab Technician Communication Notes Modal */}
      {activeCommentingCase && (
        <Modal
          isOpen={Boolean(activeCommentingCase)}
          onClose={() => setCommentingCase(null)}
          title={`Lab Case Communication Thread — #${activeCommentingCase.id}`}
        >
          <div className="space-y-4 text-left text-xs font-semibold">
            <div className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between">
              <div>
                <span className="font-extrabold text-foreground block">{activeCommentingCase.patientName}</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">
                  {activeCommentingCase.type} &bull; {activeCommentingCase.labName}
                </span>
              </div>
              <Badge variant="info" className="font-bold">{activeCommentingCase.status}</Badge>
            </div>

            {activeCommentingCase.notes && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider block">Clinical Instructions</span>
                <p className="text-[11px] font-bold leading-relaxed">{activeCommentingCase.notes}</p>
              </div>
            )}

            {/* Discussion Thread */}
            <div className="space-y-2 border-t border-border pt-3 text-left">
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Discussion & Shade Notes Thread</label>
              
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {Array.isArray(activeCommentingCase.comments) && activeCommentingCase.comments.length > 0 ? (
                  activeCommentingCase.comments.map((cm) => (
                    <div key={cm.id} className="p-2.5 bg-card border border-border rounded-xl space-y-1 text-left">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-extrabold text-primary">{cm.authorName} <span className="text-muted-foreground font-normal">({cm.authorRole})</span></span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-mono text-[9px]">{new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this note/attachment permanently?')) {
                                await deleteCaseComment(activeCommentingCase.id, cm.id);
                                toast.success('Note/Attachment deleted successfully.');
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 font-extrabold text-[10px] cursor-pointer flex items-center gap-0.5"
                            title="Delete Note"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                      {cm.text && <p className="text-[11px] text-foreground font-medium">{cm.text}</p>}

                      {cm.attachment && (
                        <div className="mt-1.5 p-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-sm">📄</span>
                            <div className="min-w-0 text-left">
                              <p className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 truncate">{cm.attachment.fileName}</p>
                              <span className="text-[9px] font-bold text-muted-foreground">{cm.attachment.fileType || 'Lab Report'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              openReportInNewTab({
                                fileName: cm.attachment?.fileName || 'Lab_Report.pdf',
                                patientName: activeCommentingCase?.patientName || 'Patient',
                                labName: activeCommentingCase?.labName || 'Pacific Dental Lab',
                                type: activeCommentingCase?.type || 'Restoration',
                                authorName: cm.authorName,
                                fileUrl: cm.attachment?.fileUrl,
                                fileType: cm.attachment?.fileType,
                                text: cm.text
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[9.5px] font-black hover:bg-indigo-700 transition-all shadow-xs shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            👁️ View Report
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-muted-foreground font-medium italic text-center py-4">No communication notes posted yet for this case.</p>
                )}
              </div>
            </div>

            {/* Post New Note */}
            <div className="space-y-2 border-t border-border pt-3 text-left">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Type doctor or lab technician case note / shade query..."
                rows={2}
                className="w-full p-2.5 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              />

              {/* Attachment Badge / Upload Option */}
              <div className="flex items-center gap-2 py-1">
                <label className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] hover:bg-indigo-600 hover:text-white transition-all cursor-pointer flex items-center gap-1 shadow-2xs">
                  <span>📎 Attach Report / Scan</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.stl,.dcm"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setFiles((prev) => [...prev, { fileName: file.name, fileType: file.type.includes('pdf') ? 'PDF Report' : 'Scan File', fileUrl: ev.target.result }]);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {files.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {files.map((f, idx) => (
                      <span key={idx} className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                        📄 {f.fileName}
                        <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-700">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <select
                  value={commentRole}
                  onChange={(e) => setCommentRole(e.target.value)}
                  className="p-1.5 border border-border bg-background rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  <option value="Lab Technician">Lab Technician (V LAB CO-ORDINATOR)</option>
                  <option value="Dr. Arthur Vance, DDS">Dr. Arthur Vance (Dentist)</option>
                </select>

                <Button
                  size="sm"
                  onClick={async () => {
                    if (!newCommentText.trim() && files.length === 0) return;
                    const latestFile = files[files.length - 1] || null;
                    await useLabStore.getState().addCaseComment(
                      activeCommentingCase.id, 
                      newCommentText.trim() || (latestFile ? `Attached Lab Report: ${latestFile.fileName}` : ''), 
                      commentRole, 
                      commentRole.includes('Doctor') || commentRole.includes('DDS') ? 'Dentist' : 'Lab Tech',
                      latestFile
                    );
                    setNewCommentText('');
                    setFiles([]);
                    toast.success('Communication note & report posted to lab case file.');
                  }}
                  className="font-bold text-xs h-8 cursor-pointer"
                >
                  Post Note & Report
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default StatusBoardPage;
