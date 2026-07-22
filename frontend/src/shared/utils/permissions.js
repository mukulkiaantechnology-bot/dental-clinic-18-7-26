export const MODULE_ROUTES = [
  // Super Admin Control Panel Modules (Exactly 7 Modules)
  { module: 'super_admin_dashboard', path: '/super-admin/dashboard', label: 'Dashboard (Global)', icon: 'LayoutDashboard' },
  { module: 'super_admin_clinics', path: '/super-admin/clinics', label: 'Clinics Management', icon: 'Building2' },
  { module: 'super_admin_users', path: '/super-admin/users', label: 'Clinic Owner', icon: 'UserCog' },
  { module: 'super_admin_subscriptions', path: '/super-admin/subscriptions', label: 'Subscriptions', icon: 'Receipt' },
  { module: 'super_admin_billing', path: '/super-admin/billing', label: 'Billing', icon: 'Coins' },
  { module: 'super_admin_ai', path: '/super-admin/ai', label: 'AI Settings', icon: 'Sliders' },
  { module: 'super_admin_reports', path: '/super-admin/reports', label: 'Global Reports', icon: 'TrendingUp' },

  // Clinic Owner Scoped Modules (Exactly 8 Modules)
  { module: 'clinic_dashboard', path: '/clinic/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { module: 'clinic_patients', path: '/clinic/patients', label: 'Patients', icon: 'Users' },
  { module: 'clinic_clinical', path: '/clinic/clinical', label: 'Clinical', icon: 'Stethoscope' },
  { module: 'clinic_billing', path: '/clinic/billing', label: 'Billing', icon: 'CreditCard' },
  { module: 'clinic_staff', path: '/clinic/staff', label: 'Staff Management', icon: 'UserCheck' },
  { module: 'clinic_reports', path: '/clinic/reports', label: 'Reports', icon: 'TrendingUp' },
  { module: 'ai_recall', path: '/communication/ai-recall', label: 'AI Recall & Marketing', icon: 'Megaphone' },
  { module: 'appointments_calendar', path: '/appointments/calendar', label: 'Appointment Scheduler', icon: 'Sparkles' },
  { module: 'clinic_settings', path: '/clinic/settings', label: 'Clinic Settings', icon: 'Settings' },

  // Dentist Clinical Modules (Exactly 8 Modules)
  { module: 'dentist_dashboard', path: '/dentist/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { module: 'dentist_appointments', path: '/dentist/appointments', label: 'Appointments', icon: 'Calendar' },
  { module: 'dentist_patients', path: '/dentist/patients', label: 'Patients', icon: 'Users' },
  { module: 'dentist_charting', path: '/dentist/charting', label: 'Clinical Charting', icon: 'Activity' },
  { module: 'dentist_treatment', path: '/dentist/treatment', label: 'Treatment Plans', icon: 'ClipboardList' },
  { module: 'dentist_xrays', path: '/dentist/xrays', label: 'X-Rays', icon: 'Image' },
  { module: 'dentist_prescriptions', path: '/dentist/prescriptions', label: 'Prescriptions', icon: 'Pill' },
  { module: 'dentist_notes', path: '/dentist/notes', label: 'Notes', icon: 'FileText' },

  // Hygienist Preventive Care Modules
  { module: 'hygienist_dashboard', path: '/hygienist/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { module: 'hygienist_patients', path: '/hygienist/patients', label: 'Patients', icon: 'Users' },
  { module: 'hygienist_perio', path: '/hygienist/perio', label: 'Perio Charting', icon: 'Activity' },
  { module: 'hygienist_recall', path: '/hygienist/recall', label: 'Recall List', icon: 'Clock' },
  { module: 'hygienist_notes', path: '/hygienist/notes', label: 'Clinical Notes', icon: 'FileText' },

  // Front Desk Modules
  { module: 'frontdesk_dashboard', path: '/frontdesk/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { module: 'frontdesk_appointments', path: '/frontdesk/appointments', label: 'Appointments', icon: 'Calendar' },
  { module: 'frontdesk_registration', path: '/frontdesk/registration', label: 'Patient Registration', icon: 'UserPlus' },
  { module: 'frontdesk_insurance', path: '/frontdesk/insurance', label: 'Insurance Verification', icon: 'FileShield' },
  { module: 'frontdesk_waitlist', path: '/frontdesk/waitlist', label: 'Waitlist', icon: 'Clock' },

  // Billing Staff Modules
  { module: 'billing_hub', path: '/billing', label: 'Billing Hub', icon: 'CreditCard' },

  // Dental Assistant Modules
  { module: 'assistant_patients', path: '/assistant/patients', label: 'Assigned Patients', icon: 'Users' },
  { module: 'assistant_xray', path: '/assistant/xray', label: 'X-Ray Upload', icon: 'Image' },
  { module: 'assistant_chairside', path: '/assistant/chairside', label: 'Chairside Tools', icon: 'Activity' },
  { module: 'assistant_notes', path: '/assistant/notes', label: 'Clinical Notes', icon: 'FileText' },

  // Lab Coordinator Modules
  { module: 'lab_cases', path: '/lab/cases', label: 'Lab Cases', icon: 'Folder' },
  { module: 'lab_crown', path: '/lab/crown', label: 'Crown Tracking', icon: 'Layers' },
  { module: 'lab_implant', path: '/lab/implant', label: 'Implant Cases', icon: 'Wrench' },
  { module: 'lab_status', path: '/lab/status', label: 'Status Board', icon: 'Columns' },

  // Patient Portal Modules
  { module: 'patient_dashboard', path: '/patient/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { module: 'patient_appointments', path: '/patient/appointments', label: 'Appointments', icon: 'Calendar' },
  { module: 'patient_treatment', path: '/patient/treatment', label: 'Treatment Plan', icon: 'Activity' },
  { module: 'patient_billing', path: '/patient/billing', label: 'Billing & Payments', icon: 'CreditCard' },
  { module: 'patient_prescriptions', path: '/patient/prescriptions', label: 'Prescriptions', icon: 'FileText' },
  { module: 'patient_reports', path: '/patient/reports', label: 'Reports & X-Rays', icon: 'Folder' }
];

export const ROLE_PERMISSIONS = {
  super_admin: [
    'super_admin_dashboard',
    'super_admin_clinics',
    'super_admin_users',
    'super_admin_subscriptions',
    'super_admin_billing',
    'super_admin_ai',
    'super_admin_reports'
  ],
  clinic_owner: [
    'clinic_dashboard',
    'clinic_patients',
    'clinic_clinical',
    'clinic_billing',
    'clinic_staff',
    'clinic_reports',
    'clinic_settings',
    'ai_recall',
    'appointments_calendar'
  ],
  dentist: [
    'dentist_dashboard',
    'dentist_appointments',
    'dentist_patients',
    'dentist_charting',
    'dentist_treatment',
    'dentist_xrays',
    'dentist_prescriptions',
    'dentist_notes',
    'appointments_calendar'
  ],
  hygienist: [
    'hygienist_dashboard',
    'hygienist_patients',
    'hygienist_perio',
    'hygienist_recall',
    'hygienist_notes',
    'ai_recall',
    'appointments_calendar'
  ],
  front_desk: [
    'frontdesk_dashboard',
    'frontdesk_appointments',
    'frontdesk_registration',
    'frontdesk_insurance',
    'frontdesk_waitlist',
    'ai_recall',
    'appointments_calendar'
  ],
  frontdesk: [
    'frontdesk_dashboard',
    'frontdesk_appointments',
    'frontdesk_registration',
    'frontdesk_insurance',
    'frontdesk_waitlist',
    'ai_recall',
    'appointments_calendar'
  ],
  billing_staff: [
    'billing_hub'
  ],
  dental_assistant: [
    'assistant_patients',
    'assistant_xray',
    'assistant_chairside',
    'assistant_notes',
    'appointments_calendar'
  ],
  assistant: [
    'assistant_patients',
    'assistant_xray',
    'assistant_chairside',
    'assistant_notes',
    'appointments_calendar'
  ],
  lab_coordinator: [
    'lab_cases',
    'lab_crown',
    'lab_implant',
    'lab_status'
  ],
  patient: [
    'patient_dashboard',
    'patient_appointments',
    'patient_treatment',
    'patient_billing',
    'patient_prescriptions',
    'patient_reports'
  ]
};

export function hasModuleAccess(role, moduleName) {
  const allowed = ROLE_PERMISSIONS[role];
  return allowed ? allowed.includes(moduleName) : false;
}

export function getAllowedRoutes(role) {
  return MODULE_ROUTES.filter((route) => hasModuleAccess(role, route.module));
}

export const ROLE_LABELS = {
  super_admin: 'Global Super Admin',
  clinic_owner: 'Clinic Owner',
  dentist: 'Dentist (DDS/DMD)',
  hygienist: 'Dental Hygienist (RDH)',
  front_desk: 'Clinic Front Desk (Reception)',
  frontdesk: 'Clinic Front Desk (Reception)',
  billing_staff: 'Billing Staff Coordinator',
  dental_assistant: 'Dental Assistant',
  assistant: 'Dental Assistant',
  lab_coordinator: 'Lab Coordinator',
  patient: 'Patient Portal'
};
