import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSuperAdminStore } from '../../store/superAdminStore';
import { useToast } from '../hooks/useToast';

export function AICopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // Conversational State Machine
  const [chatState, setChatState] = useState('idle');
  const [tempRegData, setTempRegData] = useState({});
  const [tempLoginData, setTempLoginData] = useState({});
  const [pendingApprovalFlow, setPendingApprovalFlow] = useState(false);
  
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const scrollRef = useRef(null);

  // Sync scroll on updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Compute welcome message based on user role (memoized)
  const welcomeMessage = useMemo(() => {
    if (!user) {
      return 'Hello! I am your HMS AI Copilot. I can help you register a new Clinic branch or Patient account, or log in to the sandboxed portal.';
    }
    if (user.role === 'super_admin') {
      return `Hello Sarah! I am the SaaS Platform Assistant. I can help you monitor clinic licenses, SaaS invoices, and pending approvals.`;
    } else if (user.role === 'clinic_owner') {
      return `Hello! I am your HMS Clinical Copilot. Ask me about scheduling, revenue, or overdue patient records.`;
    } else if (user.role === 'dentist') {
      return `Hello Dr. Chen! I am your Dental Assistant Copilot. I can help you with treatment plans, appointments, and clinical records.`;
    } else if (user.role === 'hygienist') {
      return `Hello Elena! I am your Hygiene Recalls Copilot. I can help you view patients awaiting recall and launch campaigns.`;
    } else if (user.role === 'front_desk' || user.role === 'frontdesk') {
      return `Hello Amara! I am your Reception Desk Copilot. I can help you register new patients, check waitlists, and manage appointments.`;
    } else if (user.role === 'dental_assistant' || user.role === 'assistant') {
      return `Hello David! I am your Chairside Assistant Copilot. I can help you with x-ray uploads, chairside tools, and clinical hygiene EHR templates.`;
    } else if (user.role === 'patient') {
      return `Hello James! I am your Patient Portal Assistant. I can help you view your treatment plans, bills, and upcoming appointments.`;
    }
    return `Hello, ${user.name}! I am ready to support your daily clinic operations. How can I assist you today?`;
  }, [user]);

  // Reset conversation when session changes (user logs in/out)
  // Using setTimeout(0) defers the state update out of the render cycle to avoid cascading renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{ sender: 'ai', text: welcomeMessage }]);
      setChatState('idle');
      setTempRegData({});
      setTempLoginData({});
      setPendingApprovalFlow(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [welcomeMessage]);

  // Quick Action Buttons depending on Role and Conversation state
  const getQuickActions = () => {
    if (!isAuthenticated) {
      if (chatState !== 'idle') {
        return [
          { label: '❌ Cancel & Restart', query: 'RESTART' }
        ];
      }
      return [
        { label: '🏥 Register Clinic', query: 'REGISTER_CLINIC' },
        { label: '👤 Register Patient', query: 'REGISTER_PATIENT' },
        { label: '⚡ Mock Login: Owner', query: 'LOGIN_MOCK_OWNER' },
        { label: '⚡ Mock Login: Patient', query: 'LOGIN_MOCK_PATIENT' },
        { label: '🔑 Custom Login', query: 'CUSTOM_LOGIN' }
      ];
    }

    if (chatState !== 'idle') {
      return [{ label: '❌ Cancel & Restart', query: 'RESTART' }];
    }

    if (user?.role === 'super_admin') {
      return [
        { label: '📊 Show SaaS Revenue', query: 'Show SaaS revenue' },
        { label: '⏳ List Pending Approvals', query: 'List pending approvals' },
        { label: '📜 Show Audit Logs', query: 'Show audit logs' }
      ];
    }
    if (user?.role === 'clinic_owner') {
      return [
        { label: 'What is today\'s revenue?', query: 'What is today\'s revenue?' },
        { label: 'Show overdue patients', query: 'Show overdue patients' },
        { label: 'View calendar schedule', query: 'View calendar schedule' }
      ];
    }
    if (user?.role === 'dentist') {
      return [
        { label: 'Show today\'s appointments', query: 'Show today\'s appointments' },
        { label: 'View calendar', query: 'View calendar' },
        { label: 'Show patient records', query: 'Show patient records' }
      ];
    }
    if (user?.role === 'hygienist') {
      return [
        { label: 'Show recall list', query: 'Show recall list' },
        { label: 'View calendar schedule', query: 'View calendar schedule' }
      ];
    }
    if (user?.role === 'front_desk' || user?.role === 'frontdesk') {
      return [
        { label: 'Show waitlisted patients', query: 'Show waitlisted patients' },
        { label: 'Show intake queue', query: 'Show intake queue' },
        { label: 'View calendar schedule', query: 'View calendar schedule' }
      ];
    }
    if (user?.role === 'dental_assistant' || user?.role === 'assistant') {
      return [
        { label: 'Show today\'s patient checklist', query: 'Show today\'s patient checklist' },
        { label: 'Open EHR hygiene notes', query: 'Open EHR hygiene notes' }
      ];
    }
    if (user?.role === 'patient') {
      return [
        { label: 'When is my next appointment?', query: 'When is my next appointment?' },
        { label: 'View my treatment plan', query: 'View my treatment plan' },
        { label: 'View my bills', query: 'View my bills' }
      ];
    }

    return [];
  };

  const handleAsk = async (textToSend) => {
    if (!textToSend.trim()) return;

    // Display user query
    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setQuery('');
    setIsTyping(true);

    // AI typing simulation delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsTyping(false);

    let answer = "I'm sorry, I didn't quite catch that. Try choosing one of the quick options or ask a relevant question.";
    const normalized = textToSend.toLowerCase();

    // 0. RESET FLOW
    if (textToSend === 'RESTART' || normalized === 'restart') {
      setChatState('idle');
      setTempRegData({});
      setTempLoginData({});
      setPendingApprovalFlow(false);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Workflow restarted. How can I help you today?' }
      ]);
      return;
    }

    // ----------------------------------------------------
    // I. GUEST / UNAUTHENTICATED CONVERSATIONAL FLOW
    // ----------------------------------------------------
    if (!isAuthenticated) {
      // 1. Idle state transitions
      if (chatState === 'idle') {
        if (textToSend === 'REGISTER_CLINIC' || normalized.includes('register clinic') || normalized.includes('register admin')) {
          setChatState('reg_clinic_name');
          answer = "Let's get started with your Clinic Registration. First, what is the **Clinic Name**?";
        } else if (textToSend === 'REGISTER_PATIENT' || normalized.includes('register patient')) {
          setChatState('reg_patient_name');
          answer = "Let's register your Patient account. First, what is your **Full Name**?";
        } else if (textToSend === 'LOGIN_MOCK_OWNER') {
          answer = "Logging you in as default Clinic Owner (Dr. Arthur Vance)...";
          setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
          setTimeout(() => {
            setIsOpen(false);
            useAuthStore.getState().login('clinic_owner', 'clinic-1');
            toast.success('Successfully logged in as Clinic Owner');
            navigate('/clinic/dashboard');
          }, 1000);
          return;
        } else if (textToSend === 'LOGIN_MOCK_PATIENT') {
          answer = "Logging you in as default Patient (James Carter)...";
          setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
          setTimeout(() => {
            setIsOpen(false);
            useAuthStore.getState().login('patient', 'clinic-1');
            toast.success('Successfully logged in to Patient Portal');
            navigate('/patient/dashboard');
          }, 1000);
          return;
        } else if (textToSend === 'CUSTOM_LOGIN' || normalized === 'login' || normalized === 'sign in') {
          setChatState('login_email');
          answer = "Please enter your registered **Email Address**:";
        } else if (textToSend === 'APPROVE_AND_LOGIN_OWNER' && pendingApprovalFlow) {
          const registeredEmail = tempRegData.ownerEmail;
          const registeredPassword = tempRegData.ownerPassword;
          
          // Approve clinic owner user in superAdminStore
          const users = useSuperAdminStore.getState().users;
          const matched = users.find(u => u.email.toLowerCase() === registeredEmail.toLowerCase());
          if (matched) {
            useSuperAdminStore.getState().approveUser(matched.id);
            // Sign in
            const loginResult = useAuthStore.getState().loginWithCredentials(registeredEmail, registeredPassword);
            if (loginResult.success) {
              answer = `Successfully approved account and logged you in as Clinic Owner for **${tempRegData.clinicName}**! Redirecting to dashboard...`;
              setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
              setTimeout(() => {
                setIsOpen(false);
                navigate('/clinic/dashboard');
              }, 1200);
              return;
            }
          }
          answer = "Could not automatically sign in. Please try logging in manually.";
          setPendingApprovalFlow(false);
        } else {
          answer = "Hello! I can help you register a clinic or patient account, or log in. Please select an action from the menu below.";
        }
      } 
      // 2. Clinic Registration State transitions
      else if (chatState === 'reg_clinic_name') {
        setTempRegData(prev => ({ ...prev, clinicName: textToSend }));
        setChatState('reg_clinic_location');
        answer = `Got it, **${textToSend}**. What is the **Clinic Address / Location** (e.g. Seattle, WA)?`;
      } else if (chatState === 'reg_clinic_location') {
        setTempRegData(prev => ({ ...prev, location: textToSend }));
        setChatState('reg_owner_name');
        answer = `Location set to **${textToSend}**. What is the **Clinic Owner Full Name**?`;
      } else if (chatState === 'reg_owner_name') {
        setTempRegData(prev => ({ ...prev, ownerName: textToSend }));
        setChatState('reg_owner_email');
        answer = `Owner set to **${textToSend}**. What is the **Owner Email Address**?`;
      } else if (chatState === 'reg_owner_email') {
        setTempRegData(prev => ({ ...prev, ownerEmail: textToSend }));
        setChatState('reg_owner_password');
        answer = `Email set to **${textToSend}**. Please choose a **Login Password**:`;
      } else if (chatState === 'reg_owner_password') {
        const finalPassword = textToSend;
        const finalRegData = { ...tempRegData, ownerPassword: finalPassword };
        setTempRegData(finalRegData);
        setChatState('idle');
        setPendingApprovalFlow(true);

        const currentClinicsLength = useSuperAdminStore.getState().clinics.length;
        const newClinicId = `clinic-${currentClinicsLength + 1}`;

        // Save in global database stores
        useSuperAdminStore.getState().addClinic({
          id: newClinicId,
          name: finalRegData.clinicName,
          location: finalRegData.location,
          phone: '(206) 555-0100',
          plan: 'Trial',
          status: 'Trialing'
        });

        useSuperAdminStore.getState().addUser({
          name: finalRegData.ownerName,
          email: finalRegData.ownerEmail,
          role: 'clinic_owner',
          clinicId: newClinicId,
          status: 'Pending Approval',
          password: finalRegData.ownerPassword
        });

        answer = `🎉 Registration successful! Clinic **"${finalRegData.clinicName}"** has been added. Owner account **"${finalRegData.ownerName}"** is now **Pending Approval** by the Super Admin.

Credentials registered:
- **Email:** ${finalRegData.ownerEmail}
- **Password:** ${finalRegData.ownerPassword}

*For easy sandbox testing, click below to instantly approve and log in!*`;
      }
      // 3. Patient Registration State transitions
      else if (chatState === 'reg_patient_name') {
        setTempRegData(prev => ({ ...prev, patientName: textToSend }));
        setChatState('reg_patient_phone');
        answer = `Got it, **${textToSend}**. What is your **Contact Phone Number**?`;
      } else if (chatState === 'reg_patient_phone') {
        setTempRegData(prev => ({ ...prev, patientPhone: textToSend }));
        setChatState('reg_patient_email');
        answer = `Phone set to **${textToSend}**. What is your **Email Address**?`;
      } else if (chatState === 'reg_patient_email') {
        setTempRegData(prev => ({ ...prev, patientEmail: textToSend }));
        setChatState('reg_patient_password');
        answer = `Email set to **${textToSend}**. Please choose a **Login Password**:`;
      } else if (chatState === 'reg_patient_password') {
        const finalPassword = textToSend;
        const finalRegData = { ...tempRegData, patientPassword: finalPassword };
        setTempRegData(finalRegData);
        setChatState('idle');

        // Add Patient user in store (immediately Approved)
        useSuperAdminStore.getState().addUser({
          name: finalRegData.patientName,
          email: finalRegData.patientEmail,
          role: 'patient',
          clinicId: 'clinic-1',
          status: 'Approved',
          password: finalRegData.patientPassword
        });

        // Instant login
        const loginResult = useAuthStore.getState().loginWithCredentials(finalRegData.patientEmail, finalRegData.patientPassword);
        if (loginResult.success) {
          answer = `🎉 Success! Registered Patient **"${finalRegData.patientName}"** and logged you in. Redirecting to Patient Dashboard...`;
          setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
          setTimeout(() => {
            setIsOpen(false);
            navigate('/patient/dashboard');
          }, 1200);
          return;
        } else {
          answer = `Patient registered successfully! Email: ${finalRegData.patientEmail}. Try signing in manually.`;
        }
      }
      // 4. Custom Login State transitions
      else if (chatState === 'login_email') {
        setTempLoginData(prev => ({ ...prev, email: textToSend }));
        setChatState('login_password');
        answer = `Email registered: **${textToSend}**. Please enter your **Password**:`;
      } else if (chatState === 'login_password') {
        const email = tempLoginData.email;
        const password = textToSend;
        setChatState('idle');

        const result = useAuthStore.getState().loginWithCredentials(email, password);
        if (result.success) {
          answer = `Successfully signed in! Redirecting to workspace...`;
          setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
          setTimeout(() => {
            setIsOpen(false);
            // Deduce route from role
            let dashboardPath = '/';
            if (result.role === 'clinic_owner') dashboardPath = '/clinic/dashboard';
            else if (result.role === 'dentist') dashboardPath = '/dentist/dashboard';
            else if (result.role === 'hygienist') dashboardPath = '/hygienist/dashboard';
            else if (result.role === 'front_desk' || result.role === 'frontdesk') dashboardPath = '/frontdesk/dashboard';
            else if (result.role === 'billing_staff') dashboardPath = '/billing';
            else if (result.role === 'dental_assistant' || result.role === 'assistant') dashboardPath = '/assistant/patients';
            else if (result.role === 'lab_coordinator') dashboardPath = '/lab/cases';
            else if (result.role === 'patient') dashboardPath = '/patient/dashboard';
            else if (result.role === 'super_admin') dashboardPath = '/super-admin/dashboard';
            
            navigate(dashboardPath);
          }, 1000);
          return;
        } else {
          answer = `❌ Login failed: ${result.error || 'Invalid credentials'}. Try choosing a mock Select Profile, or select 'Restart' to try again.`;
        }
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
      return;
    }

    // ----------------------------------------------------
    // II. AUTHENTICATED ROLE-BASED CONVERSATIONAL FLOW
    // ----------------------------------------------------
    const userRole = user.role;

    // 1. Super Admin Role
    if (userRole === 'super_admin') {
      if (normalized.includes('revenue') || normalized.includes('money') || normalized.includes('fee')) {
        answer = "Monthly recurring SaaS revenue is **$1,097** across 4 active clinics. Current Active Plans: Basic (1), Premium (1), Enterprise (1), Trial (1).";
      } else if (normalized.includes('approve') || normalized.includes('pending') || normalized.includes('users')) {
        const pending = useSuperAdminStore.getState().users.filter(u => u.status === 'Pending Approval');
        if (pending.length > 0) {
          answer = `Found ${pending.length} pending registration(s):\n${pending.map((u, i) => `${i + 1}. **${u.name}** (${u.email})`).join('\n')}\n\nYou can manage and approve them inside the **User Management** panel.`;
        } else {
          answer = "There are no pending registrations awaiting approval at the moment.";
        }
      } else if (normalized.includes('log') || normalized.includes('audit') || normalized.includes('activity')) {
        answer = "Recent platform activities audit log:\n- Sarah Jenkins upgraded Apex Orthodontics to Premium Plan\n- Enabled AI Diagnosis Module for Metropolitan Dental\n- Registered new clinic branch location: Westside Pediatric Dental";
      } else {
        answer = "Hello Sarah! Ask me about SaaS collections, licensing logs, or listing pending owner accounts.";
      }
    } 
    // 2. Clinic Owner Role
    else if (userRole === 'clinic_owner') {
      if (normalized.includes('revenue') || normalized.includes('money') || normalized.includes('earning')) {
        answer = "Today's revenue collections total **$5,800**. Outstanding unpaid invoices: **$8,450**. Cash flow stability is healthy at 84%.";
      } else if (normalized.includes('overdue') || normalized.includes('recall') || normalized.includes('hygiene')) {
        answer = "Directing you to the AI Recall Campaign Dashboard. We found 24 patients overdue for standard hygiene prophylaxis checks ($4,800 estimated opportunity).";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/communication/ai-recall');
          toast.info('AI Recall Dashboard loaded.');
        }, 1000);
        return;
      } else if (normalized.includes('calendar') || normalized.includes('appointment') || normalized.includes('schedule')) {
        answer = "Directing you to the Smart Calendar Scheduler... High probability patients waitlist suggestion cards loaded for empty slots.";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/appointments/calendar');
          toast.info('AI Smart Calendar Scheduler loaded.');
        }, 1000);
        return;
      } else if (normalized.includes('hello') || normalized.includes('hi')) {
        answer = `Hello, Dr. Vance! Ready to audit today's operations. Try asking 'What is today's revenue?' or click 'Show overdue patients'.`;
      }
    }
    // 3. Dentist Role
    else if (userRole === 'dentist') {
      if (normalized.includes('appointment') || normalized.includes('today') || normalized.includes('schedule')) {
        answer = "You have **4 appointments** scheduled today. Your next patient is **James Carter** for Teeth Cleaning at 09:00 AM.";
      } else if (normalized.includes('calendar') || normalized.includes('view calendar')) {
        answer = "Navigating you to the appointments calendar scheduler...";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/appointments/calendar');
        }, 1000);
        return;
      } else if (normalized.includes('record') || normalized.includes('patient') || normalized.includes('chart')) {
        answer = "Navigating to dentist patients directory...";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/dentist/patients');
        }, 1000);
        return;
      }
    }
    // 4. Hygienist Role
    else if (userRole === 'hygienist') {
      if (normalized.includes('recall') || normalized.includes('hygiene') || normalized.includes('list')) {
        answer = "Opening the hygiene recall and outreaches campaign dashboard...";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/hygienist/recall');
        }, 1000);
        return;
      } else if (normalized.includes('calendar') || normalized.includes('appointment')) {
        answer = "Opening preventive appointments calendar...";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/appointments/calendar');
        }, 1000);
        return;
      }
    }
    // 5. Front Desk Receptionist Role
    else if (userRole === 'front_desk' || userRole === 'frontdesk') {
      if (normalized.includes('waitlist') || normalized.includes('waitlisted')) {
        answer = "There are **2 waitlisted patients** matching slots. Patient Zaphod Beeblebrox requires a Root Canal. Directing you to waitlist dashboard...";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/frontdesk/waitlist');
        }, 1000);
        return;
      } else if (normalized.includes('intake') || normalized.includes('queue') || normalized.includes('dashboard')) {
        answer = "Redirecting you to the Front Desk Reception Intake Queue...";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/frontdesk/dashboard');
        }, 1000);
        return;
      } else if (normalized.includes('calendar') || normalized.includes('appointment') || normalized.includes('schedule')) {
        answer = "Opening scheduler view...";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/appointments/calendar');
        }, 1000);
        return;
      }
    }
    // 6. Dental Assistant Role
    else if (userRole === 'dental_assistant' || userRole === 'assistant') {
      if (normalized.includes('checklist') || normalized.includes('today') || normalized.includes('patient')) {
        answer = "You have **3 patient checklists** in progress. Redirecting you to assistant patient tracking board...";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/assistant/patients');
        }, 1000);
        return;
      } else if (normalized.includes('note') || normalized.includes('ehr') || normalized.includes('clinical')) {
        answer = "Redirecting you to the Patients directory to review notes...";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/assistant/patients');
        }, 1000);
        return;
      }
    }
    // 7. Patient Role
    else if (userRole === 'patient') {
      if (normalized.includes('appointment') || normalized.includes('next') || normalized.includes('when')) {
        answer = "Your next scheduled visit is a **Teeth Cleaning** with **Dr. Michael Chen** on **2026-06-08 at 09:00 AM**.";
      } else if (normalized.includes('treatment') || normalized.includes('plan')) {
        answer = "Opening active dental treatments timeline details...";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/patient/treatment');
        }, 1000);
        return;
      } else if (normalized.includes('bill') || normalized.includes('invoice') || normalized.includes('pay')) {
        answer = "Directing you to active invoices statements screen...";
        setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/patient/billing');
        }, 1000);
        return;
      }
    }

    setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Panel Drawer */}
      {isOpen && (
        <div className="w-80 md:w-96 h-[460px] bg-card border border-border shadow-2xl rounded-2xl flex flex-col mb-4 overflow-hidden animate-fade-in relative backdrop-blur-md">
          {/* Header */}
          <div className="bg-primary p-4 text-primary-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 fill-current animate-pulse" />
              <div>
                <h4 className="font-extrabold text-xs">HMS Clinical Copilot</h4>
                <p className="text-[10px] opacity-85">{isAuthenticated ? `Online · Role: ${user?.role.toUpperCase()}` : 'Guest Mode · Setup & Login'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed font-semibold no-scrollbar"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-3 whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'bg-muted text-foreground font-medium border border-border/60'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground rounded-xl px-3 py-2 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="px-4 py-2 border-t border-border bg-muted/30 flex gap-2 overflow-x-auto no-scrollbar shrink-0 select-none">
            {getQuickActions().map((act) => (
              <button
                key={act.label}
                onClick={() => handleAsk(act.query)}
                className="px-2.5 py-1.5 bg-card hover:bg-muted border border-border rounded-lg text-[9px] font-bold text-foreground cursor-pointer transition-colors whitespace-nowrap"
              >
                {act.label}
              </button>
            ))}
            {pendingApprovalFlow && (
              <button
                onClick={() => handleAsk('APPROVE_AND_LOGIN_OWNER')}
                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-bold cursor-pointer transition-colors whitespace-nowrap"
              >
                👍 Approve & Login Now
              </button>
            )}
          </div>

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="p-3 border-t border-border flex items-center gap-2 bg-card"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={chatState === 'idle' ? "Ask Copilot..." : "Reply to AI..."}
              className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none text-foreground"
            />
            <button
              type="submit"
              className="p-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button triggers */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 cursor-pointer relative group transition-transform z-50 select-none animate-bounce"
        title="Open AI Clinical Copilot"
      >
        {/* Animated pulse ring */}
        <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping pointer-events-none" />
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6 fill-current animate-pulse" />}
      </button>
    </div>
  );
}

export default AICopilotWidget;
