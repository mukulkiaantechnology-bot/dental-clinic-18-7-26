import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Trash2, Eye, UserPlus } from 'lucide-react';
import { usePatientStore } from '../../../store/patientStore';
import { useClinicStore } from '../../../store/clinicStore';
import { useAuthStore } from '../../../store/authStore';
import { DataTable } from '../../../shared/ui/DataTable';
import { Modal } from '../../../shared/ui/Modal';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { Badge } from '../../../shared/ui/Badge';
import { useToast } from '../../../shared/hooks/useToast';

// Form validation schema
const patientSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters'),
  age: z.number().int().min(0, 'Age cannot be negative').max(125, 'Invalid age'),
  gender: z.enum(['Male', 'Female', 'Other']),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Enter a valid email address'),
  address: z.string().min(5, 'Address is too short'),
  allergies: z.string().optional(),
  insuranceProvider: z.string().min(2, 'Insurance provider is required'),
  status: z.enum(['Active', 'Inactive'])
});

export function PatientsPage() {
  const user = useAuthStore((state) => state.user);
  const selectedClinicId = useClinicStore((state) => state.selectedClinicId);
  const clinics = useClinicStore((state) => state.clinics);
  const { patients, addPatient, updatePatient, deletePatient } = usePatientStore();
  const toast = useToast();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [viewingPatient, setViewingPatient] = useState(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      age: 0,
      gender: 'Male',
      phone: '',
      email: '',
      address: '',
      allergies: '',
      insuranceProvider: '',
      status: 'Active'
    }
  });

  // Filter patients based on clinic switching
  const filteredPatients = patients.filter((p) => {
    if (selectedClinicId === 'all') return true;
    return p.clinicId === selectedClinicId;
  });

  // Action: Open form for creation
  const handleOpenCreate = () => {
    setEditingPatient(null);
    reset({
      name: '',
      age: 0,
      gender: 'Male',
      phone: '',
      email: '',
      address: '',
      allergies: '',
      insuranceProvider: '',
      status: 'Active'
    });
    setIsFormOpen(true);
  };

  // Action: Open form for editing
  const handleOpenEdit = (patient) => {
    setEditingPatient(patient);
    reset({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      allergies: patient.allergies.join(', '),
      insuranceProvider: patient.insuranceProvider,
      status: patient.status
    });
    setIsFormOpen(true);
  };

  // Action: Open details view
  const handleOpenDetails = (patient) => {
    setViewingPatient(patient);
    setIsDetailsOpen(true);
  };

  // Form Submit Handler
  const onSubmit = (data) => {
    // Determine target clinic: if role is super_admin and clinic is 'all', pick first clinic as fallback
    const targetClinicId = selectedClinicId === 'all' ? 'clinic-1' : selectedClinicId;
    const patientData = {
      ...data,
      allergies: data.allergies ? data.allergies.split(',').map((s) => s.trim()) : [],
      clinicId: editingPatient ? editingPatient.clinicId : targetClinicId
    };

    if (editingPatient) {
      updatePatient(editingPatient.id, patientData);
      toast.success(`Patient "${data.name}" details updated successfully.`);
    } else {
      addPatient(patientData);
      toast.success(`Patient "${data.name}" registered successfully.`);
    }

    setIsFormOpen(false);
  };

  // Delete Action
  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete patient "${name}"?`)) {
      deletePatient(id);
      toast.warning(`Deleted patient record for "${name}".`);
    }
  };

  // Resolve clinic names
  const clinicNames = clinics.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  // Columns definition
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', align: 'center' },
    { key: 'gender', header: 'Gender', align: 'center' },
    { key: 'phone', header: 'Phone Number' },
    {
      key: 'clinicId',
      header: 'Clinic Location',
      render: (p) => <span className="text-xs font-semibold text-muted-foreground">{clinicNames[p.clinicId]?.split(' ')[0]}</span>
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (p) => (
        <Badge variant={p.status === 'Active' ? 'success' : 'secondary'} className="text-[10px] py-0.5 px-2">
          {p.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="icon" onClick={() => handleOpenDetails(p)} className="h-8 w-8 rounded-full">
            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
          {(user?.role === 'super_admin' ||
            user?.role === 'clinic_owner' ||
            user?.role === 'dentist' ||
            user?.role === 'front_desk') && (
            <>
              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(p)} className="h-8 w-8 rounded-full">
                <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(p.id, p.name)}
                className="h-8 w-8 rounded-full hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Patient Directory</h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            Browse, search, and manage clinical patient registry records.
          </p>
        </div>
        {(user?.role === 'super_admin' ||
          user?.role === 'clinic_owner' ||
          user?.role === 'front_desk') && (
          <Button onClick={handleOpenCreate} className="gap-2 select-none cursor-pointer">
            <UserPlus className="h-4 w-4" />
            Register Patient
          </Button>
        )}
      </div>

      {/* Main DataTable */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
        <DataTable
          columns={columns}
          data={filteredPatients}
          searchPlaceholder="Search patients by name..."
          searchKey="name"
          pageSize={10}
        />
      </div>

      {/* Add / Edit Patient Modal Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingPatient ? 'Edit Patient Record' : 'Register New Patient'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" error={errors.name?.message} {...register('name')} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Age" type="number" error={errors.age?.message} {...register('age', { valueAsNumber: true })} />
            <Select
              label="Gender"
              error={errors.gender?.message}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
              ]}
              {...register('gender')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone Number" error={errors.phone?.message} {...register('phone')} />
            <Input label="Email Address" type="email" error={errors.email?.message} {...register('email')} />
          </div>

          <Input label="Home Address" error={errors.address?.message} {...register('address')} />
          <Input label="Allergies (comma separated)" error={errors.allergies?.message} {...register('allergies')} placeholder="e.g. Penicillin, Latex" />
          <Input label="Insurance Provider" error={errors.insuranceProvider?.message} {...register('insuranceProvider')} />

          <Select
            label="Record Status"
            error={errors.status?.message}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
            {...register('status')}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Patient Clinical File">
        {viewingPatient && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border pb-4">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-2xl dark:bg-primary/20">
                {viewingPatient.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">{viewingPatient.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={viewingPatient.status === 'Active' ? 'success' : 'secondary'}>
                    {viewingPatient.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-semibold">
                    ID: {viewingPatient.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
              <div>
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Age</span>
                <span className="text-sm font-bold text-foreground">{viewingPatient.age} years old</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Gender</span>
                <span className="text-sm font-bold text-foreground">{viewingPatient.gender}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Phone</span>
                <span className="text-sm font-bold text-foreground">{viewingPatient.phone}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Email</span>
                <span className="text-sm font-bold text-foreground break-all">{viewingPatient.email}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Address</span>
                <span className="text-sm font-bold text-foreground">{viewingPatient.address}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Allergies</span>
                {viewingPatient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {viewingPatient.allergies.map((a, i) => (
                      <Badge key={i} variant="destructive" className="py-0.5 px-2 text-[10px] font-semibold">
                        {a}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm font-bold text-foreground">No known allergies</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Insurance Provider</span>
                <span className="text-sm font-bold text-foreground">{viewingPatient.insuranceProvider}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Registered Practice</span>
                <span className="text-sm font-bold text-foreground">{clinicNames[viewingPatient.clinicId]}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={() => setIsDetailsOpen(false)}>Close File</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
export default PatientsPage;
