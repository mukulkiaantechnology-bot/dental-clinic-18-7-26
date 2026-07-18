import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Cpu,
  TrendingUp,
  ArrowRight,
  Check,
  Sun,
  Moon,
  Database,
  Lock,
  Globe,
  Server,
  BarChart3,
  Play
} from 'lucide-react';
import { useSuperAdminStore } from '../../store/superAdminStore';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';

export function LandingPage() {
  const navigate = useNavigate();
  const plans = useSuperAdminStore((state) => state.plans);
  const fetchPlans = useSuperAdminStore((state) => state.fetchPlans);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('hms_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('hms_theme', theme);
  }, [theme]);

  // Mobile Sticky bottom state listener
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowStickyCTA(true);
      } else {
        setShowStickyCTA(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // AI Features list
  const aiFeatures = [
    {
      title: 'AI Radiology Detection',
      desc: 'Automatic bone loss and caries check with deep learning pixel audit.',
      icon: Cpu,
      color: 'text-indigo-500 bg-indigo-500/10'
    },
    {
      title: 'Patient Risk Scoring (0–100)',
      desc: 'Perio deterioration analytics mapped dynamically in patient profiles.',
      icon: Activity,
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      title: 'Revenue Forecasting',
      desc: 'Predict monthly payment trends based on scheduled treatment stages.',
      icon: TrendingUp,
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      title: 'Treatment Gap Detection',
      desc: 'Highlight pending clinical proposals missing in appointments queue.',
      icon: BarChart3,
      color: 'text-rose-500 bg-rose-500/10'
    },
    {
      title: 'Lab Delay Prediction',
      desc: 'Alert coordinators of prosthesis delivery log jams before check-in.',
      icon: Server,
      color: 'text-cyan-500 bg-cyan-500/10'
    }
  ];

  // Mock dashboard analytics data
  const revenueData = [120, 150, 180, 160, 210, 245];
  const heatmapHours = ['09:00', '11:00', '13:00', '15:00', '17:00'];
  const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-foreground transition-colors duration-300 overflow-x-hidden select-none font-sans relative">

      {/* Decorative blurred background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-200px] left-1/4 w-[700px] h-[700px] bg-primary/15 rounded-full blur-3xl animate-pulse duration-10000" />
        <div className="absolute top-[800px] right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-[1600px] left-1/3 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse duration-[8000ms]" />
      </div>

      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-[#f8fafc]/80 dark:bg-[#090d16]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-md flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent uppercase">
              HMS CoreSaaS
            </span>
          </div>

          {/* Links for desktop */}
          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <a href="#features" className="hover:text-foreground transition-colors">Platform Features</a>
            <a href="#dashboard" className="hover:text-foreground transition-colors">Preview UI</a>
            <a href="#ai-intelligence" className="hover:text-foreground transition-colors">AI Diagnostics</a>
            <a href="#network" className="hover:text-foreground transition-colors">Network Map</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing Options</a>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme switcher control */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="font-bold text-xs h-9 px-4 hover:bg-secondary cursor-pointer"
            >
              Sign In
            </Button>

            <Button
              onClick={() => navigate('/register')}
              className="font-bold text-xs h-9 px-4 gap-1 rounded-xl cursor-pointer"
            >
              Register Clinic
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center space-y-8 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4" />
          Global Multi-Clinic Control Console for Healthcare SaaS
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.05] max-w-5xl mx-auto">
          Next-Generation SaaS for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Multi-Clinic Healthcare Networks
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl mx-auto font-bold leading-relaxed">
          Unify patient records, AI diagnostics, billing, lab tracking, and clinic analytics across unlimited locations in real-time.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <Button
            onClick={() => navigate('/login')}
            size="lg"
            className="w-full sm:w-auto font-extrabold gap-2 text-xs px-6 h-12 rounded-xl cursor-pointer shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            🚀 Access System Sandbox
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => navigate('/register')}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto font-extrabold text-xs px-6 h-12 rounded-xl cursor-pointer hover:bg-secondary"
          >
            🏥 Register Clinic Location
          </Button>
        </div>

        {/* Floating KPI Cards Grid inside Hero Area */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-12">
          {[
            { label: 'Total Clinics Connected', val: '142', sub: '+12 this month', color: 'border-t-blue-500' },
            { label: 'Active Patients', val: '12,840', sub: 'Real-time synced', color: 'border-t-emerald-500' },
            { label: 'AI Diagnoses Generated', val: '89,431', sub: '99.8% precision', color: 'border-t-purple-500' },
            { label: 'Monthly Revenue', val: '$245,600', sub: '+18.4% YoY', color: 'border-t-indigo-500' }
          ].map((kpi, idx) => (
            <div
              key={idx}
              className={`bg-card/40 backdrop-blur-md border border-border border-t-4 p-5 rounded-2xl shadow-xs text-left hover:-translate-y-1 transition-all duration-300 ${kpi.color}`}
            >
              <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block">{kpi.label}</span>
              <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1.5">{kpi.val}</h3>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Section 2 */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border/60">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">One Platform. Unlimited Clinics. Zero Chaos.</h2>
          <p className="text-xs text-muted-foreground font-bold">Everything you need to orchestrate global operations from a single pane of glass.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {/* Card 1: Visual Odontogram */}
          <div className="group bg-card/40 backdrop-blur-md border border-border rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-primary/40 transition-all duration-500 flex flex-col justify-between hover:scale-[1.02] cursor-pointer animate-slide-up">
            <div className="p-6 text-left space-y-3">
              <div className="h-10 w-10 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center">
                <Globe className="h-5 w-5 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors">Visual Odontogram Charting</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                An interactive 32-teeth visual interface tracking restorative work, crowns, cavity scans, and custom implant cases synced across dental networks.
              </p>
            </div>
            <div className="px-6 pb-6 pt-2 overflow-hidden h-48 relative">
              <img src="/dental_charting.png" alt="Odontogram Charting" className="rounded-xl object-cover w-full h-full border border-border/60 shadow-xs transition-transform duration-500 group-hover:scale-105" />
            </div>
          </div>

          {/* Card 2: AI Radiology */}
          <div className="group bg-card/40 backdrop-blur-md border border-border rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-primary/40 transition-all duration-500 flex flex-col justify-between hover:scale-[1.02] cursor-pointer animate-slide-up delay-100">
            <div className="p-6 text-left space-y-3">
              <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                <Cpu className="h-5 w-5 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors">AI Radiology Diagnostics</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                Computer-vision driven X-ray scanning detecting caries, bone loss, and periodontal issues automatically, complete with instant dashboard alerts.
              </p>
            </div>
            <div className="px-6 pb-6 pt-2 overflow-hidden h-48 relative">
              <img src="/dental_xray_ai.png" alt="AI Radiology Diagnostics" className="rounded-xl object-cover w-full h-full border border-border/60 shadow-xs transition-transform duration-500 group-hover:scale-105" />
            </div>
          </div>

          {/* Card 3: Enterprise Hub */}
          <div className="group bg-card/40 backdrop-blur-md border border-border rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-primary/40 transition-all duration-500 flex flex-col justify-between hover:scale-[1.02] cursor-pointer animate-slide-up delay-200">
            <div className="p-6 text-left space-y-3">
              <div className="h-10 w-10 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center">
                <Activity className="h-5 w-5 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors">Multi-Clinic Enterprise Hub</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                Consolidated control panel for multi-office practice groups. Standardize schedules, monitor dental lab crown workflows, and run global billing.
              </p>
            </div>
            <div className="px-6 pb-6 pt-2 overflow-hidden h-48 relative">
              <img src="/dental_dashboard.png" alt="Multi-Clinic Enterprise Hub" className="rounded-xl object-cover w-full h-full border border-border/60 shadow-xs transition-transform duration-500 group-hover:scale-105" />
            </div>
          </div>
        </div>
      </section>

      {/* Live Dashboard Preview Section 6 */}
      <section id="dashboard" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border/60">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Platform Performance Dashboard</h2>
          <p className="text-xs text-muted-foreground font-bold">Experience the speed, detail, and control designed for leading enterprise health networks.</p>
        </div>

        {/* Mock browser container */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative text-left">
          {/* Header toolbar */}
          <div className="bg-muted/60 px-4 py-3 border-b border-border flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div className="mx-auto bg-card border border-border px-8 py-1 rounded-lg text-[9px] font-black text-muted-foreground select-none max-w-xs truncate">
              https://console.hmscoresaas.com/clinic-1/dashboard
            </div>
          </div>

          {/* Inner view */}
          <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[500px]">
            {/* Sidebar */}
            <div className="lg:col-span-1 border-r border-border bg-card/60 p-4 space-y-6 hidden lg:block text-xs font-bold text-muted-foreground">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Workspace</span>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-foreground bg-muted p-2 rounded-lg"><Activity className="h-4 w-4 text-primary" /> Analytics</li>
                <li className="flex items-center gap-2 hover:text-foreground p-2 rounded-lg cursor-pointer"><Database className="h-4 w-4" /> Patient Records</li>
                <li className="flex items-center gap-2 hover:text-foreground p-2 rounded-lg cursor-pointer"><TrendingUp className="h-4 w-4" /> Lab Case Tracker</li>
                <li className="flex items-center gap-2 hover:text-foreground p-2 rounded-lg cursor-pointer"><Server className="h-4 w-4" /> System Control</li>
              </ul>
            </div>

            {/* Content view */}
            <div className="lg:col-span-3 p-6 space-y-6 bg-muted/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Revenue mock chart */}
                <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Revenue Forecast Trends</span>
                    <Badge variant="success">Live</Badge>
                  </div>
                  <div className="flex items-end justify-between h-32 pt-4">
                    {revenueData.map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-5 bg-gradient-to-t from-primary to-indigo-500 rounded-t-md hover:opacity-85 transition-all" style={{ height: `${(val / 250) * 100}%` }} />
                        <span className="text-[8px] font-black text-muted-foreground">M{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scheduling heatmap */}
                <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Appointment Load Heatmap</span>
                  <div className="grid grid-cols-6 gap-1.5 pt-1 text-[8px] font-bold text-center">
                    <span />
                    {heatmapDays.map((d) => <span key={d} className="text-muted-foreground">{d}</span>)}

                    {heatmapHours.map((hr, idx) => (
                      <React.Fragment key={hr}>
                        <span className="text-muted-foreground">{hr}</span>
                        {heatmapDays.map((d, dIdx) => {
                          const intensity = (idx + dIdx) % 3;
                          return (
                            <span
                              key={`${hr}-${d}`}
                              className={`aspect-square rounded-md border border-border/40 ${intensity === 2
                                  ? 'bg-primary'
                                  : intensity === 1
                                    ? 'bg-primary/50'
                                    : 'bg-primary/10'
                                }`}
                            />
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Alerts Feed mock */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Real-Time AI Clinical Alerts</span>
                <div className="space-y-2">
                  {[
                    { type: 'Radiology Alert', details: 'Distal caries detected on tooth #14. Conf: 94%.', action: 'Verify Chart', time: '2m ago' },
                    { type: 'Recall Delay Risk', details: 'Patient Mary Watson recall SMS overdue by 4 days.', action: 'Dispatch SMS', time: '12m ago' }
                  ].map((alert, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 border border-border/60 rounded-xl flex items-center justify-between text-xs leading-normal">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-1.5 rounded-lg text-indigo-500">
                          <Cpu className="h-4 w-4" />
                        </div>
                        <div>
                          <strong className="text-foreground text-[11px] block">{alert.type}</strong>
                          <span className="text-muted-foreground text-[10px] font-semibold">{alert.details}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[8px] font-bold text-muted-foreground">{alert.time}</span>
                        <span className="text-[9px] font-black text-primary hover:underline cursor-pointer">{alert.action} &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section 4 */}
      <section id="ai-intelligence" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border/60">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2 space-y-6 text-left">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <Cpu className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Cognitive Intelligence for Clinic Operations</h2>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              CoreSaaS embeds visual diagnostics models, predictive finance systems, and recall automations directly into existing dental chart workflows.
            </p>
            <div className="pt-2">
              <Button onClick={() => navigate('/login')} className="font-bold text-xs gap-1.5 rounded-xl cursor-pointer">
                <Play className="h-3.5 w-3.5 fill-current" />
                See AI in Action
              </Button>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aiFeatures.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-card border border-border p-5 rounded-2xl shadow-xs hover:border-primary/20 transition-all text-left flex flex-col justify-between"
                >
                  <div>
                    <div className={`h-9 w-9 ${feat.color} rounded-xl flex items-center justify-center mb-3`}>
                      <IconComp className="h-4.5 w-4.5" />
                    </div>
                    <h4 className="font-extrabold text-xs text-foreground mb-1">{feat.title}</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Multi-Clinic Network Section 5 */}
      <section id="network" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border/60">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Global SaaS System Interconnectivity</h2>
          <p className="text-xs text-muted-foreground font-bold">100+ clinics connected. Real-time synchronization. Central admin dashboard.</p>
        </div>

        {/* Node Network Map (Visual SVG representation) */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden h-[300px] sm:h-[400px] flex items-center justify-center relative bg-muted/10">
          <svg className="w-full h-full max-w-4xl opacity-80" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* World Map Lines outlines mock */}
            <path d="M100 150 C200 120, 300 180, 400 140 C500 100, 600 200, 700 160" stroke="var(--border)" strokeWidth="2" strokeDasharray="5 5" />
            <path d="M150 250 C250 220, 350 280, 450 240 C550 200, 650 300, 750 260" stroke="var(--border)" strokeWidth="2" strokeDasharray="5 5" />
            <path d="M200 100 L200 300 M400 100 L400 300 M600 100 L600 300" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 2" />

            {/* Central Dashboard Node */}
            <g className="cursor-pointer">
              <circle cx="400" cy="200" r="30" className="fill-primary/20 stroke-primary stroke-2" />
              <circle cx="400" cy="200" r="10" className="fill-primary" />
              <text x="400" y="250" textAnchor="middle" className="fill-foreground text-[10px] font-black tracking-wider uppercase">HQ Central Console</text>
            </g>

            {/* Clinic Nodes */}
            {[
              { cx: 200, cy: 120, label: 'Seattle Clinic' },
              { cx: 600, cy: 140, label: 'Boston Clinic' },
              { cx: 220, cy: 280, label: 'SF Office' },
              { cx: 580, cy: 270, label: 'Miami Office' },
              { cx: 410, cy: 80, label: 'Chicago HQ' },
              { cx: 390, cy: 320, label: 'Austin Clinic' }
            ].map((node, idx) => (
              <g key={idx} className="cursor-pointer group">
                {/* Connector lines to central console */}
                <line x1="400" y1="200" x2={node.cx} y2={node.cy} className="stroke-primary/30 stroke-1 group-hover:stroke-primary transition-all duration-300" />
                {/* Node circle */}
                <circle cx={node.cx} cy={node.cy} r="15" className="fill-indigo-500/10 stroke-indigo-500/30 stroke-2 group-hover:fill-indigo-500/20 group-hover:stroke-indigo-500 transition-all" />
                <circle cx={node.cx} cy={node.cy} r="5" className="fill-indigo-500 animate-ping" />
                <circle cx={node.cx} cy={node.cy} r="4" className="fill-indigo-500" />
                {/* Text Label */}
                <text x={node.cx} y={node.cy - 22} textAnchor="middle" className="fill-muted-foreground text-[8px] font-bold group-hover:fill-foreground transition-all">{node.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </section>

      {/* Pricing Section 3 */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border/60">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Flexible Multi-Clinic Licensing</h2>
          <p className="text-xs text-muted-foreground font-bold">Scaling structures configured live for medical groups and independent dental offices.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-card/40 backdrop-blur-md border p-8 rounded-3xl shadow-sm relative flex flex-col justify-between hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 ${plan.name === 'Premium' ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-border'
                }`}
            >
              {plan.name === 'Premium' && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-widest">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-foreground">{plan.name}</h3>
                  <span className={`text-[9px] font-bold inline-block px-2.5 py-0.5 rounded-full mt-1.5 uppercase ${plan.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-muted text-muted-foreground'
                    }`}>
                    {plan.status} CONFIG
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">${plan.fee}</span>
                  <span className="text-xs text-muted-foreground font-semibold">/ {plan.billingPeriod.toLowerCase()}</span>
                </div>

                <div className="h-px bg-border my-2" />

                <ul className="space-y-2.5 text-xs text-muted-foreground font-bold text-left">
                  {plan.features.split(',').map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span>{feat.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Button
                  onClick={() => navigate(`/register?plan=${plan.name}`)}
                  variant={plan.name === 'Premium' ? 'primary' : 'outline'}
                  className="w-full font-bold text-xs py-5 cursor-pointer rounded-xl"
                >
                  Get Started
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security & Trust Section 7 */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border/60">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: 'Role-Based Control', desc: 'Secure workspaces for coordinators, assistants, dentists and billing staffs.', icon: Lock },
            { title: 'Encrypted Patient Data', desc: 'Full TLS and AES-256 databases encryption protocols built by default.', icon: Database },
            { title: 'Multi-Tenant Shield', desc: 'Complete client databases isolation prevents tenant cross-leaks.', icon: Server },
            { title: 'HIPAA & GDPR Ready', desc: 'Strict regulatory guidelines compliance records audited constantly.', icon: ShieldCheck }
          ].map((trust, idx) => {
            const Icon = trust.icon;
            return (
              <div key={idx} className="bg-card/30 border border-border/60 p-5 rounded-2xl shadow-xs text-left space-y-2.5">
                <div className="h-8 w-8 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="font-extrabold text-xs text-foreground">{trust.title}</h4>
                <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">{trust.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center bg-card border border-border rounded-3xl shadow-sm mb-20 overflow-hidden mx-4 sm:mx-auto">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-6 max-w-2xl mx-auto relative z-10">
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Ready to Modernize Your Clinic Network?</h2>
          <p className="text-xs text-muted-foreground leading-relaxed font-bold">
            Join hundreds of healthcare practices running on our healthcare intelligence SaaS platform. Set up locations, track cases, and audit diagnostics today.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate('/register')} size="lg" className="font-extrabold text-xs h-11 px-6 rounded-xl cursor-pointer">
              Create Clinic Profile
            </Button>
            <Button onClick={() => navigate('/login')} size="lg" variant="ghost" className="font-extrabold text-xs h-11 px-6 rounded-xl cursor-pointer hover:bg-secondary">
              Launch Workspace
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-border/40 text-center text-[10px] text-muted-foreground font-semibold">
        &copy; {new Date().getFullYear()} HMS CoreSaaS Platform. All rights reserved. Sandboxed development console.
      </footer>

      {/* Mobile Sticky bottom CTA bar */}
      {showStickyCTA && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t border-border py-3 px-4 flex items-center justify-between md:hidden animate-fade-in shadow-lg">
          <div>
            <span className="text-[8px] font-black uppercase text-primary tracking-widest">HMS CoreSaaS</span>
            <span className="text-[10px] font-bold text-foreground block truncate max-w-[150px]">Multi-Clinic Console</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/register')}
              className="px-3.5 py-2 bg-primary text-primary-foreground font-extrabold text-[10px] rounded-lg cursor-pointer"
            >
              Register Clinic
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-2 bg-secondary text-foreground border border-border font-extrabold text-[10px] rounded-lg cursor-pointer"
            >
              Access Sandbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
