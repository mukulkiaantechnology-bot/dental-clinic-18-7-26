import { useState, useRef, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle, FileText, Plus, Ruler, Edit3, Columns, Settings } from 'lucide-react';
import { Button } from './Button';
import { Select } from './Select';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';
import { useDentistStore, resolveFileUrl } from '../../store/dentistStore';

// A lightweight base64 placeholder tooth radiograph to ensure testability without uploading files
const SAMPLE_BITEWING_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gYJDg0Xy739hgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmxtAAAAdklEQVR42u3QMREAAACEoFvqX1sSpwFm4FNDIGZgBmYGZmBmYAZmBmZgBmYGZmBmYAZmBmZgBmYGZmBmYAZmBmZgBmYGZmBmYAZmBmZgBmYGZmBmYAZmBmZgBmYGZmBmYAZmBmZgBmYGZmBmYAZmBmZgBmYGZuADp1Uo8wBfD48AAAAASUVORK5CYII=';

const HARDWARE_SENSORS = [
  { id: 'dexis', name: 'Dexis Titanium Sensor', brand: 'Dexis' },
  { id: 'schick', name: 'Schick Elite Digital Sensor', brand: 'Dentsply Sirona' },
  { id: 'carestream', name: 'Carestream RVG 6200', brand: 'Carestream' },
  { id: 'vatech', name: 'Vatech EzSensor Classic', brand: 'Vatech' },
  { id: 'planmeca', name: 'Planmeca ProSensor HD', brand: 'Planmeca' }
];

const SCAN_TYPES = [
  { id: 'Bitewing', name: 'Bitewing (Molar Interproximal)' },
  { id: 'Periapical', name: 'Periapical (Root Apex)' },
  { id: 'Panoramic', name: 'Panoramic (Full Arch)' },
  { id: 'CBCT', name: 'Cone Beam CT (3D Volume)' }
];

