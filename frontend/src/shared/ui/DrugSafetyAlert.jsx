import { useMemo } from 'react';
import { AlertOctagon, Check, ArrowRight, Sparkles, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useDentistStore } from '../../store/dentistStore';
import { useClinicOwnerStore } from '../../store/clinicOwnerStore';
import { Button } from './Button';

/**
 * Reusable Rules Engine for Dental Clinical & Prescription Safety
 */
export function checkDrugInteractions(patient, prescribedDrug) {
  if (!patient) return [];

  const alerts = [];
  const drugName = (prescribedDrug || '').toLowerCase();

  // Helper to extract patient data arrays (supporting strings, arrays, or JSON arrays)
  const parseList = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field.map(x => String(x).toLowerCase());
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed.map(x => String(x).toLowerCase());
    } catch (_e) {
      // Ignore parse errors, fallback to split string
    }
    return String(field).toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
  };

  const patientAllergies = parseList(patient.allergies);
  const patientConditions = parseList(patient.medicalConditions).concat(
    String(patient.history || '').toLowerCase().split(/[.,;\n]/).map(s => s.trim()).filter(Boolean)
  );
  const patientMeds = parseList(patient.activeMedications);

  // Helper matchers
  const hasCondition = (terms) => patientConditions.some(c => terms.some(t => c.includes(t)));
  const hasMed = (terms) => patientMeds.some(m => terms.some(t => m.includes(t)));
  const hasAllergy = (terms) => patientAllergies.some(a => terms.some(t => a.includes(t)));

  // ───────────────────────────────────────────────────────────────────────────
  // RULE 1: Epinephrine vs. Cardiovascular Conditions & Beta-Blockers / MAOIs
  // ───────────────────────────────────────────────────────────────────────────
  const isEpiAnesthetic = drugName.includes('epi') || drugName.includes('adrenaline') || drugName.includes('lidocaine + epinephrine');
  
  if (isEpiAnesthetic) {
    const triggerConditions = [];
    if (hasCondition(['hypertension', 'high bp', 'blood pressure'])) triggerConditions.push('Hypertension');
    if (hasCondition(['heart disease', 'cardiac', 'coronary'])) triggerConditions.push('Heart Disease');
    if (hasCondition(['arrhythmia', 'fibrillation', 'tachycardia'])) triggerConditions.push('Arrhythmia');
    if (hasCondition(['hyperthyroid'])) triggerConditions.push('Hyperthyroidism');

    const triggerMeds = [];
    if (hasMed(['propranolol'])) triggerMeds.push('Propranolol (Beta-blocker)');
    if (hasMed(['atenolol'])) triggerMeds.push('Atenolol (Beta-blocker)');
    if (hasMed(['maoi', 'phenelzine', 'tranylcypromine', 'selegiline'])) triggerMeds.push('MAO Inhibitor');

    if (triggerConditions.length > 0 || triggerMeds.length > 0) {
      const details = [];
      if (triggerConditions.length > 0) details.push(`medical conditions (${triggerConditions.join(', ')})`);
      if (triggerMeds.length > 0) details.push(`current medications (${triggerMeds.join(', ')})`);

      alerts.push({
        id: 'epi-warning',
        severity: 'critical',
        title: '🚫 Epinephrine Contraindication',
        message: `Patient has ${details.join(' and ')}. Epinephrine (vasoconstrictor) poses severe risk of hypertensive crisis or arrhythmia in these cases.`,
        suggestedAlternatives: ['Mepivacaine 3% Plain', 'Prilocaine 4% Plain'],
        type: 'anesthetic'
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RULE 2: Penicillin Allergies vs Amoxicillin / Penicillin
  // ───────────────────────────────────────────────────────────────────────────
  const isPenicillinDrug = drugName.includes('amox') || drugName.includes('penic') || drugName.includes('ampic');
  if (isPenicillinDrug) {
    if (hasAllergy(['penic', 'amox', 'cillin'])) {
      alerts.push({
        id: 'penicillin-contraindication',
        severity: 'critical',
        title: '⚠️ Penicillin Allergy Contraindication',
        message: `Patient has documented allergy to Penicillin. Prescribing Amoxicillin/Penicillin derivatives poses severe anaphylaxis risk.`,
        suggestedAlternatives: ['Clindamycin 300mg', 'Azithromycin'],
        type: 'allergy'
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RULE 3: Anticoagulants (Warfarin/Aspirin) vs NSAIDs (Ibuprofen)
  // ───────────────────────────────────────────────────────────────────────────
  const isNsaid = drugName.includes('ibuprofen') || drugName.includes('aspirin') || drugName.includes('naproxen') || drugName.includes('advil') || drugName.includes('motrin');
  if (isNsaid) {
    if (hasMed(['warfarin', 'coumadin', 'eliquis', 'apixaban', 'xarelto', 'aspirin'])) {
      alerts.push({
        id: 'nsaid-bleeding-risk',
        severity: 'warning',
        title: '⚠️ NSAID Gastric Bleeding Risk',
        message: `Patient is taking anticoagulant therapy (Warfarin/Aspirin). NSAIDs significantly elevate risk of gastrointestinal hemorrhage and bleeding events.`,
        suggestedAlternatives: ['Acetaminophen'],
        type: 'interaction'
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RULE 4: Pregnancy vs NSAIDs
  // ───────────────────────────────────────────────────────────────────────────
  if (isNsaid) {
    if (hasCondition(['pregnant', 'pregnancy', 'gestation'])) {
      alerts.push({
        id: 'nsaid-pregnancy-warning',
        severity: 'warning',
        title: '⚠️ Pregnancy NSAID Contraindication',
        message: `Patient is pregnant. NSAIDs can cause premature closure of fetal ductus arteriosus and fetal renal dysfunction. Avoid third trimester.`,
        suggestedAlternatives: ['Acetaminophen 500mg'],
        type: 'pregnancy'
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RULE 5: Insulin / Diabetes vs Epinephrine
  // ───────────────────────────────────────────────────────────────────────────
  if (isEpiAnesthetic) {
    if (hasCondition(['diabetes', 'diabetic']) || hasMed(['insulin', 'metformin'])) {
      alerts.push({
        id: 'epi-diabetes-info',
        severity: 'info',
        title: 'ℹ️ Epinephrine Glycemic Alert',
        message: `Epinephrine can increase blood glucose levels and antagonize the effects of insulin. Monitor patient vitals closely post-injection.`,
        suggestedAlternatives: ['Mepivacaine 3% Plain'],
        type: 'glycemic'
      });
    }
  }

  return alerts;
}

export function DrugSafetyAlert({ patientId, activePrescribedDrug, onSwitchMedication }) {
  const toast = useToast();
  
  // Find patient details from either store for maximum sync compatibility
  const dentistPatients = useDentistStore((state) => state.patients) || [];
  const clinicPatients = useClinicOwnerStore((state) => state.patients) || [];
  const patient = dentistPatients.find((p) => p.id === patientId) || clinicPatients.find((p) => p.id === patientId);

  const alerts = useMemo(() => {
    if (patient && activePrescribedDrug) {
      return checkDrugInteractions(patient, activePrescribedDrug);
    }
    return [];
  }, [patient, activePrescribedDrug]);

  const handleApplyAlternative = (altDrug) => {
    if (onSwitchMedication) {
      onSwitchMedication(altDrug);
      toast.success(`Medication prescription updated to ${altDrug}.`, 'Safety Alternative Applied');
    }
  };

  if (!activePrescribedDrug) {
    return null;
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/15 p-3.5 rounded-xl flex items-center gap-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 w-full text-left">
        <div className="p-1.5 bg-emerald-500/10 rounded-lg shrink-0">
          <Check className="h-4.5 w-4.5 text-emerald-500" />
        </div>
        <div className="space-y-0.5 flex-1">
          <span className="font-extrabold text-[11px] block uppercase">Drug Safety Screen Clearance</span>
          <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
            Prescribed drug is compatible with patient allergies, conditions, and active medications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isCritical = alert.severity === 'critical';
        const isWarning = alert.severity === 'warning';

        return (
          <div
            key={alert.id}
            className={`border p-4 rounded-xl flex flex-col gap-3 text-xs font-semibold w-full text-left animate-shake ${
              isCritical
                ? 'bg-rose-500/5 border-rose-500/15 text-rose-600 dark:text-rose-400'
                : isWarning
                ? 'bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'bg-indigo-500/5 border-indigo-500/15 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            {/* Warning Header */}
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 animate-pulse ${
                  isCritical
                    ? 'bg-rose-500/10'
                    : isWarning
                    ? 'bg-amber-500/10'
                    : 'bg-indigo-500/10'
                }`}
              >
                {isCritical ? (
                  <AlertOctagon className="h-5 w-5 text-rose-500" />
                ) : isWarning ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <Info className="h-5 w-5 text-indigo-500" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-black text-[11px] uppercase tracking-wider block">
                    {alert.title}
                  </span>
                  <span
                    className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase select-none ${
                      isCritical
                        ? 'bg-rose-500 text-white'
                        : isWarning
                        ? 'bg-amber-500 text-slate-900'
                        : 'bg-indigo-500 text-white'
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>

            {/* Suggested Alternative Banner */}
            {alert.suggestedAlternatives && alert.suggestedAlternatives.length > 0 && (
              <div className="p-3 bg-card border border-border rounded-lg flex flex-col gap-2">
                <span className="font-black text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 select-none">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Clinical Alternatives
                </span>
                <div className="flex flex-col gap-1.5">
                  {alert.suggestedAlternatives.map((alt) => (
                    <div key={alt} className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-foreground font-extrabold flex items-center gap-1">
                        Switch to {alt} <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </span>
                      <Button
                        size="xs"
                        onClick={() => handleApplyAlternative(alt)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-7.5 px-3 rounded-lg shadow-sm gap-1 cursor-pointer text-[10px]"
                      >
                        Apply Switch
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default DrugSafetyAlert;
