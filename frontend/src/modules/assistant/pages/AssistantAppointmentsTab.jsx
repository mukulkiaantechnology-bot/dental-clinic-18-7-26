import { useAppointmentStore } from '../../../store/appointmentStore';
import { Badge } from '../../../shared/ui/Badge';
import { Calendar } from 'lucide-react';

export function AssistantAppointmentsTab({ patientId }) {
  const { appointments } = useAppointmentStore();
  const patientAppointments = appointments.filter((a) => a.patientId === patientId);

  if (patientAppointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-3xl mt-4">
        <Calendar className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-bold text-foreground">No appointments found</p>
        <p className="text-xs text-muted-foreground">This patient has no upcoming or past appointments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 animate-fade-in">
      <h3 className="text-lg font-black text-foreground mb-4">Patient Appointments</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patientAppointments.map((apt) => (
          <div key={apt.id} className="bg-card border border-border p-5 rounded-2xl flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider">{apt.date} • {apt.time}</span>
              <Badge variant="secondary" className="text-[9px]">{apt.status || 'Scheduled'}</Badge>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-foreground">{apt.type}</h4>
              <p className="text-xs font-semibold text-muted-foreground mt-1">Provider: {apt.dentistName}</p>
            </div>
            {apt.notes && (
              <div className="mt-2 pt-2 border-t border-border/40">
                <p className="text-[10px] font-medium text-muted-foreground line-clamp-2">Note: {apt.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