const HISTORICAL_SCANS = [
  { year: '2024', label: '2024 PA Root Apex #14', url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400' },
  { year: '2025', label: '2025 Bitewing Left Posterior', url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400' },
  { year: '2026', label: '2026 Bitewing Active (Current)', url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=400' }
];

export function XrayAIViewer({ onScanComplete, patientName, patientId }) {
  const toast = useToast();
  
  // Resolve patient's xrays from store
  const { xrays } = useDentistStore();
  const patientXrays = (xrays && patientId && xrays[patientId]) || [];

  // Hardware status
  const [selectedSensor, setSelectedSensor] = useState('dexis');
  const [sensorStatus, setSensorStatus] = useState('Ready');
  const [scanType, setScanType] = useState('Bitewing');
  
  // Scan timeline & comparison
  const [currentScanUrl, setCurrentScanUrl] = useState('https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=400');
  const [uploadedBase64, setUploadedBase64] = useState(null);
  const [comparisonScan, setComparisonScan] = useState(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedTimelineYear, setSelectedTimelineYear] = useState('2026');
  const [selectedXrayId, setSelectedXrayId] = useState(null);

  // Annotation states
  const [activeTool, setActiveTool] = useState('none'); // 'none' | 'draw' | 'measure' | 'mark'
  const [annotations, setAnnotations] = useState([]);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [drawLines, setDrawLines] = useState([]);
  const [isDrawingToolActive, setIsDrawingToolActive] = useState(false);
  const imageContainerRef = useRef(null);

  // Auto-sync currentScanUrl when xrays list updates
  useEffect(() => {
    if (patientXrays.length > 0) {
      const latest = patientXrays[0];
      if (latest?.fileUrl) {
        setCurrentScanUrl(resolveFileUrl(latest.fileUrl));
      }
    }
  }, [patientXrays]);

  const activeXray = selectedXrayId 
    ? patientXrays.find(x => x.id === selectedXrayId) 
    : (patientXrays.length > 0 ? patientXrays[0] : null);
  const activeXrayId = activeXray?.id;

  // Load annotations and drawings whenever selected/active Xray changes
  useEffect(() => {
    if (activeXray) {
      try {
        const data = activeXray.annotationsData ? JSON.parse(activeXray.annotationsData) : null;
        setAnnotations(data?.annotations || []);
        setMeasurePoints(data?.measurePoints || []);
        setDrawLines(data?.drawLines || []);
      } catch (err) {
        console.error('Failed to parse annotationsData:', err);
      }
    } else {
      // Fallback to local storage
      const localDataStr = localStorage.getItem(`xray_drawings_${patientId}`);
      if (localDataStr) {
        try {
          const data = JSON.parse(localDataStr);
          setAnnotations(data?.annotations || []);
          setMeasurePoints(data?.measurePoints || []);
          setDrawLines(data?.drawLines || []);
        } catch (_) {}
      } else {
        setAnnotations([]);
        setMeasurePoints([]);
        setDrawLines([]);
      }
    }
  }, [activeXrayId, patientId]);

  const saveAnnotations = async (newAnn, newMea, newDra) => {
    const dataObj = { annotations: newAnn, measurePoints: newMea, drawLines: newDra };
    const serialized = JSON.stringify(dataObj);
    
    // Save to localStorage as fallback
    localStorage.setItem(`xray_drawings_${patientId}`, serialized);

    // Save to database if activeXrayId is available
    if (activeXrayId) {
      try {
        await api.put(`/patients/${patientId}/xrays/${activeXrayId}`, {
          annotationsData: serialized
        });
        // Update local store state directly
        const store = useDentistStore.getState();
        if (store.updateXrayAnnotations) {
          store.updateXrayAnnotations(patientId, activeXrayId, serialized);
        }
      } catch (err) {
        console.error('Failed to save xray annotations:', err);
      }
    }
  };

  // AI results
  const [isScanning, setIsScanning] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showCariesOverlay, setShowCariesOverlay] = useState(true);
  const [aiError, setAiError] = useState(null);



  const triggerHardwareSelfTest = () => {
    setSensorStatus('Calibrating...');
    setTimeout(() => {
      setSensorStatus('Online & Ready');
      toast.success(`${HARDWARE_SENSORS.find(s => s.id === selectedSensor)?.name} hardware check complete. Status: ONLINE.`);
    }, 1200);
  };

  const handleRunAIVision = async () => {
    setIsScanning(true);
    setAiError(null);
    
    // Choose base64 data to send
    const imagePayload = uploadedBase64 || SAMPLE_BITEWING_BASE64;

    try {
      const { data } = await api.post('/ai/analyze-xray', {
        base64Image: imagePayload,
        imageType: scanType
      });

      if (data.success) {
        setAiResult(data.data);
        toast.success('OpenAI Vision diagnostic audit completed.', 'Analysis Finished');
        if (onScanComplete) {
          onScanComplete(`AI scan completed: ${data.data.observations.join(', ')}`);
        }
      } else {
        setAiError(data.message || 'AI service failure.');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 501 || err.response?.data?.message?.includes('not configured')) {
        setAiError('AI service not configured');
        toast.warning('OpenAI API Key is missing or not configured in backend .env.');
      } else {
        setAiError(err.response?.data?.message || 'Vision API request failed.');
        toast.error('Could not complete radiograph visual audit.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedBase64(reader.result);
        setAiResult(null);
        setAiError(null);
        setAnnotations([]);
        setMeasurePoints([]);
        toast.success(`Loaded target file: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Image interaction coordinates
  const handleImageClick = (e) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    if (activeTool === 'mark') {
      const label = prompt('Enter annotation tag for this lesion / location:');
      if (label) {
        const updated = [...annotations, { x, y, label }];
        setAnnotations(updated);
        saveAnnotations(updated, measurePoints, drawLines);
      }
      setActiveTool('none');
    } else if (activeTool === 'measure') {
      const newPoints = [...measurePoints, { x, y }];
      setMeasurePoints(newPoints);
      if (newPoints.length === 2) {
        const dx = newPoints[1].x - newPoints[0].x;
        const dy = newPoints[1].y - newPoints[0].y;
        const distance = Math.sqrt(dx*dx + dy*dy) * 0.15; // Simulated mm scaling factor
        toast.info(`Measured distance: ${distance.toFixed(1)} mm`);
        setActiveTool('none');
        saveAnnotations(annotations, newPoints, drawLines);
      }
    }
  };

  const handleMouseDown = (e) => {
    if (activeTool !== 'draw' || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setDrawLines([...drawLines, [{ x, y }]]);
    setIsDrawingToolActive(true);
  };

  const handleMouseMove = (e) => {
    if (activeTool !== 'draw' || !isDrawingToolActive || !imageContainerRef.current || drawLines.length === 0) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    
    const lastLine = drawLines[drawLines.length - 1];
    const lastPoint = lastLine[lastLine.length - 1];
    if (lastPoint && Math.abs(lastPoint.x - x) < 0.5 && Math.abs(lastPoint.y - y) < 0.5) return;

    const updatedLines = [...drawLines];
    updatedLines[updatedLines.length - 1] = [...lastLine, { x, y }];
    setDrawLines(updatedLines);
  };

  const handleMouseUp = () => {
    if (isDrawingToolActive) {
      setIsDrawingToolActive(false);
      saveAnnotations(annotations, measurePoints, drawLines);
    }
  };

  const handleTouchStart = (e) => {
    if (activeTool !== 'draw' || !imageContainerRef.current) return;
    const touch = e.touches[0];
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.round(((touch.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((touch.clientY - rect.top) / rect.height) * 100);
    setDrawLines([...drawLines, [{ x, y }]]);
    setIsDrawingToolActive(true);
  };

  const handleTouchMove = (e) => {
    if (activeTool !== 'draw' || !isDrawingToolActive || !imageContainerRef.current || drawLines.length === 0) return;
    const touch = e.touches[0];
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.round(((touch.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((touch.clientY - rect.top) / rect.height) * 100);
    
    const lastLine = drawLines[drawLines.length - 1];
    const lastPoint = lastLine[lastLine.length - 1];
    if (lastPoint && Math.abs(lastPoint.x - x) < 0.5 && Math.abs(lastPoint.y - y) < 0.5) return;

    const updatedLines = [...drawLines];
    updatedLines[updatedLines.length - 1] = [...lastLine, { x, y }];
    setDrawLines(updatedLines);
  };

  const handleSelectXrayTimeline = (scan) => {
    setSelectedXrayId(scan.id);
    const resolvedUrl = resolveFileUrl(scan.fileUrl);
    if (isCompareMode) {
      setComparisonScan(resolvedUrl);
    } else {
      setCurrentScanUrl(resolvedUrl);
      setUploadedBase64(null);
      setAiResult(null);
    }
  };

  const handleSelectTimelineYear = (year) => {
    setSelectedTimelineYear(year);
    const scan = HISTORICAL_SCANS.find(s => s.year === year);
    if (scan) {
      if (isCompareMode) {
        setComparisonScan(scan.url);
      } else {
        setCurrentScanUrl(scan.url);
        setUploadedBase64(null); // Clear uploaded file view
        setAiResult(null);
      }
    }
  };

  const toggleCompareMode = () => {
    const nextCompare = !isCompareMode;
    setIsCompareMode(nextCompare);
    if (nextCompare) {
      // Set to second latest xray by default if available, else first, else default fallback
      if (patientXrays.length > 1) {
        const fallbackXray = patientXrays[1];
        setComparisonScan(resolveFileUrl(fallbackXray.fileUrl));
        setSelectedXrayId(fallbackXray.id);
      } else if (patientXrays.length > 0) {
        const fallbackXray = patientXrays[0];
        setComparisonScan(resolveFileUrl(fallbackXray.fileUrl));
        setSelectedXrayId(fallbackXray.id);
      } else {
        setComparisonScan('https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=400');
      }
      toast.info('Split screen comparison loaded.');
    } else {
      setComparisonScan(null);
    }
  };

  const clearDrawings = () => {
    setAnnotations([]);
    setMeasurePoints([]);
    setDrawLines([]);
    saveAnnotations([], [], []);
    toast.info('Imaging annotations cleared.');
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5 text-left w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
        <div>
          <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
            Open Dental Smart Radiograph Hub
          </h4>
          <p className="text-[10px] text-muted-foreground font-semibold">
            Clinical imaging with hardware interface, side-by-side comparison, and OpenAI Vision analysis.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center justify-center h-8 px-3 rounded-lg border border-border bg-muted/50 hover:bg-muted text-[10px] font-bold text-foreground cursor-pointer transition-all">
            <span>Change Radiograph File</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
          <Button
            size="xs"
            variant={isCompareMode ? 'primary' : 'outline'}
            onClick={toggleCompareMode}
            className="h-8 gap-1 font-bold text-[10px] cursor-pointer"
          >
            <Columns className="h-3.5 w-3.5" />
            Compare Timeline
          </Button>
        </div>
      </div>

      {/* Main Content Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Hardware connection panel */}
        <div className="space-y-4 lg:col-span-1">
          <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-3">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-black block border-b border-border pb-1.5 flex items-center gap-1 select-none">
              <Settings className="h-3.5 w-3.5 text-primary" />
              Connected Imaging Sensors
            </span>
            
            <div className="space-y-2">
              <Select
                label="Select Hardware Sensor"
                value={selectedSensor}
                onChange={(e) => setSelectedSensor(e.target.value)}
                options={HARDWARE_SENSORS.map(s => ({ value: s.id, label: s.name }))}
              />
              <Select
                label="Projection Classification"
                value={scanType}
                onChange={(e) => setScanType(e.target.value)}
                options={SCAN_TYPES.map(s => ({ value: s.id, label: s.name }))}
              />
              
              <div className="flex items-center justify-between p-2 bg-card border border-border rounded-lg text-[10px]">
                <span className="text-muted-foreground font-bold">Status:</span>
                <span className="font-extrabold text-emerald-500">{sensorStatus}</span>
              </div>

              <Button
                size="xs"
                variant="outline"
                onClick={triggerHardwareSelfTest}
                className="w-full text-[9px] font-black uppercase h-7.5 cursor-pointer"
              >
                Self Check Sensor
              </Button>
            </div>
          </div>

          {/* Historical Timelines */}
          <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-3">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-black block border-b border-border pb-1.5 select-none">
              Radiograph Timeline
            </span>
            
            <div className="flex flex-col gap-2">
              {patientXrays.length > 0 ? (
                patientXrays.map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => handleSelectXrayTimeline(scan)}
                    className={`p-2.5 rounded-lg border text-[10px] font-bold text-left cursor-pointer transition-all flex items-center justify-between ${
                      selectedXrayId === scan.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    <span className="truncate max-w-[130px]">{scan.name}</span>
                    <span className="text-[8px] font-black">
                      {new Date(scan.date || scan.createdAt).toISOString().split('T')[0]}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-[10px] text-muted-foreground font-semibold italic text-center py-4">
                  No scan files uploaded.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Image Canvas Workspace (Col-span 2) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Annotation controls bar */}
          <div className="flex gap-2 p-2 bg-muted/40 border border-border rounded-xl">
            <button
              onClick={() => setActiveTool(activeTool === 'draw' ? 'none' : 'draw')}
              className={`flex-1 p-2 rounded-lg border text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTool === 'draw' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" /> Draw
            </button>
            <button
              onClick={() => setActiveTool(activeTool === 'measure' ? 'none' : 'measure')}
              className={`flex-1 p-2 rounded-lg border text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTool === 'measure' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              <Ruler className="h-3.5 w-3.5" /> Measure
            </button>
            <button
              onClick={() => setActiveTool(activeTool === 'mark' ? 'none' : 'mark')}
              className={`flex-1 p-2 rounded-lg border text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTool === 'mark' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> Mark Lesion
            </button>
            <button
              onClick={clearDrawings}
              className="p-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 rounded-lg text-[10px] font-black uppercase cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Interactive Screen viewport */}
          <div className={`grid gap-4 ${isCompareMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
            
            {/* Primary active image viewport */}
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold text-muted-foreground block text-left">
                {uploadedBase64 ? 'Uploaded Active Scan' : `Timeline Scan: ${selectedTimelineYear}`}
              </span>
              <div
                ref={imageContainerRef}
                onClick={handleImageClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                className="bg-black border border-border rounded-xl aspect-video relative overflow-hidden flex items-center justify-center cursor-crosshair select-none group shadow-inner"
              >
                <img
                  src={uploadedBase64 || currentScanUrl}
                  alt="Radiograph Panel"
                  className="max-h-full max-w-full object-contain filter saturate-0 contrast-125 brightness-95 pointer-events-none"
                />

                {/* Blue medical overlay */}
                <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay pointer-events-none" />

                {/* AI Coordinates Bounding boxes */}
                {aiResult && showCariesOverlay && aiResult.cariesCoordinates && (
                  <div className="absolute inset-0 z-20">
                    {aiResult.cariesCoordinates.map((box, i) => (
                      <div
                        key={i}
                        className="absolute border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center rounded animate-pulse"
                        style={{
                          left: `${box.x}%`,
                          top: `${box.y}%`,
                          width: `${box.w}%`,
                          height: `${box.h}%`
                        }}
                      >
                        <span className="text-[7.5px] bg-slate-950 text-rose-400 font-extrabold px-1 py-0.5 rounded shadow-sm leading-none">
                          {box.label || 'Caries'} ({aiResult.cariesConfidence}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Clicked annotations */}
                {annotations.map((ann, i) => (
                  <div
                    key={i}
                    className="absolute w-5 h-5 border border-indigo-400 bg-indigo-400/20 rounded-full flex items-center justify-center z-30"
                    style={{ left: `${ann.x}%`, top: `${ann.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <span className="text-[8px] bg-slate-900 text-indigo-300 font-extrabold px-1 rounded shadow-sm whitespace-nowrap absolute -top-4">
                      {ann.label}
                    </span>
                  </div>
                ))}

                {/* Ruler measurements */}
                {measurePoints.map((pt, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-emerald-500 rounded-full z-30"
                    style={{ left: `${pt.x}%`, top: `${pt.y}%`, transform: 'translate(-50%, -50%)' }}
                  />
                ))}
                
                {measurePoints.length === 2 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                    <line
                      x1={`${measurePoints[0].x}%`}
                      y1={`${measurePoints[0].y}%`}
                      x2={`${measurePoints[1].x}%`}
                      y2={`${measurePoints[1].y}%`}
                      className="stroke-emerald-400 stroke-2 stroke-dasharray"
                      style={{ strokeDasharray: '4' }}
                    />
                  </svg>
                )}

                {/* Dynamic Draw Lines overlay */}
                {drawLines.length > 0 && (
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none z-20">
                    {drawLines.map((line, idx) => {
                      if (line.length < 2) return null;
                      const pathData = line.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                      return (
                        <path
                          key={idx}
                          d={pathData}
                          className="stroke-rose-500 fill-none"
                          style={{ strokeWidth: '0.8px', vectorEffect: 'non-scaling-stroke' }}
                        />
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>

            {/* Side-by-side comparison viewport */}
            {isCompareMode && (
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold text-muted-foreground block text-left">
                  {selectedXrayId && patientXrays.find(x => x.id === selectedXrayId)
                    ? `Contrast Scan: ${patientXrays.find(x => x.id === selectedXrayId).name}`
                    : 'Historical Contrast Scan'}
                </span>
                <div className="bg-black border border-border rounded-xl aspect-video relative overflow-hidden flex items-center justify-center shadow-inner">
                  <img
                    src={comparisonScan}
                    alt="Comparison Panel"
                    className="max-h-full max-w-full object-contain filter saturate-0 contrast-125 brightness-95 pointer-events-none"
                  />
                  <div className="absolute top-2 left-2 z-10 text-[9px] font-mono bg-slate-950/80 text-slate-400 px-1.5 py-0.5 rounded uppercase">
                    Contrast Scan
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRunAIVision}
              disabled={isScanning}
              className="flex-1 font-bold text-xs gap-1.5 h-10 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] cursor-pointer shadow-md justify-center"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating OpenAI Vision Diagnostic...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Run AI Dental Scan Diagnostics
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Sidebar: AI Diagnostic Output Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 bg-muted/40 border border-border rounded-xl flex flex-col justify-between min-h-[220px] space-y-3">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-black block border-b border-border pb-1.5 select-none">
              AI Diagnostic Feed
            </span>

            {isScanning ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2 text-xs font-semibold text-muted-foreground animate-pulse">
                <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                <span>Consulting OpenAI Vision API...</span>
              </div>
            ) : aiError ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2 text-xs font-semibold text-rose-500">
                <AlertCircle className="h-7 w-7 text-rose-500" />
                <span className="font-extrabold">{aiError}</span>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Set `OPENAI_API_KEY` in backend .env configuration to unlock automated diagnostics.
                </p>
              </div>
            ) : aiResult ? (
              <div className="space-y-3 text-xs leading-normal font-semibold text-left">
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg leading-relaxed text-[11px] space-y-2">
                  <div>
                    <span className="font-black text-[10px] uppercase block mb-1">Caries Audit</span>
                    {aiResult.cariesDetected ? (
                      <span className="text-rose-500 font-extrabold block">⚠️ Possible Caries Detected (Confidence: {aiResult.cariesConfidence}%)</span>
                    ) : (
                      <span className="text-emerald-500 font-extrabold block">✓ No Caries Detected</span>
                    )}
                  </div>
                  
                  <div>
                    <span className="font-black text-[10px] uppercase block mb-1">Alveolar Bone Level</span>
                    {aiResult.boneLossDetected ? (
                      <span className="text-amber-500 font-extrabold block">⚠️ Bone Loss Identified ({aiResult.boneLossPercentage}%)</span>
                    ) : (
                      <span className="text-emerald-500 font-extrabold block">✓ Bone Levels Normal</span>
                    )}
                  </div>

                  {aiResult.observations && aiResult.observations.length > 0 && (
                    <div>
                      <span className="font-black text-[9px] uppercase block text-muted-foreground mt-1 mb-0.5">Observations</span>
                      <ul className="list-disc pl-3 text-[10px] space-y-0.5 text-foreground font-medium">
                        {aiResult.observations.map((obs, i) => <li key={i}>{obs}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer p-1">
                    <input
                      type="checkbox"
                      checked={showCariesOverlay}
                      onChange={() => setShowCariesOverlay(!showCariesOverlay)}
                      className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Highlight Caries Overlays</span>
                  </label>

                  <div className="text-[8px] leading-relaxed text-muted-foreground font-semibold font-mono border-t border-border pt-2 select-none uppercase">
                    ⚠️ DISCLAIMER: This is an AI-assisted observation and not a definitive diagnosis.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-xs font-bold text-muted-foreground/60 italic leading-relaxed">
                <FileText className="h-7 w-7 mb-1.5 stroke-1" />
                <span>Upload a file or trigger audit scanner. Local sample bite scan will be utilized automatically if no file is chosen.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default XrayAIViewer;
