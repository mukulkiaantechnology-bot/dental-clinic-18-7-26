import { useState } from 'react';
import { Play, Check, ChevronRight, UserPlus, Calendar, Image, FileText, Coins, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Button } from './Button';

export function DemoFlowButton() {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      role: 'Front Desk Receptionist',
      title: '1. Patient Registration',
      desc: 'Front Desk registers new walk-in patient "James Carter", configures contacts, and logs a critical Penicillin Allergy constraint in the EHR registry.',
      icon: UserPlus,
      color: 'bg-teal-500/10 text-teal-500 border-teal-500/20'
    },
    {
      role: 'Front Desk Scheduler',
      title: '2. Appointment Booking',
      desc: 'Scheduler matches patient "James Carter" to Dentist Dr. Michael Chen for a "Teeth Cleaning & Composite Filling" procedure, reserving a 9:00 AM slot.',
      icon: Calendar,
      color: 'bg-primary/10 text-primary border-primary/20'
    },
    {
      role: 'Dental Assistant',
      title: '3. Radiograph X-Ray Upload',
      desc: 'Assistant captures distal bitewings and uploads them. The AI Diagnostics sweeps the radiograph, highlighting a 96.8% confidence caries decay on Tooth #14.',
      icon: Image,
      color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
    },
    {
      role: 'Dentist (DDS / DMD)',
      title: '4. Charting & Prescribing',
      desc: 'Dr. Chen audits tooth chart, proposes composite filling on #14. The Drug Safety Screen intercepts a Penicillin contraindication, switching prescription safely to Clindamycin 300mg.',
      icon: FileText,
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    },
    {
      role: 'Billing Coordinator',
      title: '5. Invoice Ledger & Payment',
      desc: 'Billing hub generates Invoice #inv-101 ($150.00). Co-pay ledger checks MetLife insurance benefits. Patient completes simulated Stripe payment, syncing records to Patient Portal.',
      icon: Coins,
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    }
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
      toast.info(`Next Stage: ${steps[activeStep + 1].role} Action Flowing`);
    } else {
      setIsOpen(false);
      setActiveStep(0);
      toast.success('Patient journey simulation completed! Full clinic databases synced.', 'Demo Run Complete');
    }
  };

  const _startDemo = () => {
    setIsOpen(true);
    setActiveStep(0);
    toast.info('Starting step-by-step patient journey demonstration.');
  };

  return (
    <>
      {/* Central Demo Trigger Button */}
      {/* <Button
        onClick={startDemo}
        className="font-bold text-xs gap-1.5 h-10 bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all select-none shadow-md cursor-pointer justify-center px-4"
      >
        <Play className="h-4 w-4 fill-white text-white" />
        Run Full Patient Journey
      </Button> */}

      {/* Stepper modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div
            className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border/80 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-1.5">
                  <Play className="h-4.5 w-4.5 text-primary fill-primary/20 animate-pulse" />
                  SaaS Interactive Patient Stepper Tour
                </h3>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  Walk through the interconnected multi-clinic workflow simulation.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Stepper Horizontal Progress Nodes */}
            <div className="px-6 py-4 bg-muted/30 border-b border-border/40 flex justify-between select-none overflow-x-auto no-scrollbar gap-2">
              {steps.map((step, idx) => {
                const isPassed = idx < activeStep;
                const isActive = idx === activeStep;
                return (
                  <div key={idx} className="flex items-center gap-1 flex-shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${isActive
                          ? 'bg-primary border-primary text-primary-foreground scale-105 font-black'
                          : isPassed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-card border-border text-muted-foreground'
                        }`}
                    >
                      {isPassed ? <Check className="h-3 w-3" /> : idx + 1}
                    </div>
                    {idx < steps.length - 1 && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 hidden sm:block" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="p-6 space-y-5 flex-1 min-h-[160px]">
              {/* Active Step Panel */}
              <div className="space-y-4">
                {/* Active Role tag */}
                <span className={`text-[9px] font-black uppercase border px-2.5 py-0.8 rounded-full ${steps[activeStep].color}`}>
                  Workspace Role: {steps[activeStep].role}
                </span>

                <div className="space-y-2">
                  <h4 className="text-sm font-black text-foreground">{steps[activeStep].title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                    {steps[activeStep].desc}
                  </p>
                </div>

                {/* Animated graphic representation */}
                <div className="p-4 bg-muted/40 rounded-xl border border-border/80 flex items-center gap-3">
                  {(() => {
                    const IconComp = steps[activeStep].icon;
                    return (
                      <div className={`p-3 rounded-xl ${steps[activeStep].color} shrink-0`}>
                        <IconComp className="h-6 w-6" />
                      </div>
                    );
                  })()}
                  <div className="text-[10px] font-bold text-muted-foreground/80 leading-normal">
                    <span className="text-foreground uppercase block text-[8px] tracking-wider mb-0.5">Simulated Output</span>
                    Live ledger writes committed. Linked patient dashboard state synced to clinical database schema.
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-5 bg-muted/30 border-t border-border/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Stage {activeStep + 1} of {steps.length}
              </span>
              <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="font-bold text-xs h-10 border-border hover:bg-muted cursor-pointer flex-1 sm:flex-none justify-center px-4"
                >
                  Skip Tour
                </Button>
                <Button
                  onClick={handleNext}
                  className="font-bold text-xs h-10 bg-primary hover:bg-primary/95 cursor-pointer flex-1 sm:flex-none justify-center px-5"
                >
                  {activeStep === steps.length - 1 ? 'Finish Simulation' : 'Next Step'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DemoFlowButton;
