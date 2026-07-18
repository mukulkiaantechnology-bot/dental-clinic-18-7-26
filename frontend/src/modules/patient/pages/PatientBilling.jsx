import { useState, useMemo } from 'react';
import { CreditCard, Download, DollarSign, CheckCircle2, AlertCircle, ShieldCheck, X } from 'lucide-react';
import { usePatientStore } from '../../../store/patientStore';
import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';
import { parseInvoiceItems } from '../../../shared/utils/billingUtils';
import jsPDF from 'jspdf';

export function PatientBilling() {
  const { invoices, payInvoice } = usePatientStore();
  const toast = useToast();

  const [selectedInvoice, setSelectedInvoice] = useState(null); // Invoice detail modal
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [isPaying, setIsPaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(null); // ID of downloading invoice

  // Compute stats
  const billingStats = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalInsurance = 0;

    invoices.forEach((inv) => {
      totalBilled += inv.amount;
      totalPaid += inv.patientPaid;
      totalInsurance += inv.insurancePaid;
    });

    const outstanding = totalBilled - totalPaid - totalInsurance;
    return {
      totalBilled,
      totalPaid,
      totalInsurance,
      outstanding: outstanding > 0 ? outstanding : 0
    };
  }, [invoices]);

  const handleOpenInvoice = (inv) => {
    setSelectedInvoice(inv);
    const outstanding = inv.amount - inv.patientPaid - inv.insurancePaid;
    setPayAmount(String(outstanding > 0 ? outstanding : 0));
  };

  const handleCloseInvoice = () => {
    setSelectedInvoice(null);
    setPayAmount('');
    setIsPaying(false);
  };

  const handleMakePayment = (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    
    const amount = Number(payAmount);
    const outstanding = selectedInvoice.amount - selectedInvoice.patientPaid - selectedInvoice.insurancePaid;

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive payment amount.');
      return;
    }

    if (amount > outstanding) {
      toast.error(`Payment amount exceeds outstanding balance of $${outstanding.toFixed(2)}.`);
      return;
    }

    setIsPaying(true);

    // Simulate payment gateway processing
    setTimeout(() => {
      payInvoice(selectedInvoice.id, amount);
      toast.success(
        `Successfully paid $${amount.toFixed(2)} for Invoice #${selectedInvoice.id} using ${paymentMethod}.`,
        'Payment Successful'
      );
      setIsPaying(false);
      handleCloseInvoice();
    }, 1500);
  };

  const handleDownloadPDF = (invId) => {
    setIsDownloading(invId);
    
    const invoice = invoices.find(i => i.id === invId);
    if (!invoice) {
      setIsDownloading(null);
      toast.error('Invoice not found.');
      return;
    }

    const outstanding = Math.max(0, invoice.amount - invoice.patientPaid - invoice.insurancePaid);

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        const clinicName = invoice.clinic?.name || 'METROPOLITAN DENTAL CLINIC';
        doc.text(clinicName.toUpperCase(), 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text(`INVOICE #${invoice.id}`, 20, 40);
        
        doc.setFontSize(11);
        doc.text(`Date: ${invoice.date}`, 20, 50);
        doc.text(`Due Date: ${invoice.dueDate}`, 20, 58);
        doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 66);
        
        doc.setLineWidth(0.5);
        doc.line(20, 72, 190, 72);
        
        doc.text('Billed Amount:', 20, 82);
        doc.text(`$${invoice.amount.toFixed(2)}`, 190, 82, { align: 'right' });
        
        doc.text('Patient Paid:', 20, 90);
        doc.text(`$${invoice.patientPaid.toFixed(2)}`, 190, 90, { align: 'right' });
        
        doc.text('Insurance Paid:', 20, 98);
        doc.text(`$${invoice.insurancePaid.toFixed(2)}`, 190, 98, { align: 'right' });
        
        doc.line(20, 104, 190, 104);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('BALANCE DUE:', 20, 114);
        doc.text(`$${outstanding.toFixed(2)}`, 190, 114, { align: 'right' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const thankYouName = invoice.clinic?.name || 'Metropolitan Dental';
        doc.text(`Thank you for choosing ${thankYouName}!`, 105, 140, { align: 'center' });

        doc.save(`Invoice_Receipt_#${invId}.pdf`);
        toast.success(`Invoice receipt #${invId} PDF downloaded successfully.`);
      } catch (err) {
        toast.error('Failed to generate PDF receipt.');
      } finally {
        setIsDownloading(null);
      }
    }, 600);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">
            Paid
          </span>
        );
      case 'Partial':
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-black uppercase tracking-wider">
            Partial
          </span>
        );
      case 'Overdue':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-black uppercase tracking-wider">
            Overdue
          </span>
        );
      case 'Unpaid':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider">
            Unpaid
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Billing & Payments</h2>
          <p className="text-[10px] text-muted-foreground font-semibold">
            Track treatments invoices, co-pay fees, insurance approvals, and balance dues.
          </p>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Total Billed Charges</span>
          <div className="mt-2 flex items-baseline gap-1">
            <h3 className="text-2xl font-black text-foreground">${billingStats.totalBilled.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Paid by You</span>
          <div className="mt-2 flex items-baseline gap-1">
            <h3 className="text-2xl font-black text-emerald-500">${billingStats.totalPaid.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-indigo-500">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Paid by Insurance</span>
          <div className="mt-2 flex items-baseline gap-1">
            <h3 className="text-2xl font-black text-indigo-500">${billingStats.totalInsurance.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-amber-500">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Outstanding Balance</span>
          <div className="mt-2 flex items-baseline gap-1">
            <h3 className="text-2xl font-black text-amber-500">${billingStats.outstanding.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
            <CreditCard className="h-4.5 w-4.5 text-primary" />
            Your Treatment Invoices
          </h3>
        </div>

        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[9px] uppercase text-muted-foreground font-bold tracking-wider">
                  <th className="p-4">Invoice ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Total Amount</th>
                  <th className="p-4 text-right">Patient Paid</th>
                  <th className="p-4 text-right">Insurance Paid</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {invoices.map((inv) => {
                  return (
                    <tr key={inv.id} className="hover:bg-muted/10">
                      <td className="p-4 font-extrabold text-foreground">#{inv.id}</td>
                      <td className="p-4 text-muted-foreground">{inv.date}</td>
                      <td className="p-4 text-muted-foreground">{inv.dueDate}</td>
                      <td className="p-4 text-right font-bold text-foreground">${inv.amount.toFixed(2)}</td>
                      <td className="p-4 text-right text-emerald-500">${inv.patientPaid.toFixed(2)}</td>
                      <td className="p-4 text-right text-indigo-500">${inv.insurancePaid.toFixed(2)}</td>
                      <td className="p-4">{getStatusBadge(inv.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenInvoice(inv)}
                            className="text-xs font-bold text-primary hover:bg-secondary cursor-pointer"
                          >
                            Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isDownloading === inv.id}
                            onClick={() => handleDownloadPDF(inv.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Download Invoice PDF"
                          >
                            <Download className={`h-4 w-4 ${isDownloading === inv.id ? 'animate-bounce' : ''}`} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border/60 rounded-2xl text-center m-5 bg-muted/10">
            <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3 stroke-1" />
            <h4 className="text-sm font-bold text-foreground">No invoices generated yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Your clinic billing ledger is currently empty.
            </p>
          </div>
        )}
      </div>

      {/* Invoice Detail & Payment Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <div>
                <h3 className="font-extrabold text-sm text-foreground">Invoice #{selectedInvoice.id} Details</h3>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  Date: {selectedInvoice.date} · Clinic: {selectedInvoice.clinic?.name || 'Metropolitan Dental'}
                </p>
              </div>
              <button
                onClick={handleCloseInvoice}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar text-xs font-semibold">
              {/* Items Table */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
                  Billed Procedures & Items
                </span>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-muted/40 border-b border-border text-[9px] uppercase text-muted-foreground font-bold">
                      <tr>
                        <th className="p-3">Procedure Description</th>
                        <th className="p-3 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {parseInvoiceItems(selectedInvoice.items).map((item, index) => (
                        <tr key={index}>
                          <td className="p-3 text-foreground">{item.description}</td>
                          <td className="p-3 text-right text-foreground">${item.cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">${selectedInvoice.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-indigo-500">
                  <span>Insurance Covered</span>
                  <span>-${selectedInvoice.insurancePaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-500">
                  <span>Patient Paid</span>
                  <span>-${selectedInvoice.patientPaid.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border/80 my-1" />
                <div className="flex justify-between text-sm font-black">
                  <span className="text-foreground">Total Balance Due</span>
                  <span className="text-amber-500">
                    ${(selectedInvoice.amount - selectedInvoice.patientPaid - selectedInvoice.insurancePaid).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Form (if outstanding balance exists) */}
              {selectedInvoice.amount - selectedInvoice.patientPaid - selectedInvoice.insurancePaid > 0 ? (
                <form onSubmit={handleMakePayment} className="border-t border-border/60 pt-4 space-y-4">
                  <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    Submit Co-Pay Payment
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                        Amount to Pay ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        max={selectedInvoice.amount - selectedInvoice.patientPaid - selectedInvoice.insurancePaid}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        required
                        className="w-full bg-background border border-border rounded-xl p-3 focus:outline-hidden focus:border-primary text-foreground text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-3 focus:outline-hidden focus:border-primary text-foreground text-xs"
                      >
                        <option value="Card">Credit/Debit Card</option>
                        <option value="ApplePay">Apple Pay</option>
                        <option value="GooglePay">Google Pay</option>
                        <option value="Bank">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 p-3 rounded-xl flex gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-normal font-medium">
                      Secure Stripe transaction. All patient transactions are fully encrypted and synced with the clinic's billing module in real-time.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleCloseInvoice}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPaying}
                      className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold"
                    >
                      {isPaying ? 'Processing...' : `Pay $${Number(payAmount || 0).toFixed(2)}`}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 p-4 rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-bold">This invoice is fully settled. No payment is required.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientBilling;
