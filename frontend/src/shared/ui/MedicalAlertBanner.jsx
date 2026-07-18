import { useMemo } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export function MedicalAlertBanner({ patient }) {
  const alerts = useMemo(() => {
    if (!patient) return [];

    const activeAlerts = [];

    // Robust list parser
    const parseList = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field.map(x => String(x).toLowerCase());
      try {
        if (typeof field === 'string') {
          const parsed = JSON.parse(field);
          if (Array.isArray(parsed)) return parsed.map(x => String(x).toLowerCase());
          if (typeof parsed === 'object' && parsed !== null) {
            return Object.values(parsed).map(x => String(x).toLowerCase());
          }
        }
      } catch { /* ignore JSON parse errors */ }
      return String(field).toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
    };

    const patientAllergies = parseList(patient.allergies);
    const hasAllergy = (terms) => patientAllergies.some(a => terms.some(t => a.includes(t)));

    // 1. Allergies audit
    if (hasAllergy(['penicillin', 'amox', 'cillin'])) {
      activeAlerts.push({
        id: 'allergy-penicillin',
        label: '🚫 PENICILLIN ALLERGY',
        severity: 'critical',
        message: 'Strict contraindication to penicillin-class antibiotics (Amoxicillin). Use Clindamycin or Azithromycin as alternatives.'
      });
    }
    if (hasAllergy(['nsaid', 'ibuprofen', 'aspirin', 'naproxen'])) {
      activeAlerts.push({
        id: 'allergy-nsaid',
        label: '⚠️ NSAID SENSITIVITY',
        severity: 'warning',
        message: 'Patient reports sensitivity to NSAIDs. Avoid Ibuprofen or Aspirin. Use Acetaminophen for pain control.'
      });
    }

    // 2. Conditions audit
    const conditions = parseList(patient.medicalConditions);
    const condsStr = conditions.join(' ');

    if (condsStr.includes('hypertension') || condsStr.includes('high blood pressure') || condsStr.includes('heart') || condsStr.includes('arrhythmia')) {
      activeAlerts.push({
        id: 'cond-hypertension',
        label: '⚠️ CARDIOVASCULAR RISK',
        severity: 'critical',
        message: 'Hypertension/Heart Disease. Contraindicated with Epinephrine local anesthetics. Avoid Epinephrine (Lidocaine 2% 1:100k). Use Mepivacaine 3% Plain.'
      });
    }
    if (condsStr.includes('diabetes') || condsStr.includes('diabetic')) {
      activeAlerts.push({
        id: 'cond-diabetes',
        label: '⚠️ DIABETES MELLITUS',
        severity: 'warning',
        message: 'Glycemic Warning: Epinephrine may elevate blood glucose. Limit epi dosage. Assess HbA1c prior to invasive surgeries.'
      });
    }
    if (condsStr.includes('asthma') || condsStr.includes('copd')) {
      activeAlerts.push({
        id: 'cond-asthma',
        label: '⚠️ RESPIRATORY RISK (ASTHMA)',
        severity: 'warning',
        message: 'Avoid sulfites. Ensure inhaler is present at chairside prior to dental treatment.'
      });
    }

    // 3. Medications audit
    const meds = parseList(patient.activeMedications);
    const medsStr = meds.join(' ');

    if (medsStr.includes('warfarin') || medsStr.includes('coumadin') || medsStr.includes('aspirin') || medsStr.includes('anticoag') || medsStr.includes('clopidogrel')) {
      activeAlerts.push({
        id: 'med-bleeding',
        label: '⚠️ BLEEDING RISK (ANTICOAGULANT)',
        severity: 'critical',
        message: 'Patient taking anticoagulants (Warfarin/Aspirin). Verify current INR before extractions or scaling. Avoid NSAIDs due to bleeding risks.'
      });
    }
    if (medsStr.includes('propranolol') || medsStr.includes('atenolol') || medsStr.includes('metoprolol')) {
      activeAlerts.push({
        id: 'med-beta-blocker',
        label: '⚠️ BETA BLOCKER INTERACTION',
        severity: 'warning',
        message: 'Patient taking non-selective beta blocker. Risk of hypertensive crisis with Epinephrine. Limit Epinephrine dosage.'
      });
    }

    return activeAlerts;
  }, [patient]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 animate-pulse-subtle">
      {alerts.map((alert) => {
        const isCritical = alert.severity === 'critical';
        return (
          <div 
            key={alert.id} 
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-3 text-left shadow-sm transition-all ${
              isCritical 
                ? 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-400' 
                : 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${isCritical ? 'bg-rose-500/10' : 'bg-amber-500/10'}`}>
              {isCritical ? (
                <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
              ) : (
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
              )}
            </div>
            <div className="space-y-0.5 flex-1">
              <span className="font-extrabold text-[11px] block uppercase tracking-wide">
                {alert.label}
              </span>
              <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                {alert.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
