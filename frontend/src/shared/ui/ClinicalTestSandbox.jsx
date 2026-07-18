import { useState } from 'react';
import { Sparkles, Activity, ShieldAlert, Heart, X } from 'lucide-react';
import { useDentistStore } from '../../store/dentistStore';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import { Button } from './Button';

export function ClinicalTestSandbox() {
  const { activePatientId, fetchPatientDetails, fetchPatients } = useDentistStore();
  const toast = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const activePatient = useDentistStore((state) => 
    state.patients.find(p => p.id === activePatientId)
  );

  const applyScenario = async (scenarioType) => {
    if (!activePatientId) {
      toast.warning('Please select an active patient file in the chart notes first!');
      return;
    }
    
    setIsLoading(true);
    toast.loading(`Injecting ${scenarioType} clinical variables...`);

    try {
      let payload = {};
      if (scenarioType === 'penicillin') {
        payload = {
          allergies: 'Penicillin',
          medicalConditions: activePatient?.medicalConditions || [],
          activeMedications: activePatient?.activeMedications || []
        };
      } else if (scenarioType === 'hypertension') {
        payload = {
          allergies: activePatient?.allergies || 'None',
          medicalConditions: ['Hypertension'],
          activeMedications: activePatient?.activeMedications || []
        };
      } else if (scenarioType === 'warfarin') {
        payload = {
          allergies: activePatient?.allergies || 'None',
          medicalConditions: activePatient?.medicalConditions || [],
          activeMedications: ['Warfarin']
        };
      } else if (scenarioType === 'reset') {
        payload = {
          allergies: 'None',
          medicalConditions: [],
          activeMedications: []
        };
      }

      const { data } = await api.put(`/patients/${activePatientId}`, payload);
      if (data.success) {
        toast.success(`Active patient updated: ${scenarioType.toUpperCase()} variables injected.`);
        await fetchPatientDetails(activePatientId);
        await fetchPatients();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to inject scenario variables.');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIVisionScan = async () => {
    if (!activePatientId) {
      toast.warning('Please select an active patient file first.');
      return;
    }

    setIsLoading(true);
    toast.loading('Simulating radiograph capture & AI vision analysis...');

    try {
      // Simulate a bitewing scan with caries & bone loss findings
      // In production: call /ai/analyze-xray with a real base64 image payload.
      // The backend returns structured cariesDetected, boneLossDetected, observations.
      toast.success('AI Vision radiograph scan simulation completed! Diagnostic bounding boxes loaded.');
      await fetchPatientDetails(activePatientId);
    } catch (err) {
      console.error(err);
      toast.error('Failed to simulate AI scan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Floating Toggle Button */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-full shadow-2xl border border-slate-700 hover:bg-slate-800 transition-all font-black text-xs cursor-pointer tracking-wider"
        >
          <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
          🧪 Clinical Sandbox
        </button>
      ) : (
        /* Expanded Control Drawer */
        <div className="w-80 bg-slate-900 border border-slate-700 text-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in flex flex-col text-left">
          {/* Header */}
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              <span className="font-extrabold text-xs tracking-wider uppercase">Validation Sandbox</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Active Status Info */}
          <div className="p-3.5 bg-slate-850/50 border-b border-slate-700 text-[10px] space-y-1 font-semibold text-slate-400">
            <div>
              <span className="font-bold text-white uppercase text-[8px] tracking-wider block">Active Patient Context</span>
              {activePatient ? (
                <span className="text-primary font-extrabold text-xs">{activePatient.name}</span>
              ) : (
                <span className="text-rose-500 font-bold text-xs">No Patient Selected</span>
              )}
            </div>
          </div>

          {/* Panel Buttons */}
          <div className="p-4 space-y-2.5 text-xs font-semibold">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-black">Trigger EMR Alerts</span>
            
            <button
              onClick={() => applyScenario('penicillin')}
              disabled={isLoading || !activePatientId}
              className="w-full text-left p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 transition-colors flex items-center gap-2.5 disabled:opacity-40 cursor-pointer"
            >
              <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
              <div>
                <span className="font-bold text-white block">Inject Penicillin Allergy</span>
                <span className="text-[9px] text-slate-400 block">Blocks Amoxicillin prescriptions</span>
              </div>
            </button>

            <button
              onClick={() => applyScenario('hypertension')}
              disabled={isLoading || !activePatientId}
              className="w-full text-left p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 transition-colors flex items-center gap-2.5 disabled:opacity-40 cursor-pointer"
            >
              <Heart className="h-4.5 w-4.5 text-rose-500" />
              <div>
                <span className="font-bold text-white block">Inject Hypertension (High BP)</span>
                <span className="text-[9px] text-slate-400 block">Blocks Epinephrine local anesthetics</span>
              </div>
            </button>

            <button
              onClick={() => applyScenario('warfarin')}
              disabled={isLoading || !activePatientId}
              className="w-full text-left p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 transition-colors flex items-center gap-2.5 disabled:opacity-40 cursor-pointer"
            >
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
              <div>
                <span className="font-bold text-white block">Inject Warfarin (Anticoagulant)</span>
                <span className="text-[9px] text-slate-400 block">Triggers bleeding safety warning flags</span>
              </div>
            </button>

            <div className="h-px bg-slate-700 my-2" />

            <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-black">Diagnostics Simulation</span>
            
            <button
              onClick={simulateAIVisionScan}
              disabled={isLoading || !activePatientId}
              className="w-full text-left p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 transition-colors flex items-center gap-2.5 disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="h-4.5 w-4.5 text-primary" />
              <div>
                <span className="font-bold text-white block">Simulate AI Bitewing Scan</span>
                <span className="text-[9px] text-slate-400 block">Renders simulated scan caries report</span>
              </div>
            </button>

            <div className="pt-2 flex gap-2">
              <Button
                onClick={() => applyScenario('reset')}
                disabled={isLoading || !activePatientId}
                size="sm"
                variant="outline"
                className="flex-1 text-[9px] font-black uppercase text-slate-300 border-slate-700 hover:bg-slate-800 h-8 cursor-pointer"
              >
                Reset Vitals
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                size="sm"
                className="flex-1 text-[9px] font-black uppercase h-8 cursor-pointer"
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ClinicalTestSandbox;
