import { useState } from 'react';
import { Pill, Printer, Calendar, User, Clock, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { usePatientStore } from '../../../store/patientStore';
import { useAuthStore } from '../../../store/authStore';
import { useClinicStore } from '../../../store/clinicStore';
import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';

export function PatientPrescriptions() {
  const { prescriptions, patientProfile, appointments } = usePatientStore();
  
  const assignedDoctor = patientProfile?.dentistName || 
                         patientProfile?.assignedDoctorName || 
                         (appointments && appointments.length > 0 ? appointments[0].dentistName : null) || 
                         'Not Assigned';
  const { user } = useAuthStore();
  const getClinicName = useClinicStore((state) => state.getClinicName);
  
  const clinicName = patientProfile?.clinic?.name || patientProfile?.clinicName || (user?.clinicId ? getClinicName(user.clinicId) : 'Metropolitan Dental Clinic');
  const clinicLocation = patientProfile?.clinic?.location || '1200 Pike Street, Seattle, WA 98101';
  const clinicPhone = patientProfile?.clinic?.phone || '(206) 555-0100';
  const toast = useToast();
  
  const [isPrinting, setIsPrinting] = useState(false);

  const executePrint = () => {
    window.print();
    toast.success('Prescription sent to system print spooler.');
    setIsPrinting(false);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Active Prescriptions</h2>
          <p className="text-[10px] text-muted-foreground font-semibold">
            Review your medications, dosage schedules, duration, and pharmacy directions.
          </p>
        </div>
        {prescriptions.length > 0 && (
          <Button
            onClick={() => setIsPrinting(true)}
            className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print All Rx
          </Button>
        )}
      </div>

      {/* Prescription List */}
      {prescriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/45 transition-all relative overflow-hidden"
            >
              {/* Decorative side color strip */}
              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-primary" />

              <div className="pl-2 space-y-3">
                {/* Drug name */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                      <Pill className="h-4 w-4 text-primary" />
                      {rx.drug}
                    </h3>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Prescribed on {rx.date}
                    </p>
                  </div>
                </div>

                {/* Instructions grid */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold py-2.5 border-y border-border/50">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
                      Instructions & Dosage
                    </span>
                    <span className="text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {rx.dosage} · {rx.frequency}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
                      Duration
                    </span>
                    <span className="text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {rx.duration}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pt-1.5">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Doctor: {assignedDoctor}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl text-center bg-card">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3 stroke-1" />
          <h4 className="text-sm font-bold text-foreground">No active prescriptions</h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            You do not have any pending or active medication prescriptions registered at this clinic.
          </p>
        </div>
      )}

      {/* Allergies Warning card if any */}
      {patientProfile?.allergies && patientProfile.allergies !== 'None' && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-500 p-4 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs font-semibold">
            <h4 className="font-extrabold text-sm text-foreground">Allergy Warning Context</h4>
            <p className="text-muted-foreground leading-normal">
              Your medical chart lists an active allergy to <strong>{patientProfile.allergies}</strong>. Inform your pharmacy or dentist if any prescribed medication conflicts with this profile.
            </p>
          </div>
        </div>
      )}

      {/* Printable official pad prescription modal */}
      {isPrinting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:p-0 print:bg-white">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative text-left print:border-none print:shadow-none print:rounded-none">
            
            {/* Modal Header - Hidden on Print */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20 print:hidden">
              <h3 className="font-extrabold text-sm text-foreground">Print Preview</h3>
              <button
                onClick={() => setIsPrinting(false)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Official Rx Pad Body */}
            <div className="p-4 space-y-4 bg-white dark:bg-white text-slate-800 text-[10px] font-semibold leading-normal print:p-0">
              
              {/* Clinic Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3 space-y-1">
                <h2 className="text-sm font-black text-slate-900 tracking-wide uppercase">{clinicName}</h2>
                <p className="text-[10px] text-slate-500">{clinicLocation} · Tel: {clinicPhone}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{assignedDoctor} · Licensing ID #WA-76352</p>
              </div>

              {/* Patient details block */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4 text-slate-700">
                <div className="space-y-1">
                  <span className="text-[8px] uppercase text-slate-400 font-bold block">Patient Name</span>
                  <span className="text-slate-900 font-bold text-xs">{patientProfile?.name || 'James Carter'}</span>
                  <span className="text-[10px] text-slate-500 block">Age: {patientProfile?.age || 45}</span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[8px] uppercase text-slate-400 font-bold block">Prescription Date</span>
                  <span className="text-slate-900 font-bold text-xs">{prescriptions[0]?.date || new Date().toISOString().split('T')[0]}</span>
                  <span className="text-[10px] text-slate-500 block">Rx Ref: #{prescriptions[0]?.id || 'N/A'}</span>
                </div>
              </div>

              {/* Rx Medicine script */}
              <div className="py-1 space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                {prescriptions.map((rx, idx) => (
                  <div key={rx.id || idx} className="space-y-2 border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                      <span className="text-xl font-serif leading-none italic pr-1">Rₓ</span>
                      {rx.drug}
                    </div>

                    <div className="pl-6 space-y-1 text-slate-700 text-[10px]">
                      <p><strong>Sig:</strong> Take {rx.dosage} — {rx.frequency}</p>
                      <p><strong>Dispense Quantity:</strong> QS for {rx.duration}</p>
                      <p><strong>Refills:</strong> 0 (None)</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer / Signature block */}
              <div className="border-t border-slate-200 pt-4 flex justify-between items-end text-slate-600">
                <div className="text-[7px] uppercase text-slate-400 leading-normal max-w-[200px]">
                  * This is an official clinical prescription check. Substitutions permitted unless checked DAW.
                </div>
                <div className="text-center space-y-1">
                  <div className="font-serif italic text-slate-800 text-sm">{assignedDoctor}</div>
                  <div className="w-[120px] h-px bg-slate-400" />
                  <span className="text-[8px] uppercase text-slate-400 font-bold block">Authorized Signature</span>
                </div>
              </div>
            </div>

            {/* Modal Controls - Hidden on Print */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/20 print:hidden">
              <Button
                variant="ghost"
                onClick={() => setIsPrinting(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={executePrint}
                className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Spool Print
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default PatientPrescriptions;
