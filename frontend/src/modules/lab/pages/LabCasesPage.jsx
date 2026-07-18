import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Plus, Search, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLabStore } from '../../../store/labStore';
import { useDentistStore } from '../../../store/dentistStore';
import { useAppointmentStore } from '../../../store/appointmentStore';
import { Button } from '../../../shared/ui/Button';
import { Badge } from '../../../shared/ui/Badge';
import { Modal } from '../../../shared/ui/Modal';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { useToast } from '../../../shared/hooks/useToast';
import { AIInsightsPanel } from '../../../shared/ui/AIInsightsPanel';

export function LabCasesPage() {
  const navigate = useNavigate();
  const { labCases, activeCaseId, setActiveCaseId, createLabCase, updateCaseStatus, fetchLabCases } = useLabStore();
  const { patients, fetchPatients } = useDentistStore();
  const { appointments, fetchAppointments } = useAppointmentStore();
  const toast = useToast();

  useEffect(() => {
    fetchLabCases();
    fetchPatients();
    fetchAppointments();
  }, [fetchLabCases, fetchPatients, fetchAppointments]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Form State
  const [patientId, setPatientId] = useState('');
  const [dentistName, setDentistName] = useState('Dr. Michael Chen');
  const [caseType, setCaseType] = useState('');
  const [cost, setCost] = useState('250');
  const [notes, setNotes] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [labName, setLabName] = useState('Pacific Dental Lab');
  
  // Auto-populate dentist name from appointment when patient is selected
  useEffect(() => {
    if (patientId && appointments.length > 0) {
      const apt = appointments.find((a) => a.patientId === patientId);
      if (apt?.dentistName) {
        setDentName(apt.dentistName);
      }
    }
  }, [patientId, appointments]);

  const setDentName = (name) => {
    setDentistName(name);
  };
  
  // Simulated files list
  const [files, setFiles] = useState([]);
  const [newFileName, setNewFileName] = useState('');

  const handleAddFile = () => {
    if (newFileName.trim()) {
      setFiles([...files, newFileName.trim()]);
      setNewFileName('');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    const selectedPatient = patients.find((p) => p.id === patientId);
    const resolvedPatientName = selectedPatient ? selectedPatient.name : 'Unknown Patient';

    const newId = await createLabCase({
      patientId,
      patientName: resolvedPatientName,
      dentistName: dentistName || selectedPatient?.dentistName || selectedPatient?.assignedDoctorName || 'Not Assigned',
      type: caseType,
      cost: Number(cost) || 150,
      notes,
      expectedDelivery: expectedDelivery || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      labName,
      attachments: files
    });

    if (newId) {
      toast.success(`Lab case ${newId} successfully created for ${resolvedPatientName}!`);
    } else {
      toast.error('Failed to create lab case.');
    }
    setIsModalOpen(false);

    // Reset Form
    setPatientId('');
    setCaseType('');
    setCost('250');
    setNotes('');
    setExpectedDelivery('');
    setLabName('Pacific Dental Lab');
    setFiles([]);
  };

  const filteredCases = labCases.filter((c) => {
    const matchesSearch =
      c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.labName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'All' || c.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Created':
        return <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold text-[10px]">Created</Badge>;
      case 'Sent':
        return <Badge className="bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold text-[10px]">Sent to Lab</Badge>;
      case 'In Progress':
        return <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-[10px] animate-pulse">In Progress</Badge>;
      case 'Ready':
        return <Badge className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold text-[10px]">Ready (QC)</Badge>;
      case 'Delivered':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-[10px]">Delivered</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-16 md:pb-0">
      {/* Header section */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-foreground">
            <Folder className="h-6 w-6 text-primary" />
            Lab Case Records
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            Monitor prosthesis orders, update case status, and track external lab shipments.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="font-bold text-xs gap-1.5 h-10 px-4 rounded-xl cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Create Lab Case
        </Button>
      </div>

      {/* Filters & Search bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patient, ID, or external lab..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border bg-card rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        <div className="flex p-0.5 bg-muted rounded-xl border border-border w-full md:w-auto overflow-x-auto whitespace-nowrap scrollbar-thin">
          {['All', 'Crown', 'Implant', 'Denture', 'Bridge'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                typeFilter === type
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {type}s
            </button>
          ))}
        </div>
      </div>

      <AIInsightsPanel />

      {/* Grid / Table content */}
      {filteredCases.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-2xl text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3 stroke-1" />
          <h3 className="text-sm font-bold text-foreground">No lab cases found</h3>
          <p className="text-xs text-muted-foreground font-semibold mt-1">Try resetting filters or checking spelling.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table Layout */}
          <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider font-extrabold">
                  <th className="p-4">Case ID</th>
                  <th className="p-4">Patient Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Dentist</th>
                  <th className="p-4">Laboratory</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Expected Delivery</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setActiveCaseId(c.id)}
                    className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                      activeCaseId === c.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <td className="p-4 font-extrabold text-foreground">{c.id}</td>
                    <td className="p-4 text-foreground">{c.patientName}</td>
                    <td className="p-4 text-primary font-bold">{c.type}</td>
                    <td className="p-4 text-muted-foreground">{c.dentistName}</td>
                    <td className="p-4 text-foreground">{c.labName}</td>
                    <td className="p-4">{getStatusBadge(c.status)}</td>
                    <td className="p-4 text-muted-foreground flex items-center gap-1.5 mt-1 border-none">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      {c.expectedDelivery}
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setActiveCaseId(c.id);
                            toast.info(`Tracking case #${c.id}.`);
                            if (c.type === 'Implant') {
                              navigate('/lab/implant');
                            } else {
                              navigate('/lab/crown');
                            }
                          }}
                          className="font-extrabold text-[10px] h-7 cursor-pointer"
                        >
                          Track Case
                        </Button>
                        {c.status !== 'Delivered' && (
                          <Button
                            size="xs"
                            className="font-extrabold text-[10px] h-7 gap-1 cursor-pointer"
                            onClick={() => updateCaseStatus(c.id, 'Delivered')}
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveCaseId(c.id)}
                className={`bg-card border p-4 rounded-2xl space-y-3 shadow-sm hover:border-primary/30 transition-all ${
                  activeCaseId === c.id ? 'border-primary ring-1 ring-primary/20' : 'border-border'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">{c.patientName}</h3>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      ID: {c.id} · Type: <strong className="text-primary">{c.type}</strong>
                    </span>
                  </div>
                  {getStatusBadge(c.status)}
                </div>

                <div className="h-px bg-border/60" />

                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-bold">Dentist</span>
                    <span className="text-foreground">{c.dentistName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-bold">External Lab</span>
                    <span className="text-foreground truncate block">{c.labName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-bold">Expected Date</span>
                    <span className="text-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      {c.expectedDelivery}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-border/60" />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full font-bold text-[10px] h-8 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCaseId(c.id);
                      toast.info(`Tracking case #${c.id}.`);
                      if (c.type === 'Implant') {
                        navigate('/lab/implant');
                      } else {
                        navigate('/lab/crown');
                      }
                    }}
                  >
                    Track Case
                  </Button>
                  {c.status !== 'Delivered' && (
                    <Button
                      size="sm"
                      className="w-full font-bold text-[10px] h-8 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCaseStatus(c.id, 'Delivered');
                      }}
                    >
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Case Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Lab Case">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-semibold">
          <Select
            label="Patient (Assigned Clinic Queue)"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            options={[
              { value: '', label: 'Select Patient' },
              ...patients.map((p) => ({
                value: p.id,
                label: `${p.name} (#${p.id})`
              }))
            ]}
          />

          <Input
            label="Dentist Provider *"
            value={dentistName}
            onChange={(e) => setDentistName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Prosthesis Type"
              value={caseType}
              onChange={(e) => setCaseType(e.target.value)}
              options={[
                { value: '', label: 'Select Type' },
                { value: 'Crown', label: 'Dental Crown' },
                { value: 'Implant', label: 'Abutment/Implant' },
                { value: 'Denture', label: 'Full/Partial Denture' },
                { value: 'Bridge', label: 'Dental Bridge' }
              ]}
            />
            <Input
              label="Lab Base Cost ($ USD) *"
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="External Laboratory Name *"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              required
            />
            <Input
              label="Expected Delivery Date"
              type="date"
              value={expectedDelivery}
              onChange={(e) => setExpectedDelivery(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Technician Prescription Notes</label>
            <textarea
              placeholder="Provide custom fabrication specifications, margins, alloys, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full text-xs bg-muted border border-border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
            />
          </div>

          {/* Add Attachments section */}
          <div className="space-y-2 border-t border-border/60 pt-3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Digital Scans & Scopes (Attachments)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. intraoral_scan_mesh.obj"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-border bg-muted/30 rounded-lg text-xs font-semibold focus:outline-none text-foreground"
              />
              <button
                type="button"
                onClick={handleAddFile}
                className="px-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border rounded-lg cursor-pointer"
              >
                Add File
              </button>
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {files.map((f, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full"
                  >
                    <FileText className="h-3 w-3" />
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="font-bold text-xs h-9 cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" className="font-bold text-xs h-9 gap-1.5 cursor-pointer">
              <CheckCircle2 className="h-4 w-4" /> Save Lab Case
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default LabCasesPage;
