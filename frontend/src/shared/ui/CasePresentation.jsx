import { useState, useMemo, useRef, useEffect } from 'react';
import { Sparkles, Signature } from 'lucide-react';
import { useDentistStore } from '../../store/dentistStore';
import { useToast } from '../hooks/useToast';
import { Button } from './Button';
import { Badge } from './Badge';

// Helper to resize image to max 1200px width/height and compress to JPEG
const resizeImage = (file, maxWidth, maxHeight) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
};

export function CasePresentation({ patientId }) {
  const { 
    treatmentPlans, 
    updateProcedureStatus, 
    beforeImages, 
    afterImages, 
    uploadBeforeImage, 
    uploadAfterImage, 
    fetchPatientDetails,
    signatures,
    savePatientSignature
  } = useDentistStore();
  const toast = useToast();

  useEffect(() => {
    if (patientId && fetchPatientDetails) {
      fetchPatientDetails(patientId);
    }
  }, [patientId, fetchPatientDetails]);

  const signatureUrl = (signatures && signatures[patientId]) || '';

  const proposedPlans = useMemo(() => {
    const plans = treatmentPlans[patientId] || [];
    return plans.filter(p => p.status === 'Proposed');
  }, [treatmentPlans, patientId]);

  const acceptedPlans = useMemo(() => {
    const plans = treatmentPlans[patientId] || [];
    return plans.filter(p => p.status === 'Accepted');
  }, [treatmentPlans, patientId]);

  // Selected procedures for presentation
  const [selectedIds, setSelectedIds] = useState([]);

  // Local image previews for instant UI update
  const [localBefore, setLocalBefore] = useState(null);
  const [localAfter, setLocalAfter] = useState(null);

  // Before/after image mocks or uploads
  const beforeImage = localBefore || (beforeImages && beforeImages[patientId]) || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500';
  const afterImage = localAfter || (afterImages && afterImages[patientId]) || 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=500';

  // Financing options
  const [financingMonths, setFinancingMonths] = useState(12); // 6, 12, 24

  // Digital Signature states
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const canvasRef = useRef(null);


  // Load patient signature on canvas when component mounts or signature updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);

    if (signatureUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIsSigned(true);
      };
      img.src = signatureUrl;
    }
  }, [signatureUrl, canvasRef]);

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === proposedPlans.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(proposedPlans.map(p => p.id));
    }
  };

  // Calculations
  const calculations = useMemo(() => {
    const selectedPlans = proposedPlans.filter(p => selectedIds.includes(p.id));
    const totalFee = selectedPlans.reduce((sum, p) => sum + (p.cost || 0), 0);
    const insuranceCoverage = totalFee * 0.8; // Estimate 80% coverage
    const patientPortion = totalFee - insuranceCoverage;
    const monthlyPayment = patientPortion / financingMonths;

    return {
      totalFee,
      insuranceCoverage,
      patientPortion,
      monthlyPayment
    };
  }, [proposedPlans, selectedIds, financingMonths]);

  const handleBeforeUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await resizeImage(file, 1200, 1200);
        setLocalBefore(compressedBase64);
        toast.info('Uploading before makeover image...');
        await uploadBeforeImage(patientId, compressedBase64);
        toast.success('Before makeover image updated successfully!');
      } catch (_) {
        toast.error('Failed to upload image.');
        setLocalBefore(null);
      }
    }
  };

  const handleAfterUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await resizeImage(file, 1200, 1200);
        setLocalAfter(compressedBase64);
        toast.info('Uploading after makeover image...');
        await uploadAfterImage(patientId, compressedBase64);
        toast.success('After makeover image updated successfully!');
      } catch (_) {
        toast.error('Failed to upload image.');
        setLocalAfter(null);
      }
    }
  };

  // Canvas drawing
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setIsSigned(true);
  };

  const clearCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
    await savePatientSignature(patientId, '');
  };

  // Submit Acceptance
  const handleAcceptPresentation = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one procedure to accept.');
      return;
    }
    if (!isSigned) {
      toast.error('Patient signature is required to accept treatment plan.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureDataUrl = canvas.toDataURL();

    toast.info('Saving signatures and accepting treatment plans...');
    
    // Save signature to DB
    await savePatientSignature(patientId, signatureDataUrl);

    // Update status in store for all selected procedures
    for (const id of selectedIds) {
      await updateProcedureStatus(patientId, id, 'Accepted');
    }

    toast.success('Treatment plans accepted successfully! Signed contract archived.');
    setSelectedIds([]);
  };

  if (!patientId) return null;

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Title */}
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-foreground uppercase tracking-wider">Case Presentation & Financing Options</h3>
        <p className="text-xs text-muted-foreground font-semibold">
          Review cosmetic restorations, calculate dental insurance coverage splits, configure extended monthly payment terms, and capture signed acceptances.
        </p>
      </div>

      {/* Grid: Smile Makeover Images (Before/After) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 border border-border p-5 rounded-2xl">
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Before Makeover (Initial Scan)</span>
          <div className="relative h-60 bg-black rounded-xl overflow-hidden group shadow-inner">
            <img src={beforeImage} alt="Before treatment" className="w-full h-full object-cover" />
            <label className="absolute bottom-3 left-3 bg-black/60 hover:bg-black text-[10px] text-white font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-all border border-white/10">
              Upload Before Pic
              <input type="file" accept="image/*" onChange={handleBeforeUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary fill-primary/10" />
            After Makeover (Proposed Restoration Mock)
          </span>
          <div className="relative h-60 bg-black rounded-xl overflow-hidden group shadow-inner">
            <img src={afterImage} alt="After treatment" className="w-full h-full object-cover" />
            <label className="absolute bottom-3 left-3 bg-black/60 hover:bg-black text-[10px] text-white font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-all border border-white/10">
              Upload After Pic
              <input type="file" accept="image/*" onChange={handleAfterUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Split layout: Proposed Procedures Checkbox list (Left) + Billing Summary & Signatures (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Procedures Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider">Proposed Treatment Selection</h4>
            {proposedPlans.length > 0 && (
              <Button size="xs" variant="outline" onClick={handleSelectAll} className="text-[9px] font-black h-7">
                {selectedIds.length === proposedPlans.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>

          {proposedPlans.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-muted-foreground bg-muted/15 border border-dashed border-border rounded-xl">
              No proposed treatments found. Add clinical items in the Treatment Plan tab.
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {proposedPlans.map((plan) => {
                const isSelected = selectedIds.includes(plan.id);
                return (
                  <div 
                    key={plan.id}
                    onClick={() => handleToggleSelect(plan.id)}
                    className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                      isSelected 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'bg-card border-border hover:bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-primary border-primary text-white' : 'border-border'
                      }`}>
                        {isSelected && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-foreground">{plan.procedure}</h5>
                        <span className="text-[10px] text-muted-foreground font-semibold">Tooth Position: #{plan.tooth}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-xs text-foreground">${plan.cost}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Cost Splits, Financing Plans, and Acceptance */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4 text-xs font-semibold">
          <h4 className="font-black text-sm uppercase text-primary border-b border-border pb-2">Financial Breakdown</h4>

          {/* Pricing splits */}
          <div className="space-y-2 border-b border-border pb-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal Fees:</span>
              <span className="font-bold text-foreground">${calculations.totalFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Ins. Portion (80%):</span>
              <span className="font-bold text-emerald-500">-${calculations.insuranceCoverage.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border/60 pt-1.5">
              <span className="font-extrabold text-foreground">Patient Copay Portion:</span>
              <span className="font-black text-sm text-foreground">${calculations.patientPortion.toFixed(2)}</span>
            </div>
          </div>

          {/* Financing Installments Configuration */}
          <div className="space-y-3 border-b border-border pb-3">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">CareCredit & Extended Financing Term</label>
            <div className="flex gap-2">
              {[6, 12, 24].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setFinancingMonths(term)}
                  className={`flex-1 py-1.5 border rounded-lg text-center font-bold text-[10px] cursor-pointer transition-all ${
                    financingMonths === term
                      ? 'bg-primary text-white border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
                >
                  {term} Mos {term === 24 ? '' : 'No Int.'}
                </button>
              ))}
            </div>

            <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase block font-bold">Est. Monthly Copay</span>
                <span className="text-primary text-sm font-black">${calculations.monthlyPayment.toFixed(2)} / mo</span>
              </div>
              <Badge variant="success" className="text-[8px] font-black uppercase">CareCredit Approved</Badge>
            </div>
          </div>

          {/* Signature Canvas */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block flex items-center justify-between">
              <span>Patient Digital Consent Signature</span>
              {isSigned && (
                <button type="button" onClick={clearCanvas} className="text-[9px] text-rose-500 font-bold hover:underline cursor-pointer">
                  Clear
                </button>
              )}
            </label>
            <div className="border border-border rounded-xl bg-muted/40 overflow-hidden h-32 relative">
              <canvas
                ref={canvasRef}
                width={300}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair touch-none"
              />
              {!isSigned && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/60 text-[10px] font-bold gap-1 bg-white/5 backdrop-blur-xs select-none">
                  <Signature className="h-4 w-4" /> Sign name here to accept
                </div>
              )}
            </div>
          </div>

          {/* Acceptance Action */}
          <Button
            onClick={handleAcceptPresentation}
            disabled={selectedIds.length === 0 || !isSigned}
            className="w-full h-10 select-none uppercase font-black tracking-wide text-xs"
          >
            Accept & Sign Treatment Plan
          </Button>
        </div>
      </div>

      {/* Signed Treatment Agreements Archive */}
      {acceptedPlans.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <h4 className="font-extrabold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
            <Signature className="h-4.5 w-4.5 text-primary" />
            Signed Treatment Agreements Archive
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-bold uppercase text-[9px] text-muted-foreground select-none">
                  <th className="p-3">Tooth</th>
                  <th className="p-3">Procedure Details</th>
                  <th className="p-3 text-right">Insurance Split</th>
                  <th className="p-3 text-right font-black">Copay Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-semibold">
                {acceptedPlans.map((plan) => {
                  const insSplit = (plan.cost || 0) * 0.8;
                  const copayCost = (plan.cost || 0) - insSplit;

                  // Parse option and phase prefixes
                  const optionMatch = (plan.procedure || '').match(/^\[(Option [A-C])\]/);
                  const phaseMatch = (plan.procedure || '').match(/\[(Phase [1-3]:?[^\]]*)\]/);
                  const optionStr = optionMatch ? optionMatch[1] : '';
                  const phaseStr = phaseMatch ? phaseMatch[1] : '';
                  const cleanName = (plan.procedure || '')
                    .replace(/^\[Option [A-C]\]\s*/, '')
                    .replace(/^\[Phase [1-3]:?[^\]]*\]\s*/, '');

                  return (
                    <tr key={plan.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3 text-primary font-black">
                        {plan.tooth ? `Tooth ${plan.tooth}` : 'General'}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1 text-left">
                          <span className="text-foreground">{cleanName}</span>
                          <div className="flex gap-1.5 flex-wrap items-center mt-0.5 text-[8.5px] font-black uppercase">
                            {optionStr && (
                              <span className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                                {optionStr}
                              </span>
                            )}
                            {phaseStr && (
                              <span className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                                {phaseStr}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right text-emerald-500 font-bold">
                        ${insSplit.toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-foreground font-extrabold">
                        ${copayCost.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {signatureUrl && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4 gap-4">
              <div className="text-[10px] text-muted-foreground font-semibold">
                This treatment plan was legally accepted and digitally signed by the patient.
              </div>
              <div className="flex flex-col items-center font-semibold">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">Patient Signature Archive</span>
                <div className="border border-border rounded-lg bg-muted/40 px-4 py-2 flex items-center justify-center h-16 w-48 overflow-hidden">
                  <img
                    src={signatureUrl}
                    alt="Archived Consent Signature"
                    className="max-h-full max-w-full object-contain filter dark:invert"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default CasePresentation;
