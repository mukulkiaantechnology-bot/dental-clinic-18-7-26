import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Stethoscope,
  DollarSign,
  BrainCircuit,
  Settings,
  TrendingUp,
  Activity,
  UserCheck2,
  Download,
  AlertCircle,
  Filter,
  Clock,
  ShieldCheck,
  Eye,
  Search,
  LogIn
} from 'lucide-react';
import api from '../../../shared/utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useClinicOwnerStore } from '../../../store/clinicOwnerStore';
import { useBillingStore } from '../../../store/billingStore';
import { useSuperAdminStore } from '../../../store/superAdminStore';
import { useSubscriptionStore } from '../../../store/subscriptionStore';
import { DataTable } from '../../../shared/ui/DataTable';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { Badge } from '../../../shared/ui/Badge';
import { useToast } from '../../../shared/hooks/useToast';
import { Modal } from '../../../shared/ui/Modal';

// Shared Status badge helper
function StatusBadge({ status }) {
  if (status === 'Active' || status === 'Paid' || status === 'Confirmed') {
    return <Badge variant="success">{status}</Badge>;
  } else if (status === 'Pending' || status === 'Unpaid') {
    return <Badge variant="info">{status}</Badge>;
  } else {
    return <Badge variant="destructive">{status}</Badge>;
  }
}

