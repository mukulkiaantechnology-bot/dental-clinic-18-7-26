import { useEffect, useMemo } from 'react';
import { Sparkles, AlertTriangle, Lightbulb, TrendingUp, ArrowUpRight, DollarSign, Users, Award, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { useAlertStore } from '../../store/alertStore';
import { useDentistStore } from '../../store/dentistStore';
import { useAppointmentStore } from '../../store/appointmentStore';
import { useHygienistStore } from '../../store/hygienistStore';

export function AIInsightsPanel() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'dentist';

  const { insights, fetchAIInsights } = useAnalyticsStore();
  const { alerts, markAsRead, subscribeToRoleAlerts } = useAlertStore();
  const patients = useDentistStore((state) => state.patients);
  const appointments = useAppointmentStore((state) => state.appointments);
  useHygienistStore((state) => state.patients);

  useEffect(() => {
    if (role === 'clinic_owner') {
      fetchAIInsights();
    }
  }, [role, fetchAIInsights]);

  useEffect(() => {
    if (role !== 'clinic_owner') {
      const unsubscribe = subscribeToRoleAlerts();
      return unsubscribe;
    }
  }, [role, subscribeToRoleAlerts]);

  // Role-specific simulated medical & operational insights for other roles
  const mockInsights = useMemo(() => {
    switch (role) {
      case 'super_admin':
        return [];
      case 'dentist': {
        const dynamicInsights = [];
        
        // 1. Allergy Alert
        const allergic = patients.find(p => p.allergies && p.allergies.length > 0 && p.allergies[0] !== 'None');
        if (allergic) {
          dynamicInsights.push({
            type: 'suggestion',
            title: 'Safety Warning',
            desc: `Patient ${allergic.name} has flagged allergies: ${Array.isArray(allergic.allergies) ? allergic.allergies.join(', ') : allergic.allergies}. Review medical history before prescribing.`,
            badge: 'Safety First',
            color: 'rose'
          });
        }

        // 2. Schedule Risk / Next Appointment
        const today = new Date().toISOString().split('T')[0];
        const todayApts = appointments.filter(a => a.date === today && a.workflowStage !== 'COMPLETED' && a.workflowStage !== 'CANCELLED');
        if (todayApts.length > 0) {
          const nextApt = todayApts[0];
          dynamicInsights.push({
            type: 'recommendation',
            title: 'Upcoming Procedure',
            desc: `Next patient ${nextApt.patientName} is scheduled for ${nextApt.type || nextApt.treatment || 'Consultation'} at ${nextApt.time}. Ensure chair is prepared.`,
            badge: 'Preparation',
            color: 'amber'
          });
        }

        // 3. Outstanding action
        const checkedIn = todayApts.find(a => a.workflowStage === 'CHECKED_IN' || a.workflowStage === 'IN_PROGRESS' || a.workflowStage === 'TREATMENT_PENDING');
        if (checkedIn) {
          dynamicInsights.push({
            type: 'risk',
            title: 'Radiograph Review',
            desc: `${checkedIn.patientName} is currently checked-in/waiting. Please review any recent bitewing or panoramic scans before beginning treatment.`,
            badge: 'EHR Audit',
            color: 'red'
          });
        }

        // Fallback
        if (dynamicInsights.length === 0) {
          dynamicInsights.push({
            type: 'recommendation',
            title: 'Schedule Optimization',
            desc: 'All charts are updated and there are no immediate clinical warnings. You are on track for today.',
            badge: 'All Clear',
            color: 'indigo'
          });
        }
        
        return dynamicInsights.slice(0, 3);
      }
      case 'hygienist': {
        const dynamicInsights = [];
        
        // 1. Perio / Cleaning alert
        const today = new Date().toISOString().split('T')[0];
        const todayApts = appointments.filter(a => a.date === today && a.workflowStage !== 'COMPLETED' && a.workflowStage !== 'CANCELLED');
        
        const nextApt = todayApts[0];
        if (nextApt) {
          dynamicInsights.push({
            type: 'suggestion',
            title: 'Hygiene Preparation',
            desc: `Next patient ${nextApt.patientName} is scheduled for ${nextApt.type || 'Cleaning'} at ${nextApt.time}. Review perio charts and calculus history.`,
            badge: 'Hygiene Plan',
            color: 'indigo'
          });
        }

        // 2. Outstanding actions
        const checkedIn = todayApts.find(a => a.workflowStage === 'CHECKED_IN' || a.workflowStage === 'CLEANING_PENDING');
        if (checkedIn) {
          dynamicInsights.push({
            type: 'risk',
            title: 'Patient Waiting',
            desc: `${checkedIn.patientName} is waiting for their hygiene session. Please prepare the chair and instruments.`,
            badge: 'Clinical Alert',
            color: 'red'
          });
        }

        // Fallback
        if (dynamicInsights.length === 0) {
          dynamicInsights.push({
            type: 'recommendation',
            title: 'Prophy Schedule Clear',
            desc: 'All cleanings are completed and there are no immediate clinical warnings. You are on track for today.',
            badge: 'Smart Assist',
            color: 'amber'
          });
        }
        
        return dynamicInsights.slice(0, 3);
      }
      case 'front_desk':
      case 'frontdesk':
        return [
          {
            type: 'risk',
            title: 'Waitlist Schedule Risk',
            desc: 'Dr. Michael Chen has an open slot at 2:00 PM due to cancellation. High risk of lost productivity ($250 estimated value).',
            badge: 'Booking Alert',
            color: 'red'
          },
          {
            type: 'suggestion',
            title: 'Smart Waitlist Auto-Match',
            desc: 'Waitlisted patient Zaphod Beeblebrox requires a Root Canal Check and matches Dr. Chen\'s open 2:00 PM slot. Click to send booking SMS.',
            badge: 'Auto-Match',
            color: 'indigo'
          },
          {
            type: 'recommendation',
            title: 'Insurance Co-Pay Pre-Auth',
            desc: 'Patient Arthur Dent (Walk-in) eligibility check is pending with Cigna. Request insurance verification before dental charting starts.',
            badge: 'Intake Rec',
            color: 'amber'
          }
        ];
      case 'dental_assistant':
      case 'assistant':
        return [
          {
            type: 'risk',
            title: 'Scan Upload Pending',
            desc: 'No bite-wing radiographs loaded for scheduled patient Mary Watson. Confirm radiograph order with clinician.',
            badge: 'Imaging Due',
            color: 'red'
          },
          {
            type: 'suggestion',
            title: 'Chairside Support Checklist',
            desc: 'Root Canal procedure on #19 is scheduled for Dr. Chen at 11:30 AM. Pre-stage endodontic files and rubber dam setup.',
            badge: 'Preparation',
            color: 'indigo'
          },
          {
            type: 'recommendation',
            title: 'Sterilization Queue Count',
            desc: 'Autoclave unit 2 has completed cycle 4. Verify diagnostic cassette indicator tags and restock exam drawer 3.',
            badge: 'Clinic Ops',
            color: 'amber'
          }
        ];
      default:
        return [];
    }
  }, [role, patients, appointments]);

  const realInsights = useMemo(() => {
    if (role === 'clinic_owner') return [];
    const activeAlerts = (alerts || []).filter(a => !a.read);
    return activeAlerts.map(alert => ({
      id: alert.id,
      type: alert.type === 'critical' ? 'risk' : alert.type === 'warning' ? 'recommendation' : 'suggestion',
      title: alert.title,
      desc: alert.message,
      badge: alert.type === 'critical' ? 'CRITICAL ALERT' : 'WARNING',
      color: alert.type === 'critical' ? 'red' : 'amber',
      isReal: true
    }));
  }, [alerts, role]);

  const displayedInsights = useMemo(() => {
    return [...realInsights, ...mockInsights];
  }, [realInsights, mockInsights]);

  if (role !== 'clinic_owner' && displayedInsights.length === 0) return null;

  return (
    <div className="bg-card/50 backdrop-blur-md border border-border rounded-3xl p-6 shadow-sm space-y-6 text-left w-full max-w-full">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">
            {role === 'clinic_owner' ? 'AI Business Intelligence & Insights' : 'Clinical AI Insights'}
          </h3>
        </div>
        <span className="text-[8px] font-black uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full select-none">
          Active Co-Pilot
        </span>
      </div>

      {role === 'clinic_owner' ? (
        /* Apple-style premium dashboard card grids */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((ins) => {
            const isRevenue = ins.type === 'revenue';
            const isRecall = ins.type === 'hygiene';

            return (
              <div
                key={ins.id}
                className="bg-card hover:bg-card/80 border border-border p-6 rounded-2xl flex flex-col justify-between h-64 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group select-none shadow-xs"
              >
                {/* Accent design highlights */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  {isRevenue ? (
                    <DollarSign className="h-28 w-28 text-primary" />
                  ) : isRecall ? (
                    <Users className="h-28 w-28 text-rose-500" />
                  ) : (
                    <Award className="h-28 w-28 text-emerald-500" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                      {ins.title}
                    </span>
                    <span className="text-[9px] font-bold text-primary flex items-center gap-0.5">
                      AI Analyzed <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>

                  <h3 className="text-3xl font-black text-foreground mt-2 tracking-tight">
                    {ins.metric}
                  </h3>
                  
                  <p className="text-xs text-muted-foreground font-bold leading-normal mt-1">
                    {ins.desc}
                  </p>
                </div>

                <div className="space-y-2 mt-4 pt-3 border-t border-border/60">
                  {ins.type === 'top_patients' ? (
                    <div className="text-[10px] text-foreground font-bold whitespace-pre-line leading-relaxed">
                      {ins.subtext}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      {ins.subtext}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider pt-1">
                    <span className={isRevenue ? 'text-primary' : isRecall ? 'text-rose-500' : 'text-emerald-500'}>
                      {ins.trend}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Render normal clinical insights list for clinical staff role */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedInsights.map((ins, idx) => {
            let IconComp = Lightbulb;
            let colorClasses = 'bg-indigo-500/5 border-indigo-500/15 text-indigo-600 dark:text-indigo-400';
            let iconColor = 'text-indigo-500';

            if (ins.type === 'risk') {
              IconComp = AlertTriangle;
              colorClasses = 'bg-rose-500/5 border-rose-500/15 text-rose-600 dark:text-rose-400';
              iconColor = 'text-rose-500';
            } else if (ins.type === 'recommendation') {
              IconComp = TrendingUp;
              colorClasses = 'bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-400';
              iconColor = 'text-amber-500';
            }

            return (
              <div
                key={ins.id || idx}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 text-xs leading-normal font-semibold shadow-xs transition-transform hover:-translate-y-0.5 duration-200 ${colorClasses} h-full`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-[9px] uppercase tracking-wider block opacity-90 truncate">
                      {ins.title}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase shrink-0 border bg-background/50`}>
                      {ins.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mt-1">
                    {ins.desc}
                  </p>
                </div>
                
                <div className="flex items-center justify-between border-t border-current/10 pt-2.5 text-[9px] font-extrabold select-none">
                  <div className="flex items-center gap-1.5">
                    <IconComp className={`h-3.5 w-3.5 ${iconColor}`} />
                    <span>{ins.isReal ? 'Real-time Clinical Warning' : 'Dynamic Clinical Insight'}</span>
                  </div>
                  {ins.isReal && (
                    <button
                      onClick={() => markAsRead(ins.id)}
                      className="text-primary hover:text-primary/80 font-black cursor-pointer bg-transparent border-0 p-1 rounded hover:bg-primary/10 transition-colors flex items-center justify-center"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AIInsightsPanel;
