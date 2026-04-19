import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Participant, Event } from '../types';
import { parseQRContent } from '../utils/qr';
import { printCertificate } from '../utils/certificate';
import { Camera, CameraOff, QrCode, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import jsQR from 'jsqr';

interface ScannerTabProps {
  event: Event;
  participants: Participant[];
  onRefresh: () => void;
}

type ScanStatus = 'idle' | 'processing' | 'success' | 'error' | 'already' | 'no-checkin';

interface ScanResult {
  status: ScanStatus;
  message: string;
  participant?: Participant;
}

export default function ScannerTab({ event, participants, onRefresh }: ScannerTabProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    };
  }, []);

  async function startCamera() {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      scanningRef.current = true;
      requestAnimationFrame(scanFrame);
    } catch {
      setCameraError('Нет доступа к камере. Используйте ручной ввод.');
    }
  }

  function stopCamera() {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  function scanFrame() {
    if (!scanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      handleQRCode(code.data);
      return;
    }
    requestAnimationFrame(scanFrame);
  }

  async function handleQRCode(code: string) {
    if (scanResult?.status === 'processing') return;
    scanningRef.current = false;

    setScanResult({ status: 'processing', message: 'Обработка...' });
    const parsed = parseQRContent(code);

    if (!parsed || parsed.eventId !== event.id) {
      showResult({ status: 'error', message: 'QR-код не принадлежит этому мероприятию' });
      return;
    }

    const participant = participants.find((p) => p.id === parsed.userId);
    if (!participant) {
      showResult({ status: 'error', message: 'Участник не найден' });
      return;
    }

    if (!participant.check_in_time) {
      showResult({ status: 'no-checkin', message: `${participant.last_name} ${participant.first_name} — нет регистрации входа`, participant });
      return;
    }

    if (participant.check_out_time) {
      showResult({ status: 'already', message: `Сертификат уже выдан — ${participant.last_name} ${participant.first_name}`, participant });
      return;
    }

    const { error } = await supabase
      .from('participants')
      .update({ check_out_time: new Date().toISOString() })
      .eq('id', participant.id);

    if (error) {
      showResult({ status: 'error', message: error.message });
      return;
    }

    onRefresh();
    await printCertificate(participant, event);
    showResult({ status: 'success', message: `Сертификат выдан — ${participant.last_name} ${participant.first_name}`, participant });
  }

  function showResult(result: ScanResult) {
    setScanResult(result);
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    resultTimeoutRef.current = setTimeout(() => {
      setScanResult(null);
      if (cameraActive) {
        scanningRef.current = true;
        requestAnimationFrame(scanFrame);
      }
    }, 4000);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleQRCode(manualCode.trim());
    setManualCode('');
  }

  const statusConfig = {
    idle: { icon: null, bg: '', text: '' },
    processing: { icon: <Loader2 className="w-8 h-8 animate-spin text-blue-500" />, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    success: { icon: <CheckCircle className="w-8 h-8 text-emerald-500" />, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
    error: { icon: <XCircle className="w-8 h-8 text-red-500" />, bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
    already: { icon: <AlertTriangle className="w-8 h-8 text-amber-500" />, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    'no-checkin': { icon: <AlertTriangle className="w-8 h-8 text-amber-500" />, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-lg font-bold text-slate-800 mb-6">Сканирование и выдача сертификатов</h2>

      {scanResult && (
        <div className={`border rounded-2xl p-5 mb-6 flex items-center gap-4 ${statusConfig[scanResult.status].bg}`}>
          {statusConfig[scanResult.status].icon}
          <div>
            <p className={`font-semibold text-base ${statusConfig[scanResult.status].text}`}>
              {scanResult.message}
            </p>
            {scanResult.participant && (
              <p className="text-sm text-slate-500 mt-0.5">
                ID: {scanResult.participant.id.slice(0, 8)}...
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-800">Камера</span>
          </div>
          <button
            onClick={cameraActive ? stopCamera : startCamera}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${cameraActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {cameraActive ? <><CameraOff className="w-4 h-4" /> Остановить</> : <><Camera className="w-4 h-4" /> Включить</>}
          </button>
        </div>

        <div className="relative bg-slate-900 aspect-video flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <QrCode className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">Камера выключена</p>
              {cameraError && <p className="text-xs text-red-400 mt-2 px-4 text-center">{cameraError}</p>}
            </div>
          )}
          {cameraActive && !scanResult && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white rounded-2xl opacity-50" />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          Ручной ввод QR-кода
        </p>
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="event_..._user_..."
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Проверить
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-2">
          USB-сканер работает автоматически — наведите на QR-код
        </p>
      </div>
    </div>
  );
}
