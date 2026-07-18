import { useState } from 'react';
import { Sparkles, Users, AlertTriangle, ArrowRight, MessageSquare, Clipboard, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';
import { Badge } from '../../../shared/ui/Badge';
import { useToast } from '../../../shared/hooks/useToast';

const INITIAL_INSIGHTS = [
  {
    id: 'ai-1',
    type: 'clinical',
    title: 'Periodontic Intervention Flagged',
    description: 'Patient Robert Vance exhibits pocket depths of 5mm on Tooth #14 Buccal. AI Copilot suggests scheduling a localized Scaling and Root Planing (SRP) procedure.',
    impact: 'High',
    actionLabel: 'Add to Treatment Plan',
    actionToast: 'SRP procedure for Tooth #14 added to Robert Vance\'s treatment plan.'
  },
  {
    id: 'ai-2',
    type: 'patient',
    title: 'Follow-Up Recall Reminder Overdue',
    description: 'Patient Samantha Collins is 14 days overdue for her orthodontic crown cementation checkup. AI recommends drafting a customized recall SMS.',
    impact: 'Medium',
    actionLabel: 'Draft Recall SMS',
    actionToast: 'Recall reminder SMS queued for Samantha Collins.'
  },
  {
    id: 'ai-3',
    type: 'operational',
    title: 'Staff Load Bottleneck Detected',
    description: 'Vance Dental clinic shows high provider load between 9:00 AM and 11:30 AM tomorrow. AI suggests allocating assistant Marcus Brody to chairside support.',
    impact: 'Medium',
    actionLabel: 'Optimize Scheduling',
    actionToast: 'Dental assistant Marcus Brody assigned to morning chairside support.'
  }
];

export function AIPage() {
  const toast = useToast();

  const [insights, setInsights] = useState(INITIAL_INSIGHTS);
  const [activeFilter, setActiveFilter] = useState('all');

  const handleApplyInsight = (id, toastMsg) => {
    toast.success(toastMsg, 'AI Action Completed');
    setInsights((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredInsights = insights.filter((ins) => {
    if (activeFilter === 'all') return true;
    return ins.type === activeFilter;
  });

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary fill-primary/10 animate-pulse" />
            AI Clinical Assistant
          </h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            Real-time diagnostic auditing, operational bottleneck predictions, and smart automation pipelines.
          </p>
        </div>
        <Badge variant="success" className="gap-1.5 font-bold py-1 px-3">
          <Sparkles className="h-3.5 w-3.5 fill-current" />
          Model Active (HMS-v3)
        </Badge>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'clinical', 'patient', 'operational'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              activeFilter === filter
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Insights Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights list */}
        <div className="lg:col-span-2 space-y-4">
          {filteredInsights.map((insight) => {
            const icons = {
              clinical: <AlertTriangle className="h-5 w-5 text-destructive" />,
              patient: <MessageSquare className="h-5 w-5 text-info" />,
              operational: <Users className="h-5 w-5 text-warning" />
            };

            return (
              <div
                key={insight.id}
                className="bg-card border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between h-fit gap-4"
              >
                {/* Visual Accent bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    insight.type === 'clinical'
                      ? 'bg-destructive'
                      : insight.type === 'patient'
                      ? 'bg-info'
                      : 'bg-warning'
                  }`}
                />

                <div className="space-y-2 pl-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                      {insight.type} insight
                    </span>
                    <Badge
                      variant={
                        insight.impact === 'High'
                          ? 'destructive'
                          : insight.impact === 'Medium'
                          ? 'warning'
                          : 'secondary'
                      }
                      className="text-[9px] font-bold py-px"
                    >
                      {insight.impact} Priority
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    {icons[insight.type]}
                    {insight.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                    {insight.description}
                  </p>
                </div>

                <div className="flex justify-end pt-3 border-t border-border pl-2">
                  <Button
                    onClick={() => handleApplyInsight(insight.id, insight.actionToast)}
                    className="gap-2 select-none text-xs font-bold"
                  >
                    {insight.actionLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {filteredInsights.length === 0 && (
            <div className="bg-card border border-border p-12 text-center rounded-xl text-muted-foreground font-medium flex flex-col items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success mb-2" />
              All clinical audits resolved. No further recommendations.
            </div>
          )}
        </div>

        {/* AI Metrics & Operational efficiency statistics */}
        <div className="space-y-4">
          <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
              <Clipboard className="h-4 w-4 text-primary" />
              Copilot Performance
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
                  <span>Diagnostic Audit Accuracy</span>
                  <span className="text-foreground">98.4%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '98.4%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
                  <span>SMS Automation Engagement</span>
                  <span className="text-foreground">76.2%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-info rounded-full" style={{ width: '76.2%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
                  <span>Staff Workload Efficiency</span>
                  <span className="text-foreground">89.0%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-warning rounded-full" style={{ width: '89%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 p-5 rounded-xl shadow-sm text-xs font-semibold text-muted-foreground leading-relaxed flex items-start gap-3 dark:from-primary/20 dark:to-indigo-500/10">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 fill-primary/10" />
            <div>
              AI Suggestions are dynamically updated by analyzing clinic-switching selections, patient record charts, and appointment calendars. Act on alerts to optimize operations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AIPage;