// 1. SCOPED PATIENTS PAGE (CRUD)
export function ClinicPatientsPage() {
  const { patients, fetchPatients, addPatient, updatePatient, deletePatient } = useClinicOwnerStore();
  const toast = useToast();

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activePat, setActivePat] = useState(null);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [allergies, setAllergies] = useState('');
  const [insurance, setInsurance] = useState('');
  const [status, setStatus] = useState('Active');

  const handleOpenAdd = () => {
    setName('');
    setAge('');
    setGender('Male');
    setPhone('');
    setEmail('');
    setPassword('');
    setAddress('');
    setAllergies('');
    setInsurance('');
    setStatus('Active');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (pat) => {
    setActivePat(pat);
    setName(pat.name);
    setAge(String(pat.age));
    setGender(pat.gender || 'Male');
    setPhone(pat.phone);
    setEmail(pat.email);
    setPassword(pat.password || '');
    setAddress(pat.address || '');
    setAllergies(pat.allergies ? pat.allergies.join(', ') : '');
    setInsurance(pat.insuranceProvider || '');
    setStatus(pat.status || 'Active');
    setIsEditOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !email || !password) {
      toast.error('Please complete required fields (Name, Phone, Email, Password)!');
      return;
    }

    const allergyArr = allergies
      ? allergies.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

    try {
      await addPatient({
        name,
        age: Number(age) || 30,
        gender,
        phone,
        email,
        password,
        address,
        allergies: allergyArr,
        insuranceProvider: insurance || 'None',
        status: 'Active'
      });
      toast.success(`Registered patient: ${name}`);
      setIsAddOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register patient');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activePat) return;
    if (!name || !phone || !email) {
      toast.error('Please complete required fields (Name, Phone, Email)!');
      return;
    }

    const allergyArr = allergies
      ? allergies.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

    try {
      await updatePatient(activePat.id, {
        name,
        age: Number(age) || 30,
        gender,
        phone,
        email,
        password,
        address,
        allergies: allergyArr,
        insuranceProvider: insurance || 'None',
        status
      });
      toast.success(`Updated details for patient: ${name}`);
      setIsEditOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update patient');
    }
  };

  const handleDelete = (id, patName) => {
    if (confirm(`Permanently delete record for patient "${patName}"?`)) {
      deletePatient(id);
      toast.warning(`Deleted patient: ${patName}`);
    }
  };

  const columns = [
    { key: 'id', header: 'Patient ID', render: (p) => <span className="font-bold text-slate-500">#{p.id}</span> },
    { key: 'name', header: 'Full Name' },
    { key: 'age', header: 'Age' },
    { key: 'phone', header: 'Phone Number' },
    { key: 'email', header: 'Email' },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(p)} className="h-8 w-8 rounded-full">
            <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id, p.name)} className="h-8 w-8 rounded-full">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-lg md:text-xl lg:text-2xl font-extrabold flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Patients Registry
          </h2>
          <p className="text-[11px] md:text-xs text-muted-foreground font-semibold">Manage clinical profiles and registration records for local clinic patients.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-1.5 w-full sm:w-auto h-12 sm:h-10 text-xs font-bold">
          <Plus className="h-4 w-4" />
          Add New Patient
        </Button>
      </div>

      <div className="bg-card p-4 md:p-5 border border-border rounded-xl shadow-sm">
        <DataTable columns={columns} data={patients} searchKey="name" searchPlaceholder="Search patients by name..." pageSize={10} />
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Patient Profile" size="2xl">
        <form onSubmit={handleAddSubmit} className="space-y-4 flex flex-col h-full animate-fade-in text-xs">
          
          <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1">
            <Users className="h-4.5 w-4.5" />
            1. Demographics & Contact details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Patient Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arthur Dent"
              required
              className="text-xs text-foreground font-medium"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 42"
                className="text-xs text-foreground font-medium"
              />
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Contact Phone Number *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (206) 555-4242"
              required
              className="text-xs text-foreground font-medium"
            />
            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. arthur@galaxy.com"
              required
              className="text-xs text-foreground font-medium"
            />
            <Input
              label="Account Password *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create login password"
              required
              className="text-xs text-foreground font-medium"
            />
          </div>

          <Input
            label="Residential Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Country Lane, Cottington, UK"
            className="text-xs text-foreground font-medium"
          />

          <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-2 pt-4 flex items-center gap-1">
            <ShieldCheck className="h-4.5 w-4.5" />
            2. Medical Summary & Insurance Eligibility
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Known Allergies (comma separated)"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Latex"
              className="text-xs text-foreground font-medium"
            />
            <Input
              label="Insurance Provider Name"
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
              placeholder="e.g. Blue Cross Blue Shield"
              className="text-xs text-foreground font-medium"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-6 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              className="font-bold text-xs w-full sm:w-auto h-11 sm:h-10 cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" className="font-bold text-xs w-full sm:w-auto h-11 sm:h-10 cursor-pointer">
              Register Patient
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Patient Profile" size="2xl">
        <form onSubmit={handleEditSubmit} className="space-y-4 flex flex-col h-full animate-fade-in text-xs">
          
          <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1">
            <Users className="h-4.5 w-4.5" />
            1. Demographics & Contact details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Patient Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arthur Dent"
              required
              className="text-xs text-foreground font-medium"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 42"
                className="text-xs text-foreground font-medium"
              />
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Contact Phone Number *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (206) 555-4242"
              required
              className="text-xs text-foreground font-medium"
            />
            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. arthur@galaxy.com"
              required
              className="text-xs text-foreground font-medium"
            />
            <Input
              label="Account Password *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Update login password"
              className="text-xs text-foreground font-medium"
            />
          </div>

          <Input
            label="Residential Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Country Lane, Cottington, UK"
            className="text-xs text-foreground font-medium"
          />

          <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-2 pt-4 flex items-center gap-1">
            <ShieldCheck className="h-4.5 w-4.5" />
            2. Medical Summary & Insurance Eligibility
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Known Allergies (comma separated)"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Latex"
              className="text-xs text-foreground font-medium"
            />
            <Input
              label="Insurance Provider Name"
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
              placeholder="e.g. Blue Cross Blue Shield"
              className="text-xs text-foreground font-medium"
            />
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Patient File Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs font-bold bg-muted border border-border rounded-lg p-2.5 focus:outline-none cursor-pointer text-foreground"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-border mt-6 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="font-bold text-xs w-full sm:w-auto h-11 sm:h-10 cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" className="font-bold text-xs w-full sm:w-auto h-11 sm:h-10 cursor-pointer">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// 3. CLINICAL CHARTS PAGE (CRUD)
export function ClinicClinicalPage() {
  const { clinicalNotes, fetchClinicalNotes, loading } = useClinicOwnerStore();
  const toast = useToast();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyPatient, setHistoryPatient] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchClinicalNotes();
  }, [fetchClinicalNotes]);

  const handleOpenHistory = async (patientId) => {
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryPatient(null);
    try {
      const { data } = await api.get(`/patients/${patientId}`);
      if (data.success) {
        setHistoryPatient(data.data);
      } else {
        toast.error('Failed to load patient history details.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load patient history details.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns = [
    { key: 'date', header: 'Entry Date' },
    { key: 'patientName', header: 'Patient', render: (n) => <span className="font-extrabold text-foreground">{n.patientName}</span> },
    { key: 'dentistName', header: 'Doctor', render: (n) => <span className="font-semibold">{n.dentistName} ({n.authorRole})</span> },
    { key: 'toothNumber', header: 'Tooth #', render: (n) => <span className="font-extrabold text-indigo-500">#{n.toothNumber}</span> },
    { key: 'diagnosis', header: 'Diagnosis / Notes Header', render: (n) => <span className="font-medium text-foreground truncate max-w-[150px] block">{n.diagnosis}</span> },
    { key: 'treatment', header: 'Completed Treatment', render: (n) => <span className="font-medium text-foreground truncate max-w-[150px] block">{n.treatment}</span> },
    { key: 'notes', header: 'Clinical Notes Summary', render: (n) => <p className="text-xs text-muted-foreground font-semibold max-w-[200px] truncate">{n.notes.length > 50 ? `${n.notes.substring(0, 50)}...` : n.notes}</p> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (n) => (
        <Button
          size="sm"
          onClick={() => handleOpenHistory(n.patientId)}
          className="font-bold text-[11px] h-8 cursor-pointer gap-1.5 flex items-center bg-primary hover:bg-primary/95 text-white"
        >
          <Eye className="h-3.5 w-3.5" /> View Details
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-lg md:text-xl lg:text-2xl font-extrabold flex items-center gap-2 text-foreground">
            <Stethoscope className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Clinical Notes & Charting
          </h2>
          <p className="text-[11px] md:text-xs text-muted-foreground font-semibold">Documented dental diagnoses, charting logs, and clinical procedure summaries.</p>
        </div>
      </div>

      <div className="bg-card p-4 md:p-5 border border-border rounded-xl shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs font-bold text-muted-foreground">
            <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            Loading clinical notes...
          </div>
        ) : (
          <DataTable columns={columns} data={clinicalNotes} searchKey="patientName" searchPlaceholder="Search by patient..." pageSize={10} />
        )}
      </div>

      {/* Patient Clinical History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Patient Clinical History: ${historyPatient?.name || 'Loading...'}`}
        size="3xl"
      >
        {historyLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-xs font-semibold text-muted-foreground select-none">
            <span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            Fetching electronic health records...
          </div>
        ) : historyPatient ? (
          <div className="space-y-6 text-xs text-left font-semibold">
            {/* Demographics Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-border bg-muted/20 rounded-2xl">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-extrabold">AGE / GENDER</span>
                <span className="text-foreground text-sm font-bold mt-1 block">
                  {historyPatient.age} yrs · {historyPatient.gender || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-extrabold">PHONE NUMBER</span>
                <span className="text-foreground text-sm font-bold mt-1 block">{historyPatient.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-extrabold">INSURANCE CARRIER</span>
                <span className="text-foreground text-sm font-bold mt-1 block">{historyPatient.insuranceProvider || 'None'}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-extrabold">ALLERGIES</span>
                <span className="text-rose-500 text-sm font-bold mt-1 block">
                  {historyPatient.allergies && historyPatient.allergies.length > 0
                    ? Array.isArray(historyPatient.allergies)
                      ? historyPatient.allergies.join(', ')
                      : historyPatient.allergies
                    : 'None Reported'}
                </span>
              </div>
            </div>

            {/* Treatment History - Stacked Sequentially */}
            <div className="space-y-6">
              {/* Clinical Notes & Logs */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-1">
                  Clinical Notes & Logs
                </h3>
                {historyPatient.clinicalNotes && historyPatient.clinicalNotes.length > 0 ? (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {historyPatient.clinicalNotes.map((n) => (
                      <div key={n.id} className="p-3 border border-border bg-card rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                          <span>{n.authorName || 'Unknown Staff'} ({n.authorRole || 'Staff'})</span>
                        </div>
                        <p className="text-foreground text-xs leading-relaxed font-semibold font-mono whitespace-pre-wrap">
                          {n.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4">No clinical notes recorded for this patient.</p>
                )}
              </div>

              {/* Treatment Plans & Status */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-1">
                  Treatment Plans & Status
                </h3>
                {historyPatient.treatmentPlans && historyPatient.treatmentPlans.length > 0 ? (
                  <div className="border border-border rounded-xl overflow-hidden text-xs max-h-[250px] overflow-y-auto">
                    <table className="w-full text-left divide-y divide-border">
                      <thead className="bg-muted text-[10px] uppercase font-bold text-muted-foreground sticky top-0 z-10">
                        <tr>
                          <th className="p-2 bg-muted">Tooth</th>
                          <th className="p-2 bg-muted">Procedure</th>
                          <th className="p-2 bg-muted">Cost</th>
                          <th className="p-2 text-right bg-muted">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {historyPatient.treatmentPlans.map((tp) => (
                          <tr key={tp.id}>
                            <td className="p-2 font-extrabold text-indigo-400">#{tp.tooth}</td>
                            <td className="p-2">{tp.procedure}</td>
                            <td className="p-2 font-extrabold">${tp.cost}</td>
                            <td className="p-2 text-right">
                              <Badge variant={tp.status === 'Completed' ? 'success' : 'info'} className="text-[9px] font-bold uppercase">
                                {tp.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-2">No treatment plans established yet.</p>
                )}

                {historyPatient.signature && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-border bg-card rounded-xl gap-3 mt-2">
                    <div className="text-[10px] text-muted-foreground font-semibold">
                      Patient has accepted and digitally signed the active treatment plan.
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Patient Sign:</span>
                      <div className="border border-border rounded bg-muted/40 px-2 py-1 flex items-center justify-center h-10 w-28 overflow-hidden">
                        <img
                          src={historyPatient.signature}
                          alt="Consent Signature"
                          className="max-h-full max-w-full object-contain filter dark:invert"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Prescriptions */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-1">
                  Active Prescriptions
                </h3>
                {historyPatient.prescriptions && historyPatient.prescriptions.length > 0 ? (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {historyPatient.prescriptions.map((rx) => (
                      <div key={rx.id} className="p-2.5 border border-border bg-muted/20 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-extrabold text-foreground">{rx.drug}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {rx.dosage} · {rx.frequency} · {rx.duration}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold">{new Date(rx.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-2">No active prescriptions.</p>
                )}
              </div>

              {/* Scanned Radiographs (X-rays) */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider border-b border-border pb-1">
                  Scanned Radiographs (X-rays)
                </h3>
                {historyPatient.xrayFiles && historyPatient.xrayFiles.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {historyPatient.xrayFiles.map((x) => (
                      <div key={x.id} className="p-2.5 border border-border bg-muted/20 rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                          <span>{x.name}</span>
                          <span>{new Date(x.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10.5px] text-foreground font-semibold">{x.notes || 'No notes available.'}</p>
                        {x.aiReport && (
                          <p className="text-[9.5px] bg-primary/10 border border-primary/20 text-primary p-1.5 rounded-lg font-bold">
                            AI Insights: {x.aiReport}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-2">No X-ray files uploaded.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end pt-3 border-t border-border mt-6">
          <Button type="button" variant="outline" onClick={() => setIsHistoryOpen(false)}>Close EHR History</Button>
        </div>
      </Modal>
    </div>
  );
}

// 4. BILLING HUB — READ-ONLY Clinic Owner Financial Dashboard
export function ClinicBillingPage() {
  const { invoices, payments, fetchBillingData } = useBillingStore();
  const toast = useToast();

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter selection state
  const [filterType, setFilterType] = useState('month'); // 'today', 'month', 'year', 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Fixed KPIs (not affected by active filters, representing current state)
  const todayRevenue = useMemo(() => {
    return payments
      .filter((p) => p.date === today)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, today]);

  const monthlyRevenue = useMemo(() => {
    const currentMonth = today.substring(0, 7); // '2026-06'
    return payments
      .filter((p) => p.date.startsWith(currentMonth))
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, today]);

  const yearlyRevenue = useMemo(() => {
    const currentYear = today.substring(0, 4); // '2026'
    return payments
      .filter((p) => p.date.startsWith(currentYear))
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, today]);

  const pendingInvoicesCount = useMemo(() => {
    return invoices.filter((inv) => inv.status === 'Unpaid' || inv.status === 'Partial').length;
  }, [invoices]);

  // Overdue Invoice Alerts
  const overdueInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.status === 'Overdue');
  }, [invoices]);

  // Filtered Payments for list & trend indicator based on active filter
  const filteredPayments = useMemo(() => {
    let list = [...payments];
    
    if (filterType === 'today') {
      list = list.filter((p) => p.date === today);
    } else if (filterType === 'month') {
      const currentMonth = today.substring(0, 7);
      list = list.filter((p) => p.date.startsWith(currentMonth));
    } else if (filterType === 'year') {
      const currentYear = today.substring(0, 4);
      list = list.filter((p) => p.date.startsWith(currentYear));
    } else if (filterType === 'custom') {
      if (customStart) {
        list = list.filter((p) => p.date >= customStart);
      }
      if (customEnd) {
        list = list.filter((p) => p.date <= customEnd);
      }
    }
    
    // Sort by date descending
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [payments, filterType, customStart, customEnd, today]);

  // Monthly Revenue Trend Chart (current year, computed dynamically)
  const monthlyTrendData = useMemo(() => {
    const currentYear = today.substring(0, 4);
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return monthsShort.map((m, idx) => {
      const monthPrefix = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
      const monthPayments = payments.filter((p) => p.date.startsWith(monthPrefix));
      
      const insurance = monthPayments.filter((p) => p.method === 'Insurance').reduce((sum, p) => sum + p.amount, 0);
      const patient = monthPayments.filter((p) => p.method !== 'Insurance').reduce((sum, p) => sum + p.amount, 0);
      const total = insurance + patient;
      
      return {
        month: m,
        revenue: total,
        insurance,
        patient
      };
    });
  }, [payments, today]);

  // CSV Exporter Helper
  const handleDownloadCSV = (filename, data) => {
    if (data.length === 0) {
      toast.warning('No transactions found for this date range.');
      return;
    }
    const headers = ['id', 'invoiceId', 'patientName', 'amount', 'method', 'date', 'note'];
    const headerLabels = ['Payment ID', 'Invoice ID', 'Patient Name', 'Amount ($)', 'Method', 'Date', 'Note'];
    
    const escapeVal = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    
    const rows = [
      headerLabels.map(escapeVal).join(','),
      ...data.map((item) => headers.map((h) => escapeVal(item[h])).join(','))
    ];
    
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${data.length} transactions as ${filename}.csv`);
  };

  const downloadMonthly = () => {
    const currentMonth = today.substring(0, 7);
    const monthlyData = payments.filter((p) => p.date.startsWith(currentMonth));
    handleDownloadCSV(`monthly_revenue_${currentMonth}`, monthlyData);
  };

  const downloadYearly = () => {
    const currentYear = today.substring(0, 4);
    const yearlyData = payments.filter((p) => p.date.startsWith(currentYear));
    handleDownloadCSV(`yearly_revenue_${currentYear}`, yearlyData);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight">Financial & Billing Analytics</h2>
            <p className="text-[10px] text-muted-foreground font-semibold">Read-only performance dashboard for Clinic Owners.</p>
          </div>
        </div>

        {/* Action Controls for CSV Exports */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={downloadMonthly} className="font-bold text-xs gap-1.5 h-9">
            <Download className="h-4 w-4" /> Download Monthly CSV
          </Button>
          <Button size="sm" variant="outline" onClick={downloadYearly} className="font-bold text-xs gap-1.5 h-9">
            <Download className="h-4 w-4" /> Download Yearly CSV
          </Button>
        </div>
      </div>

      {/* Overdue Invoice Alerts */}
      {overdueInvoices.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-extrabold text-rose-500">Overdue Invoice Alert</p>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
              {overdueInvoices.length} invoice{overdueInvoices.length > 1 ? 's' : ''} overdue — {overdueInvoices.map((inv) => `${inv.patientName} ($${inv.amount.toFixed(2)})`).join(', ')}.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue", value: `$${todayRevenue.toFixed(2)}`, icon: DollarSign, color: 'primary', sub: 'Collected today' },
          { label: 'Monthly Revenue', value: `$${monthlyRevenue.toFixed(2)}`, icon: TrendingUp, color: 'emerald', sub: 'This month' },
          { label: 'Yearly Revenue', value: `$${yearlyRevenue.toFixed(2)}`, icon: Activity, color: 'indigo', sub: 'This calendar year' },
          { label: 'Pending Invoices', value: pendingInvoicesCount, icon: Clock, color: 'amber', sub: 'Awaiting collection' }
        ].map((kpi) => {
          const Icon = kpi.icon;
          const colorMap = {
            primary: 'bg-primary/10 text-primary',
            emerald: 'bg-emerald-500/10 text-emerald-500',
            indigo: 'bg-indigo-500/10 text-indigo-500',
            amber: 'bg-amber-500/10 text-amber-500'
          };
          return (
            <div key={kpi.label} className="bg-card border border-border p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{kpi.label}</span>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">{kpi.value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl ${colorMap[kpi.color]}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground font-semibold mt-3">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Interactive Filters Panel */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-extrabold text-foreground">Filter Transactions list:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-0.5 bg-muted rounded-xl border border-border">
            {[
              { id: 'today', label: 'Today' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'custom', label: 'Custom Range' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                  filterType === f.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filterType === 'custom' && (
            <div className="flex items-center gap-2 animate-fade-in">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                placeholder="Start Date"
                className="w-32 h-8 text-xs font-semibold"
              />
              <span className="text-muted-foreground text-xs font-bold">to</span>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                placeholder="End Date"
                className="w-32 h-8 text-xs font-semibold"
              />
            </div>
          )}
        </div>
      </div>

      {/* Charts + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-extrabold text-sm text-foreground mb-4">Monthly Revenue Trends ({today.substring(0, 4)})</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700 }} />
              <YAxis tick={{ fontSize: 9, fontWeight: 700 }} />
              <Tooltip
                contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)' }}
                formatter={(v) => [`$${v}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
              <Bar dataKey="insurance" name="Insurance Claims" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="patient" name="Patient Payments" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Filtered Recent Payments List */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-foreground">Recent Transactions</h3>
              <span className="text-[9px] font-bold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full uppercase tracking-wider">
                {filterType === 'custom' ? 'Filtered' : filterType}
              </span>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Clock className="h-8 w-8 stroke-1 text-muted-foreground/60 mb-2" />
                <p className="text-xs font-bold">No payments recorded</p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5">Adjust filters or range options.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                {filteredPayments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 hover:bg-muted/10 px-1 rounded-lg transition-colors">
                    <div>
                      <p className="text-xs font-extrabold text-foreground">{p.patientName}</p>
                      <p className="text-[9px] text-muted-foreground font-semibold">
                        {p.method} · {p.date} Ref: {p.invoiceId}
                      </p>
                    </div>
                    <span className="text-xs font-black text-emerald-500">
                      +${p.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-[9px] text-muted-foreground font-semibold border-t border-border pt-3">
            Showing up to 5 most recent payments for active date filter. Read-only clinic data synced with main database.
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. STAFF DIRECTORY PAGE (CRUD)
export function ClinicStaffPage() {
  const navigate = useNavigate();
  const { staff, fetchStaff, addStaff, updateStaff, deleteStaff } = useClinicOwnerStore();
  const toast = useToast();

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleDirectLogin = (stf) => {
    const roleMapping = {
      'Dentist': 'dentist',
      'Assistant': 'dental_assistant',
      'Hygienist': 'hygienist',
      'Front Desk': 'front_desk',
      'Billing Staff': 'billing_staff',
      'Lab Coordinator': 'lab_coordinator',
      'Patient': 'patient'
    };
    const roleKey = stf.rawRole || roleMapping[stf.role] || (stf.role || '').toLowerCase().replace(/\s+/g, '_');

    const pathMapping = {
      'dentist': '/dentist/dashboard',
      'dental_assistant': '/assistant/dashboard',
      'hygienist': '/hygienist/dashboard',
      'front_desk': '/frontdesk/dashboard',
      'billing_staff': '/billing',
      'lab_coordinator': '/lab/cases',
      'patient': '/patient/dashboard'
    };
    const targetPath = pathMapping[roleKey] || '/clinic/dashboard';

    const currentAdminUser = useAuthStore.getState().user;
    if (!localStorage.getItem('hms_original_admin_user') && currentAdminUser) {
      localStorage.setItem('hms_original_admin_user', JSON.stringify(currentAdminUser));
    }

    const impersonatedUser = {
      id: stf.id,
      name: stf.name,
      email: stf.email,
      role: roleKey,
      clinicId: currentAdminUser?.clinicId || 'clinic-1',
      status: 'Approved',
      avatarUrl: stf.avatarUrl || null,
      isImpersonated: true
    };

    localStorage.setItem('hms_auth_user', JSON.stringify(impersonatedUser));
    useAuthStore.setState({ user: impersonatedUser, isAuthenticated: true });

    toast.success(`Direct login as ${stf.name} (${stf.role})`);
    navigate(targetPath);
  };

  const baseStaff = useMemo(() => {
    return staff.filter((s) => {
      const roleLower = (s.role || '').toLowerCase();
      return roleLower !== 'clinic_owner' && roleLower !== 'patient';
    });
  }, [staff]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const roleCounts = useMemo(() => {
    const counts = {};
    baseStaff.forEach(s => {
      const r = s.role || 'Unknown';
      counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  }, [baseStaff]);

  const roleOptions = useMemo(() => {
    const uniqueRoles = Object.keys(roleCounts).sort();
    return [
      { value: 'All', label: `All Roles (${baseStaff.length})` },
      ...uniqueRoles.map(r => ({ value: r, label: `${r} (${roleCounts[r]})` }))
    ];
  }, [roleCounts, baseStaff.length]);

  const finalFilteredStaff = useMemo(() => {
    return baseStaff.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (s.name || '').toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q);
      
      const matchesRole = roleFilter === 'All' || s.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [baseStaff, searchQuery, roleFilter]);

  const assistantsList = useMemo(() => {
    return staff.filter((s) => s.role === 'Assistant');
  }, [staff]);

  const hygienistsList = useMemo(() => {
    return staff.filter((s) => s.role === 'Hygienist');
  }, [staff]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeStf, setActiveStf] = useState(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [assistantId, setAssistantId] = useState('');
  const [hygienistId, setHygienistId] = useState('');

  const handleOpenAdd = () => {
    setName('');
    setRole('');
    setSpeciality('');
    setPhone('');
    setEmail('');
    setPassword('');
    setStatus('');
    setAssistantId('');
    setHygienistId('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (stf) => {
    setActiveStf(stf);
    setName(stf.name);
    setRole(stf.role);
    setSpeciality(stf.speciality || '');
    setPhone(stf.phone === 'N/A' ? '' : stf.phone || '');
    setEmail(stf.email);
    setPassword('');
    setStatus(stf.status || 'Active');
    setAssistantId(stf.assistantId || '');
    setHygienistId(stf.hygienistId || '');
    setIsEditOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    const dbStatus = status === 'Active' ? 'Approved' : 'Suspended';
    try {
      await addStaff({ 
        name, 
        role, 
        speciality: role === 'Dentist' ? speciality : '', 
        phone, 
        email, 
        password, 
        status: dbStatus,
        assistantId: role === 'Dentist' ? assistantId : null,
        hygienistId: role === 'Dentist' ? hygienistId : null
      });
      toast.success(`Added employee credentials: ${name}`);
      setIsAddOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff member');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeStf) return;
    const dbStatus = status === 'Active' ? 'Approved' : 'Suspended';
    try {
      await updateStaff(activeStf.id, { 
        name, 
        role, 
        speciality: role === 'Dentist' ? speciality : '', 
        phone, 
        email, 
        password, 
        status: dbStatus,
        assistantId: role === 'Dentist' ? assistantId : null,
        hygienistId: role === 'Dentist' ? hygienistId : null
      });
      toast.success(`Updated details for employee: ${name}`);
      setIsEditOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee');
    }
  };

  const handleDelete = (id, stfName) => {
    if (confirm(`Revoke credentials and delete record for ${stfName}?`)) {
      deleteStaff(id);
      toast.warning(`Deleted staff record: ${stfName}`);
    }
  };

  const columns = [
    { key: 'name', header: 'Staff Name', render: (s) => <span className="font-semibold">{s.name}</span> },
    {
      key: 'role',
      header: 'Clinic Role',
      render: (s) => {
        const isDentist = s.role === 'Dentist';
        const specText = isDentist && s.speciality ? ` (${s.speciality})` : '';
        const assistant = staff.find((m) => m.id === s.assistantId);
        const hygienist = staff.find((m) => m.id === s.hygienistId);
        return (
          <div className="flex flex-col gap-1.5 text-left">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {s.role}{specText}
            </span>
            {isDentist && (assistant || hygienist) && (
              <div className="flex flex-col gap-1 text-[11px] text-slate-400 mt-0.5">
                {assistant && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">Asst</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">{assistant.name}</span>
                  </div>
                )}
                {hygienist && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/45 text-indigo-500 dark:text-indigo-400 px-1.5 py-0.5 rounded">Hyg</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">{hygienist.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex gap-1 justify-end items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDirectLogin(s)}
            className="h-8 w-8 rounded-full hover:bg-indigo-500/10"
            title={`Direct Login as ${s.name} (${s.role})`}
          >
            <LogIn className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(s)} className="h-8 w-8 rounded-full">
            <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id, s.name)} className="h-8 w-8 rounded-full">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-lg md:text-xl lg:text-2xl font-extrabold flex items-center gap-2 text-foreground">
            <UserCheck2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Clinic Staff Registry
          </h2>
          <p className="text-[11px] md:text-xs text-muted-foreground font-semibold">Manage clinical and administrative employees registered for this clinic location.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-1.5 w-full sm:w-auto h-12 sm:h-10 text-xs font-bold">
          <Plus className="h-4 w-4" />
          Register Employee
        </Button>
      </div>

      <div className="bg-card p-4 md:p-5 border border-border rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, or phone..."
              className="pl-9 h-10 w-full text-sm"
            />
          </div>
          <div className="w-full sm:max-w-[200px]">
            <Select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={roleOptions}
            />
          </div>
        </div>
        <DataTable columns={columns} data={finalFilteredStaff} pageSize={10} />
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Clinic Employee" size="2xl">
        <form onSubmit={handleAddSubmit} className="space-y-4 flex flex-col h-full">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Dr. Robert Miller" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Role Assignment"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: '', label: 'Select Role' },
                { value: 'Dentist', label: 'Dentist (DDS/DMD)' },
                { value: 'Hygienist', label: 'Hygienist (RDH)' },
                { value: 'Assistant', label: 'Dental Assistant' },
                { value: 'Front Desk', label: 'Front Desk' },
                { value: 'Billing Staff', label: 'Billing Staff' },
                { value: 'Lab Coordinator', label: 'Lab Coordinator' }
              ]}
            />
            {role === 'Dentist' ? (
              <Input label="Speciality" value={speciality} onChange={(e) => setSpeciality(e.target.value)} placeholder="e.g. Orthodontics, Surgery" />
            ) : (
              <div />
            )}
          </div>

          {role === 'Dentist' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
              <Select
                label="Assistant"
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
                options={[
                  { value: '', label: 'Select Assistant' },
                  ...assistantsList.map((a) => ({ value: a.id, label: a.name }))
                ]}
              />
              <Select
                label="Hygienist"
                value={hygienistId}
                onChange={(e) => setHygienistId(e.target.value)}
                options={[
                  { value: '', label: 'Select Hygienist' },
                  ...hygienistsList.map((h) => ({ value: h.id, label: h.name }))
                ]}
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone Contact" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. (206) 555-4433" />
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. robert@clinic.com" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Account Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Create login password for employee" />
            <Select
              label="Employee Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: '', label: 'Select Status' },
                { value: 'Active', label: 'Active (Approved)' },
                { value: 'Inactive', label: 'Inactive (Suspended)' }
              ]}
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-border mt-auto">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="w-full sm:w-auto h-12 sm:h-10 text-xs font-bold">Cancel</Button>
            <Button type="submit" className="w-full sm:w-auto h-12 sm:h-10 text-xs font-bold">Create Employee</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Employee Settings" size="2xl">
        {activeStf && (
          <form onSubmit={handleEditSubmit} className="space-y-4 flex flex-col h-full">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Role Assignment"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={[
                  { value: '', label: 'Select Role' },
                  { value: 'Dentist', label: 'Dentist (DDS/DMD)' },
                  { value: 'Hygienist', label: 'Hygienist (RDH)' },
                  { value: 'Assistant', label: 'Dental Assistant' },
                  { value: 'Front Desk', label: 'Front Desk' },
                  { value: 'Billing Staff', label: 'Billing Staff' },
                  { value: 'Lab Coordinator', label: 'Lab Coordinator' }
                ]}
              />
              {role === 'Dentist' ? (
                <Input label="Speciality" value={speciality} onChange={(e) => setSpeciality(e.target.value)} />
              ) : (
                <div />
              )}
            </div>

            {role === 'Dentist' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                <Select
                  label="Assistant"
                  value={assistantId}
                  onChange={(e) => setAssistantId(e.target.value)}
                  options={[
                    { value: '', label: 'Select Assistant' },
                    ...assistantsList.map((a) => ({ value: a.id, label: a.name }))
                  ]}
                />
                <Select
                  label="Hygienist"
                  value={hygienistId}
                  onChange={(e) => setHygienistId(e.target.value)}
                  options={[
                    { value: '', label: 'Select Hygienist' },
                    ...hygienistsList.map((h) => ({ value: h.id, label: h.name }))
                  ]}
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Phone Contact" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Account Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password to update (leave blank to keep current)" />
              <Select
                label="Employee Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: '', label: 'Select Status' },
                  { value: 'Active', label: 'Active (Approved)' },
                  { value: 'Inactive', label: 'Inactive (Suspended)' }
                ]}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-border mt-auto">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="w-full sm:w-auto h-12 sm:h-10 text-xs font-bold">Cancel</Button>
              <Button type="submit" className="w-full sm:w-auto h-12 sm:h-10 text-xs font-bold">Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

// 6. SCOPED REPORTS PAGE
export function ClinicReportsPage() {
  const { invoices } = useClinicOwnerStore();

  const totalSales = useMemo(() => {
    return invoices
      .filter((i) => i.status === 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [invoices]);

  const unpaidSales = useMemo(() => {
    return invoices
      .filter((i) => i.status === 'Unpaid' || i.status === 'Partial')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [invoices]);

  const hasData = totalSales > 0 || unpaidSales > 0;

  const chartData = hasData ? [
    { name: 'Paid Collections', value: totalSales },
    { name: 'Pending Collections', value: unpaidSales }
  ] : [{ name: 'No Data', value: 1 }];

  const barChartData = useMemo(() => {
    if (invoices.length === 0) return [];
    
    const splits = {};
    invoices.forEach(inv => {
      if (inv.items && Array.isArray(inv.items) && inv.items.length > 0) {
        inv.items.forEach(item => {
          const name = item.description || item.name || 'General Treatment';
          const amount = parseFloat(item.cost || item.price || 0);
          splits[name] = (splits[name] || 0) + (amount * (item.quantity || 1));
        });
      } else {
        // Fallback dynamic split if items are missing
        const amt = inv.amount || 0;
        if (amt > 600) splits['Crowns & Implants'] = (splits['Crowns & Implants'] || 0) + amt;
        else if (amt > 300) splits['Root Canal'] = (splits['Root Canal'] || 0) + amt;
        else if (amt > 150) splits['Teeth Cleaning'] = (splits['Teeth Cleaning'] || 0) + amt;
        else splits['Consultations'] = (splits['Consultations'] || 0) + amt;
      }
    });

    return Object.entries(splits).map(([name, Amount]) => ({ name, Amount })).sort((a, b) => b.Amount - a.Amount);
  }, [invoices]);

  const COLORS = hasData ? ['#6366f1', '#fb7185'] : ['#e2e8f0'];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-lg md:text-xl lg:text-2xl font-extrabold flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Clinic Reports & Financials
          </h2>
          <p className="text-[11px] md:text-xs text-muted-foreground font-semibold">Review local clinic collections, procedural splits, and billing flows.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Collections Pie Chart */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Billing Collections Structure</h3>
          <div className="h-64 lg:h-80 w-full flex items-center justify-center relative">
            {!hasData && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <span className="text-xs font-bold text-muted-foreground">No Collections Yet</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                {hasData && <Tooltip formatter={(v) => `$${v}`} />}
                {hasData && <Legend formatter={(value, entry) => `${value}: $${entry.payload.value}`} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Treatment breakdown Bar Chart */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Procedural Revenue Shares</h3>
          <div className="h-64 lg:h-80 w-full">
            {barChartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-border rounded-xl">
                <span className="text-xs font-bold text-muted-foreground">No procedural data yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
                  <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 500 }} />
                  <YAxis tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 500 }} />
                  <Tooltip formatter={(v) => `$${v}`} />
                  <Bar dataKey="Amount" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. SCOPED AI INSIGHTS PAGE
export function ClinicAIPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const aiModules = user?.clinic?.aiModules || {};
  
  const isDiagnosticEnabled = aiModules.diagnostic;
  const isRecallEnabled = aiModules.recallSMS;

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [selectedFile, setSelectedFile] = useState('');

  const runMockScan = () => {
    if (!isDiagnosticEnabled) return;
    setIsScanning(true);
    setScanResult('');
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('AI Diagnosis Scan Complete: Suspicion of alveolar bone-loss detected on tooth #19. Diagnostic margin anomaly reported: 2.3mm. Recommended clinical review.');
      toast.success('Clinical AI Scanner diagnostics generated successfully.');
    }, 2000);
  };

  const sendMockRecalls = () => {
    if (!isRecallEnabled) return;
    toast.success('Recall SMS notifications generated and pushed to patient mobile carriers!');
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          Clinical AI Diagnostic Panel
        </h2>
        <p className="text-xs text-muted-foreground font-semibold">Simulate neural-network radiograph audits and recall automations.</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className={`bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between ${!isDiagnosticEnabled ? 'opacity-50 grayscale select-none' : ''}`}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">1. DICOM RADIOGRAPH SCANNER</span>
              {!isDiagnosticEnabled && <Badge variant="destructive">LOCKED BY HQ</Badge>}
            </div>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Select a jaw radiograph/DICOM file to scan for caries, periodontal bone loss, or nerve root abnormalities.
            </p>

            <Select
              label="Select Target DICOM Scan File"
              value={selectedDicom}
              onChange={(e) => setSelectedDicom(e.target.value)}
              disabled={!isDiagnosticEnabled}
              options={[
                { value: '', label: 'Select Scan File' },
                { value: 'radiograph_lower_jaw.dcm', label: 'Lower Jaw Panoramic (radiograph_lower_jaw.dcm)' },
                { value: 'radiograph_tooth_19.dcm', label: 'Tooth #19 Bitewing Scan (radiograph_tooth_19.dcm)' },
                { value: 'panoramic_full_mouth.dcm', label: 'Full Mouth Orthopantomogram (panoramic_full_mouth.dcm)' }
              ]}
            />

            {isScanning && (
              <div className="p-4 bg-muted/65 border border-border/70 rounded-xl flex items-center justify-center gap-3">
                <Activity className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-xs font-bold text-foreground animate-pulse">Running diagnostic models...</span>
              </div>
            )}

            {scanResult && (
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold leading-relaxed">
                {scanResult}
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-border">
            <Button onClick={runMockScan} disabled={isScanning || !isDiagnosticEnabled} className="w-full font-bold text-xs py-5">
              Launch Diagnostic Scan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClinicSettingsPage() {
  const { settings, fetchClinicSettings, updateClinicSettings } = useClinicOwnerStore();
  const { plans, fetchSubscriptionDetails } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState('');
  const toast = useToast();

  const currentUser = useAuthStore((state) => state.user);
  const users = useSuperAdminStore((state) => state.users);
  const updateUser = useSuperAdminStore((state) => state.updateUser);

  const matchedUser = useMemo(() => {
    if (!currentUser) return null;
    return users.find((u) => u.id === currentUser.id) ||
           users.find((u) => u.email?.toLowerCase() === currentUser.email?.toLowerCase());
  }, [users, currentUser]);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [hours, setHours] = useState('');

  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  useEffect(() => {
    fetchClinicSettings();
    fetchSubscriptionDetails();
  }, [fetchClinicSettings, fetchSubscriptionDetails]);

  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(settings.name || '');
      setAddress(settings.location || settings.address || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setWebsite(settings.website || 'www.metropolitandental.com');
      setHours(settings.hours || 'Mon-Fri, 9:00 AM - 6:00 PM');
    }
  }, [settings]);

  useEffect(() => {
    if (matchedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOwnerName(matchedUser.name || '');
      setOwnerEmail(matchedUser.email || '');
      setOwnerPassword(matchedUser.password || '');
    }
  }, [matchedUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Update Clinic settings
    updateClinicSettings({ name, address, phone, email, website, hours });
    
    // Update Owner details
    if (matchedUser) {
      const payload = {
        name: ownerName,
        email: ownerEmail,
      };
      if (ownerPassword && ownerPassword !== matchedUser.password) {
        payload.password = ownerPassword;
      }
      updateUser(matchedUser.id, payload);

      // Sync with active Auth session and local storage
      const updatedProfile = {
        ...currentUser,
        name: ownerName,
        email: ownerEmail
      };
      localStorage.setItem('hms_auth_session', JSON.stringify(updatedProfile));
      useAuthStore.setState({ user: updatedProfile });
    }

    toast.success('Clinic settings and owner account updated successfully.');
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Clinic General Settings
        </h2>
        <p className="text-xs text-muted-foreground font-semibold">Configure local workspace descriptors, contact numbers, and owner logs.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-sm text-left">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-b border-border pb-2 mb-3">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">1. Practice & Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Clinic Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Apex Dental Center"
              />
              <Input
                label="Clinic Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="e.g. Dallas, TX"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Contact"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="e.g. (214) 555-0182"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Official Website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
              <Input
                label="Operation Hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
              />
            </div>

            <div className="border-b border-border pb-2 pt-2 mb-3">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">2. Clinic Owner Account</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Owner Full Name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                placeholder="e.g. Dr. Arthur Miller"
              />
              <Input
                label="Email Address"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                required
                placeholder="e.g. owner@apexdental.com"
              />
            </div>

            <Input
              label="Owner Password"
              type="password"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              required
              placeholder="Change login password"
            />

            <div className="flex justify-end pt-4 border-t border-border">
              <Button type="submit">Save Settings</Button>
            </div>
          </form>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-500/5 to-primary/5 border border-primary/20 p-6 rounded-2xl shadow-sm text-left">
            <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Current Subscription Plan</h3>
            <div className="space-y-4">
              <div>
                <span className="text-2xl font-black text-foreground">
                  {currentUser?.clinic?.plan || settings?.plan || 'Standard Plan'}
                </span>
                <Badge variant="success" className="ml-2 align-middle">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                You are currently subscribed to the {currentUser?.clinic?.plan || settings?.plan || 'Standard'} tier. Your limits are dictated by the Superadmin.
              </p>
              <div className="pt-4 border-t border-primary/10">
                <Select
                  label="Available Plans"
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  options={[
                    { value: '', label: 'Select a plan to request...' },
                    ...(plans.length > 0 
                        ? plans.map(p => ({ value: p.name, label: `${p.name} - $${p.fee || p.price || 0}/mo` }))
                        : [
                            { value: 'Basic', label: 'Basic Plan - $99/mo' },
                            { value: 'Premium', label: 'Premium Plan - $199/mo' },
                            { value: 'Enterprise', label: 'Enterprise Plan - $499/mo' }
                          ])
                  ]}
                />
                
                {selectedPlan && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-2">
                    <h4 className="text-xs font-bold text-foreground">Plan Includes:</h4>
                    <ul className="text-[11px] text-muted-foreground font-semibold space-y-1 list-disc list-inside">
                      {plans.find(p => p.name === selectedPlan)?.features ? (
                        (typeof plans.find(p => p.name === selectedPlan).features === 'string' 
                          ? plans.find(p => p.name === selectedPlan).features.split(',') 
                          : plans.find(p => p.name === selectedPlan).features).map((f, i) => (
                          <li key={i}>{f.trim()}</li>
                        ))
                      ) : (
                        <>
                          <li>Unlimited Patients</li>
                          <li>Advanced AI Scheduling</li>
                          <li>24/7 Priority Support</li>
                          <li>Custom Reports</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full font-bold text-xs border-primary/30 text-primary hover:bg-primary/10 mt-4"
                  onClick={async () => {
                    if (!selectedPlan) {
                      toast.warning('Please select a plan first.');
                      return;
                    }
                    try {
                      await api.post('/alerts', {
                        title: `Plan Change Request: ${selectedPlan}`,
                        message: `Clinic "${settings.name}" has requested to upgrade/change their plan to ${selectedPlan}. Please review in Subscriptions Management.`,
                        type: 'info',
                        role: 'super_admin',
                        targetClinicId: currentUser.clinicId
                      });
                      toast.success(`Request for ${selectedPlan} sent to Superadmin HQ. They will contact you shortly.`);
                      setSelectedPlan('');
                    } catch (_err) {
                      toast.error('Failed to send request. Please try again.');
                    }
                  }}
                >
                  Request Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
