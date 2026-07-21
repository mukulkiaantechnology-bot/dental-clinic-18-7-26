import { useEffect, useMemo } from 'react';
import { Calendar, FileText, Pill, Image as ImageIcon, Layers, FileSignature, Truck, Activity, Clock } from 'lucide-react';
import { useDentistStore } from '../../store/dentistStore';
import { useAppointmentStore } from '../../store/appointmentStore';
import { useLabStore } from '../../store/labStore';
import { Badge } from './Badge';

export function PatientTimeline({ patientId }) {
  const { 
    clinicalNotes, 
    prescriptions, 
    treatmentPlans, 
    xrays, 
    consentForms, 
    fetchPatientDetails,
    fetchConsentForms 
  } = useDentistStore();

  const { appointments, fetchAppointments } = useAppointmentStore();
  const { labCases, fetchLabCases } = useLabStore();

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails(patientId);
      fetchConsentForms(patientId);
      fetchAppointments();
      fetchLabCases();
    }
  }, [patientId, fetchPatientDetails, fetchConsentForms, fetchAppointments, fetchLabCases]);

  // Aggregate and sort clinical events chronologically
  const timelineEvents = useMemo(() => {
    if (!patientId) return [];

    const events = [];

    // 1. Appointments
    const patAppts = appointments.filter(a => a.patientId === patientId);
    patAppts.forEach(appt => {
      events.push({
        id: `appt-${appt.id}`,
        type: 'appointment',
        date: new Date(appt.date),
        displayDate: new Date(appt.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
        title: `Appointment - ${appt.type}`,
        icon: Calendar,
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        content: `Scheduled with Dr. ${appt.dentistName || 'Dentist'}. Time slot: ${appt.time} (${appt.duration} min).`,
        badge: appt.status,
        badgeVariant: appt.status === 'Completed' ? 'success' : appt.status === 'Cancelled' ? 'destructive' : 'info'
      });
    });

    // 2. SOAP Notes
    const patNotes = clinicalNotes[patientId] || [];
    patNotes.forEach(note => {
      events.push({
        id: `note-${note.id}`,
        type: 'clinical_note',
        date: new Date(note.createdAt),
        displayDate: new Date(note.createdAt).toLocaleString(),
        title: 'SOAP Progress Note Added',
        icon: FileText,
        color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        content: note.content,
        author: note.authorName || 'Unknown Clinician',
        role: note.authorRole || 'Provider'
      });
    });

    // 3. Prescriptions
    const patRxs = prescriptions[patientId] || [];
    patRxs.forEach(rx => {
      events.push({
        id: `rx-${rx.id}`,
        type: 'prescription',
        date: new Date(rx.date || rx.createdAt),
        displayDate: new Date(rx.date || rx.createdAt).toLocaleDateString(),
        title: `Prescription Issued: ${rx.drug}`,
        icon: Pill,
        color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        content: `Dosage: ${rx.dosage} | Frequency: ${rx.frequency} | Duration: ${rx.duration}`
      });
    });

    // 4. Treatment Plans
    const patPlans = treatmentPlans[patientId] || [];
    patPlans.forEach(tp => {
      events.push({
        id: `tp-${tp.id}`,
        type: 'treatment_plan',
        date: new Date(tp.createdAt),
        displayDate: new Date(tp.createdAt).toLocaleDateString(),
        title: `Procedure Proposed: ${tp.procedure}`,
        icon: Layers,
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        content: `Tooth Target: #${tp.tooth} | Fee Est: $${tp.cost}`,
        badge: tp.status,
        badgeVariant: tp.status === 'Completed' ? 'success' : tp.status === 'Proposed' ? 'secondary' : 'info'
      });
    });

    // 5. X-Rays / Diagnostic Scans
    const patXrays = xrays[patientId] || [];
    patXrays.forEach(xr => {
      let parsedReport = null;
      if (xr.aiReport) {
        try {
          const parsed = JSON.parse(xr.aiReport);
          if (parsed && typeof parsed === 'object') {
            parsedReport = parsed;
          } else {
            parsedReport = { rawReport: String(xr.aiReport) };
          }
        } catch { parsedReport = { rawReport: String(xr.aiReport) }; }
      }

      events.push({
        id: `xr-${xr.id}`,
        type: 'xray',
        date: new Date(xr.date || xr.createdAt),
        displayDate: new Date(xr.date || xr.createdAt).toLocaleDateString(),
        title: `Diagnostic Radiograph: ${xr.name}`,
        icon: ImageIcon,
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        content: xr.notes || 'No description provided.',
        isScanned: xr.isScanned,
        aiReport: parsedReport
      });
    });

    // 6. Informed Consents
    const patConsents = consentForms[patientId] || [];
    patConsents.forEach(cf => {
      events.push({
        id: `cf-${cf.id}`,
        type: 'consent',
        date: new Date(cf.createdAt),
        displayDate: new Date(cf.createdAt).toLocaleDateString(),
        title: `Informed Consent (${cf.type})`,
        icon: FileSignature,
        color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        content: `Status: ${cf.status}. ${cf.signedAt ? `Signed on ${new Date(cf.signedAt).toLocaleDateString()}` : 'Signature pending.'}`,
        badge: cf.status,
        badgeVariant: cf.status === 'Signed' ? 'success' : 'warning'
      });
    });

    // 7. Lab Cases & Uploaded Reports
    const patLabs = labCases.filter(lc => lc.patientId === patientId);
    patLabs.forEach(lc => {
      events.push({
        id: `lc-${lc.id}`,
        type: 'lab_case',
        date: new Date(lc.createdAt || Date.now()),
        displayDate: new Date(lc.createdAt || Date.now()).toLocaleDateString(),
        title: `Lab Order: ${lc.appliance || lc.type}`,
        icon: Truck,
        color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
        content: `Laboratory: ${lc.labName} | Est. Delivery: ${lc.expectedDelivery || lc.dueDate}`,
        badge: lc.status,
        badgeVariant: lc.status === 'Delivered' || lc.status === 'Received' ? 'success' : 'warning'
      });

      // Include timeline entries for each uploaded report or communication note
      const comments = Array.isArray(lc.comments) ? lc.comments : (typeof lc.comments === 'string' ? JSON.parse(lc.comments) : []);
      comments.forEach((cm, idx) => {
        const hasAttachment = cm.attachment || (cm.text && (cm.text.includes('.pdf') || cm.text.includes('.png') || cm.text.includes('Attached')));
        events.push({
          id: `lc-comment-${lc.id}-${idx}`,
          type: hasAttachment ? 'lab_report' : 'lab_note',
          date: new Date(cm.createdAt || Date.now()),
          displayDate: new Date(cm.createdAt || Date.now()).toLocaleDateString(),
          title: hasAttachment ? `📄 Lab Report Uploaded (${lc.type})` : `💬 Lab Communication Note (${lc.type})`,
          icon: hasAttachment ? FileText : Activity,
          color: hasAttachment ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
          content: `${cm.authorName} (${cm.authorRole}): ${cm.text}`,
          attachment: cm.attachment || (hasAttachment ? { fileName: 'Lab_Report.pdf', fileType: 'PDF Document' } : null),
          badge: hasAttachment ? 'Report Ready' : 'Lab Note',
          badgeVariant: hasAttachment ? 'success' : 'secondary'
        });
      });
    });

    // Sort descending by date
    return events.sort((a, b) => b.date - a.date);
  }, [patientId, appointments, clinicalNotes, prescriptions, treatmentPlans, xrays, consentForms, labCases]);

  if (!patientId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
        <Clock className="h-10 w-10 animate-pulse mb-3" />
        <p className="text-xs font-semibold">Select an active patient to load their clinical timeline history.</p>
      </div>
    );
  }

  if (timelineEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-muted/10">
        <Activity className="h-8 w-8 mb-2" />
        <p className="text-xs font-bold text-foreground">No History Found</p>
        <p className="text-[11px] font-semibold mt-1">This patient file has no clinical events, chart notes, or x-rays recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-foreground uppercase tracking-wider">Unified Patient Timeline</h3>
        <p className="text-xs text-muted-foreground font-semibold">
          Aggregated chronological record of diagnostics, clinical progress notes, prescriptions, consents, and treatments.
        </p>
      </div>

      {/* Timeline track */}
      <div className="relative pl-6 border-l-2 border-border/70 space-y-6 ml-3">
        {timelineEvents.map((evt) => {
          const Icon = evt.icon;
          return (
            <div key={evt.id} className="relative group">
              {/* Timeline marker */}
              <div className={`absolute -left-[35px] top-1 p-1.5 rounded-full border shadow-sm transition-all group-hover:scale-110 ${evt.color}`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Event Card */}
              <div className="p-4 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-border/80 transition-all space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-extrabold text-xs text-foreground tracking-wide flex items-center gap-1.5">
                    {evt.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-semibold">{evt.displayDate}</span>
                    {evt.badge && (
                      <Badge variant={evt.badgeVariant} className="text-[9px] font-extrabold px-1.5 py-px uppercase">
                        {evt.badge}
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line font-medium">
                  {evt.content}
                </p>

                {evt.author && (
                  <div className="text-[9px] font-bold text-primary uppercase pt-1 tracking-wider">
                    Author: {evt.author} ({evt.role})
                  </div>
                )}

                {/* Scan AI Report Mini Overview */}
                {evt.type === 'xray' && evt.isScanned && evt.aiReport && (
                  <div className="mt-2.5 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1.5 text-[10px]">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <span>🤖 AI Vision Radiograph Inspection Report</span>
                    </div>
                    {evt.aiReport.rawReport ? (
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line font-medium text-[10px]">
                        {evt.aiReport.rawReport}
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                          <div>
                            <span className="font-bold text-foreground">Caries Detected: </span> 
                            <span className={evt.aiReport.cariesDetected ? 'text-rose-500 font-extrabold' : 'text-emerald-500 font-extrabold'}>
                              {evt.aiReport.cariesDetected ? `Yes (${evt.aiReport.cariesConfidence}%)` : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-foreground">Bone Loss: </span>
                            <span className={evt.aiReport.boneLossDetected ? 'text-rose-500 font-extrabold' : 'text-emerald-500 font-extrabold'}>
                              {evt.aiReport.boneLossDetected ? `Yes (${evt.aiReport.boneLossPercentage}%)` : 'None'}
                            </span>
                          </div>
                        </div>
                        {evt.aiReport.observations && evt.aiReport.observations.length > 0 && (
                          <div className="text-[9px] leading-relaxed text-muted-foreground mt-1.5">
                            <span className="font-bold text-foreground block">Observations:</span>
                            <ul className="list-disc pl-3">
                              {evt.aiReport.observations.map((obs, i) => (
                                <li key={i}>{obs}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
