import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Check,
  Zap,
  Calendar,
  Users,
  UserCheck2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useSubscriptionStore } from '../../../store/subscriptionStore';
import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';
import { Badge } from '../../../shared/ui/Badge';

export function BillingDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  
  const {
    subscription,
    invoices,
    usage,
    loading,
    error,
    fetchSubscriptionDetails,
    upgradePlan,
    triggerMockWebhook
  } = useSubscriptionStore();

  useEffect(() => {
    fetchSubscriptionDetails();
  }, [fetchSubscriptionDetails]);

  // Handle mock checkout redirection trigger from URL params
  useEffect(() => {
    const isMock = searchParams.get('mock_checkout');
    const clinicId = searchParams.get('clinicId');
    const planId = searchParams.get('planId');
    const amount = searchParams.get('amount');

    if (isMock && clinicId && planId) {
      toast.info('Simulating local sandbox Stripe checkout completed...');
      triggerMockWebhook(clinicId, planId, amount).then(() => {
        toast.success('Subscription activated successfully via simulated Stripe Webhook!');
        setSearchParams({}); // Clear query params
      });
    }

    const paymentResult = searchParams.get('payment');
    if (paymentResult === 'success') {
      toast.success('Your subscription update is processing. Refreshing details...');
      fetchSubscriptionDetails();
      setSearchParams({});
    } else if (paymentResult === 'cancel') {
      toast.warning('Checkout session cancelled. No changes made.');
      setSearchParams({});
    }
  }, [searchParams, triggerMockWebhook, fetchSubscriptionDetails, toast, setSearchParams]);

  const handlePlanSelect = async (planId) => {
    toast.loading('Redirecting to Stripe payment portal...');
    await upgradePlan(planId);
  };

  const getPlanDetails = (planName) => {
    const name = (planName || '').toLowerCase();
    if (name.includes('enterprise')) {
      return { label: 'Enterprise Plan', price: '$499/mo', desc: 'Unlimited scalability and full AI features' };
    }
    if (name.includes('pro') || name.includes('premium')) {
      return { label: 'Pro Plan', price: '$299/mo', desc: 'Extended staff capacity and clinical charting' };
    }
    return { label: 'Basic Plan', price: '$99/mo', desc: 'Perfect for single-doctor clinics starting out' };
  };

  const activePlan = subscription?.plan;
  const currentPlanName = activePlan?.name || 'No Active Plan';
  const planDetails = getPlanDetails(currentPlanName);

  const backendPlans = useSubscriptionStore((state) => state.plans) || [];

  const fallbackPlansList = [
    {
      id: 'plan-basic',
      name: 'Basic Plan',
      price: '$99',
      usersLimit: 'Up to 5 Users',
      patientsLimit: 'Up to 50 Patients',
      features: ['Core HMS Appointment Engine', 'Patient Records Registry', 'Basic Billing Analytics'],
      badge: 'Starter',
      color: 'border-slate-200 dark:border-slate-800'
    },
    {
      id: 'plan-pro',
      name: 'Pro Plan',
      price: '$299',
      usersLimit: 'Up to 15 Users',
      patientsLimit: 'Up to 500 Patients',
      features: ['Core HMS & Clinical Charting', 'Extended Reports Split', 'Integrated AI Copilot Widget', 'Up to 15 Clinic Staff Users'],
      badge: 'Popular',
      color: 'border-primary shadow-lg ring-2 ring-primary/20 scale-105 z-10'
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise Plan',
      price: '$499',
      usersLimit: 'Unlimited Users',
      patientsLimit: 'Unlimited Patients',
      features: ['Core HMS & Full Clinical Suite', 'AI Recall & Marketing Campaigns', 'AI DiagnosticsDICOM Scanning', 'Unlimited Users & Patients', 'Priority Support SLA'],
      badge: 'Enterprise',
      color: 'border-indigo-500/30 shadow-indigo-500/10'
    }
  ];

  const plansList = backendPlans.length > 0 ? backendPlans.map(plan => {
    const nameLower = (plan.name || '').toLowerCase();
    const isPro = nameLower.includes('pro') || nameLower.includes('premium');
    const isEnterprise = nameLower.includes('enterprise');
    
    let parsedFeatures = [];
    if (typeof plan.features === 'string') {
      try {
        parsedFeatures = JSON.parse(plan.features);
      } catch (_e) {
        parsedFeatures = plan.features.split(',').map(f => f.trim());
      }
    } else if (Array.isArray(plan.features)) {
      parsedFeatures = plan.features;
    }
    
    return {
      id: plan.id || `plan-${nameLower}`,
      name: plan.name || 'Unnamed Plan',
      price: `$${plan.price || 0}`,
      usersLimit: plan.maxUsers === 9999 ? 'Unlimited Users' : `Up to ${plan.maxUsers} Users`,
      patientsLimit: plan.maxPatients === 99999 ? 'Unlimited Patients' : `Up to ${plan.maxPatients} Patients`,
      features: parsedFeatures.length > 0 ? parsedFeatures : ['Core features included'],
      badge: isEnterprise ? 'Enterprise' : isPro ? 'Popular' : 'Starter',
      color: isEnterprise 
        ? 'border-indigo-500/30 shadow-indigo-500/10' 
        : isPro 
        ? 'border-primary shadow-lg ring-2 ring-primary/20 scale-105 z-10' 
        : 'border-slate-200 dark:border-slate-800'
    };
  }) : fallbackPlansList;

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      {/* Page Header */}
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight">SaaS Subscription & Billing</h2>
            <p className="text-[10px] text-muted-foreground font-semibold">Manage your platform plan, subscription limits, and payment invoices.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-rose-500">{error}</p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Current Plan & Limits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Subscription Card */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[200px]">
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full filter blur-xl -mr-10 -mt-10" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                  Subscription Status: {subscription?.status || 'Inactive'}
                </span>
                <span className="text-xs font-extrabold text-foreground">{planDetails.price}</span>
              </div>
              <h3 className="text-xl font-black text-foreground mt-3 flex items-center gap-2">
                {planDetails.label}
                {subscription?.status === 'active' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </h3>
              <p className="text-xs text-muted-foreground font-semibold mt-1">{planDetails.desc}</p>
            </div>

            <div className="border-t border-border/60 pt-4 mt-6 flex flex-col sm:flex-row justify-between gap-4 text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Next Invoice Renewal Date: {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                Stripe Sub ID: <span className="font-mono text-foreground">{subscription?.stripeSubscriptionId || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Subscription Quotas and Usage Metrics */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-primary" />
              Plan Usage Metrics & Quotas
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Users usage limit */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-foreground flex items-center gap-1">
                    <Users className="h-4 w-4 text-slate-500" />
                    Users Registered
                  </span>
                  <span className="text-muted-foreground">
                    {usage.users} / {activePlan?.maxUsers === 9999 ? 'Unlimited' : activePlan?.maxUsers || 0}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, activePlan?.maxUsers ? (usage.users / activePlan.maxUsers) * 100 : 0)}%`
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold">Max users permitted inside clinic workspace.</p>
              </div>

              {/* Patients usage limit */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-foreground flex items-center gap-1">
                    <UserCheck2 className="h-4 w-4 text-slate-500" />
                    Patients Records
                  </span>
                  <span className="text-muted-foreground">
                    {usage.patients} / {activePlan?.maxPatients === 99999 ? 'Unlimited' : activePlan?.maxPatients || 0}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, activePlan?.maxPatients ? (usage.patients / activePlan.maxPatients) * 100 : 0)}%`
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold">Max clinical patient folders allowed.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Invoices list */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-primary" />
              SaaS Billing History
            </h3>
            
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                <CreditCard className="h-8 w-8 text-muted-foreground/50 stroke-1 mb-2" />
                <p className="text-xs font-bold">No invoices generated yet</p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5">Your invoicing history will appear here once billing executes.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center p-3 bg-muted/30 border border-border/40 rounded-xl hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-xs font-black text-foreground">{inv.plan} Plan</p>
                      <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">
                        Issued: {new Date(inv.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-foreground">${inv.amount.toFixed(2)}</span>
                      <div className="mt-1">
                        <Badge variant="success">Paid</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 mt-6 text-[10px] text-muted-foreground font-semibold">
            Subscription receipts and pricing details are dynamically verified by Stripe.
          </div>
        </div>
      </div>

      {/* Subscription Pricing Matrix */}
      <div className="space-y-5 pt-4">
        <div className="text-center sm:text-left">
          <h3 className="text-base font-black text-foreground tracking-tight">Available Subscription Plans</h3>
          <p className="text-xs text-muted-foreground font-semibold">Select and upgrade your multi-clinic system tier.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plansList.map((plan) => {
            const isCurrent = activePlan?.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`bg-card border p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-md ${plan.color}`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-extrabold text-muted-foreground">{plan.badge}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-black text-foreground mt-2">{plan.name}</h4>
                  <div className="flex items-baseline mt-4 mb-5">
                    <span className="text-3xl font-black text-foreground">{plan.price}</span>
                    <span className="text-xs font-bold text-muted-foreground ml-1">/ month</span>
                  </div>
                  
                  <div className="space-y-2.5 mb-6 text-xs text-foreground font-semibold">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold border-b border-border/50 pb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>{plan.usersLimit} · {plan.patientsLimit}</span>
                    </div>
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-left leading-relaxed">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={loading || isCurrent}
                  className={`w-full font-bold text-xs py-5 rounded-xl cursor-pointer ${
                    isCurrent 
                      ? 'bg-muted text-muted-foreground border border-border' 
                      : plan.id === 'plan-pro'
                      ? 'bg-primary hover:bg-primary/95 text-white shadow-sm'
                      : 'bg-secondary hover:bg-secondary/90 text-foreground border border-border'
                  }`}
                >
                  {isCurrent ? 'Active Plan' : 'Select Plan'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
