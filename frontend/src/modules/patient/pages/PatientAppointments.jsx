import { useState, useMemo } from 'react';
import { Calendar, Clock, User, MapPin, AlertCircle, X } from 'lucide-react';
import { usePatientStore } from '../../../store/patientStore';
import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';

export function PatientAppointments() {
  const { appointments, requestReschedule } = usePatientStore();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history'
  const [selectedAppt, setSelectedAppt] = useState(null); // Appointment to reschedule
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Current date in YYYY-MM-DD
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter appointments
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date >= today && (a.status === 'Scheduled' || a.status === 'Checked-In'))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [appointments, today]);

  const historicalAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date < today || a.status === 'Completed' || a.status === 'Cancelled')
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }, [appointments, today]);

  const handleOpenReschedule = (appt) => {
    setSelectedAppt(appt);
    setRescheduleDate(appt.date);
    setRescheduleTime(appt.time);
  };

  const handleCloseReschedule = () => {
    setSelectedAppt(null);
    setRescheduleDate('');
    setRescheduleTime('');
  };

  const handleSubmitReschedule = (e) => {
    e.preventDefault();
    if (!selectedAppt || !rescheduleDate || !rescheduleTime) {
      toast.error('Please fill in both preferred date and time.');
      return;
    }

    requestReschedule(selectedAppt.id, rescheduleDate, rescheduleTime);
    toast.success(
      `Your request to reschedule appointment to ${rescheduleDate} at ${rescheduleTime} has been submitted!`,
      'Rescheduled Successfully'
    );
    handleCloseReschedule();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Checked-In':
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-black uppercase tracking-wider">
            Arrived
          </span>
        );
      case 'Scheduled':
        return (
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider">
            Confirmed
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">
            Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-black uppercase tracking-wider">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[9px] font-black uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Visit Scheduler</h2>
          <p className="text-[10px] text-muted-foreground font-semibold">
            Manage your dental appointments, view upcoming slots, and browse visit history.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 border border-border rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Upcoming ({upcomingAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            History ({historicalAppointments.length})
          </button>
        </div>
      </div>

      {/* Appointment Grid / Cards */}
      {activeTab === 'upcoming' ? (
        upcomingAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingAppointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-card border border-border hover:border-primary/40 rounded-2xl p-5 shadow-xs transition-all relative overflow-hidden flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-foreground">{appt.type} Session</h3>
                    <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      Clinic Location #{appt.clinicId} · Metropolitan Dental
                    </p>
                  </div>
                  {getStatusBadge(appt.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold py-2.5 border-y border-border/50">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
                      Date & Time
                    </span>
                    <span className="text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {appt.date}
                    </span>
                    <span className="text-muted-foreground text-[10px] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {appt.time} ({appt.duration}m)
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
                      Assigned Provider
                    </span>
                    <span className="text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      {appt.dentistName}
                    </span>
                    {appt.hygienistName && (
                      <span className="text-[10px] text-muted-foreground block pl-5 truncate">
                        Hygienist: {appt.hygienistName}
                      </span>
                    )}
                  </div>
                </div>

                {appt.notes && (
                  <div className="text-[11px] leading-relaxed text-muted-foreground bg-muted/30 p-2.5 border border-border rounded-xl">
                    <strong className="text-[9px] uppercase text-foreground/80 tracking-wide block mb-0.5">
                      Instructions & Notes
                    </strong>
                    {appt.notes}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold border-border/80 hover:bg-secondary cursor-pointer"
                    onClick={() => handleOpenReschedule(appt)}
                  >
                    Reschedule Request
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl text-center bg-card">
            <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3 stroke-1" />
            <h4 className="text-sm font-bold text-foreground">No upcoming visits scheduled</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              You are currently caught up with your dental visits. When your clinic schedules a new treatment, cleaning, or consultation, it will appear here.
            </p>
          </div>
        )
      ) : historicalAppointments.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[9px] uppercase text-muted-foreground font-bold tracking-wider">
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Procedure / Type</th>
                  <th className="p-4">Dentist</th>
                  <th className="p-4">Clinic</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Notes Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {historicalAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-muted/10">
                    <td className="p-4">
                      <div className="font-extrabold text-foreground">{appt.date}</div>
                      <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{appt.time}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-foreground">{appt.type}</div>
                      <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{appt.duration} mins</div>
                    </td>
                    <td className="p-4 text-foreground">{appt.dentistName}</td>
                    <td className="p-4 text-muted-foreground">Clinic #{appt.clinicId}</td>
                    <td className="p-4">{getStatusBadge(appt.status)}</td>
                    <td className="p-4 text-muted-foreground max-w-[200px] truncate" title={appt.notes}>
                      {appt.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl text-center bg-card">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3 stroke-1" />
          <h4 className="text-sm font-bold text-foreground">No historical visits found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            You do not have any logged past appointments in our database.
          </p>
        </div>
      )}

      {/* Reschedule Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative text-left">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <div>
                <h3 className="font-extrabold text-sm text-foreground">Request Reschedule</h3>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  Select your new preferred date and time below.
                </p>
              </div>
              <button
                onClick={handleCloseReschedule}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReschedule} className="p-5 space-y-4 text-xs font-semibold">
              <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-2">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
                  Current Scheduled Slot
                </span>
                <div className="flex items-center justify-between text-foreground">
                  <span>{selectedAppt.type} Session</span>
                  <span className="font-extrabold">{selectedAppt.date} at {selectedAppt.time}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  Preferred Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={today}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl p-3 focus:outline-hidden focus:border-primary text-foreground text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  Preferred Time
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl p-3 focus:outline-hidden focus:border-primary text-foreground text-xs"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 p-3 rounded-xl flex gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] leading-normal font-medium">
                  <strong>Sandbox Notice:</strong> Submitting will instantly update the slot in the clinic's core scheduler to simulate receptionist approval.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseReschedule}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
                >
                  Confirm Change
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientAppointments;
