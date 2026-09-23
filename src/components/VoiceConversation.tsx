import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Radio, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Square, 
  Play, 
  Bot, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database,
  Headphones,
  Activity,
  Send
} from 'lucide-react';
import { voiceApi } from '../services/api';
import { auth, logVoiceSession } from '../services/firebase';

interface TranscriptItem {
  id: string;
  speaker: 'user' | 'gemini';
  text: string;
  time: string;
}

export const VoiceConversation: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Standby. Click "Start Live Conversation" to connect to gemini-3.8-live.');
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([
    {
      id: 'init',
      speaker: 'gemini',
      text: 'Live SOC Voice Channel ready. Connect your microphone to speak with model gemini-3.8-live in real time.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [typedVoiceInput, setTypedVoiceInput] = useState('');
  const [synthesizing, setSynthesizing] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Audio contexts and WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const isMutedRef = useRef(false);
  isMutedRef.current = isMuted;

  const sessionStartTimeRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  // Visualizer canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveSession();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerY = canvas.height / 2;

      // Draw active wave bars
      const numBars = 32;
      const barWidth = canvas.width / numBars;

      for (let i = 0; i < numBars; i++) {
        const factor = isRecording || isModelSpeaking ? (Math.sin(phase + i * 0.4) * 0.5 + 0.5) : 0.08;
        const amp = isModelSpeaking ? 38 : (isRecording && !isMuted ? 24 : 6);
        const barHeight = Math.max(4, factor * amp);

        const x = i * barWidth + barWidth * 0.2;
        const y = centerY - barHeight / 2;

        if (isModelSpeaking) {
          ctx.fillStyle = `rgba(99, 102, 241, ${0.4 + factor * 0.6})`;
        } else if (isRecording && !isMuted) {
          ctx.fillStyle = `rgba(16, 185, 129, ${0.4 + factor * 0.6})`;
        } else {
          ctx.fillStyle = 'rgba(71, 85, 105, 0.3)';
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth * 0.6, barHeight, 2);
        ctx.fill();
      }

      phase += isModelSpeaking ? 0.18 : (isRecording ? 0.1 : 0.03);
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRecording, isModelSpeaking, isMuted]);

  /**
   * Helper to play raw 24kHz 16-bit PCM audio chunk received from gemini-3.8-live
   */
  const playAudioChunk = (base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
        });
      }
      const audioCtx = outputAudioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
      }

      const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      const startTime = Math.max(now, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;

      setIsModelSpeaking(true);
      source.onended = () => {
        if (audioCtx.currentTime >= nextStartTimeRef.current - 0.05) {
          setIsModelSpeaking(false);
        }
      };
    } catch (err) {
      console.warn('Error playing live audio chunk:', err);
    }
  };

  /**
   * Starts a real-time live voice session with gemini-3.8-live
   */
  const startLiveSession = async () => {
    setStatusMessage('Requesting microphone access and establishing WebSocket to Live API...');
    try {
      // 1. Initialize microphone input at 16kHz
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      mediaStreamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      inputAudioCtxRef.current = inputCtx;

      // 2. Connect WebSocket to server Live API gateway
      const wsUrl = voiceApi.getLiveWsUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsRecording(true);
        setStatusMessage('Live channel open! You are conversing directly with model gemini-3.8-live.');
        sessionStartTimeRef.current = Date.now();
        setSessionDuration(0);
        timerRef.current = setInterval(() => {
          setSessionDuration(Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
        }, 1000);

        setTranscripts(prev => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            speaker: 'gemini',
            text: 'Connection established with gemini-3.8-live. Speak naturally to discuss threats, alerts, or anomalies.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playAudioChunk(msg.audio);
          }
          if (msg.interrupted) {
            setIsModelSpeaking(false);
            nextStartTimeRef.current = 0;
          }
          if (msg.error) {
            setStatusMessage(`Live API notice: ${msg.error}`);
          }
        } catch (e) {
          console.error('Error handling WS audio response:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('Live WS error:', e);
        setStatusMessage('WebSocket connection error. Live fallback audio available.');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsRecording(false);
        setIsModelSpeaking(false);
        setStatusMessage('Live Voice session closed.');
        if (timerRef.current) clearInterval(timerRef.current);
      };

      // 3. Setup ScriptProcessorNode to stream 16kHz PCM audio to server
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputChannelData.length);
        for (let i = 0; i < inputChannelData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputChannelData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        ws.send(JSON.stringify({ audio: base64Audio }));
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

    } catch (err: any) {
      console.error('Microphone or connection failure:', err);
      setStatusMessage(`Microphone unavailable: ${err.message || 'Permission denied'}. You can still use the Voice Q&A input below.`);
    }
  };

  /**
   * Stop Live Session and log to Firestore
   */
  const stopLiveSession = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    setIsConnected(false);
    setIsRecording(false);
    setIsModelSpeaking(false);
    setStatusMessage('Voice channel disconnected.');

    // Save session in Firestore
    const user = auth.currentUser;
    if (user && sessionDuration > 3) {
      logVoiceSession(user.uid, {
        id: `voice-${Date.now()}`,
        sessionStartTime: new Date(sessionStartTimeRef.current).toISOString(),
        durationSeconds: sessionDuration,
        summary: `Live voice conversation with gemini-3.8-live (${sessionDuration}s)`,
        model: 'gemini-3.8-live',
        transcriptSnippets: transcripts.slice(-5).map(t => ({ speaker: t.speaker, text: t.text }))
      });
    }
  };

  /**
   * Interrupt model speech
   */
  const handleInterrupt = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: 'Hold on a moment, let me interrupt.' }));
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    setIsModelSpeaking(false);
    nextStartTimeRef.current = 0;
  };

  /**
   * Voice interaction prompt (speech response synthesis)
   */
  const handleVoiceQuery = async (queryText?: string) => {
    const text = queryText || typedVoiceInput;
    if (!text.trim() || synthesizing) return;

    setSynthesizing(true);
    const userItem: TranscriptItem = {
      id: `usr-${Date.now()}`,
      speaker: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTranscripts(prev => [...prev, userItem]);
    setTypedVoiceInput('');

    try {
      const res = await voiceApi.turn({ prompt: text.trim() });
      if (res.audio) {
        playAudioChunk(res.audio);
      }
      setTranscripts(prev => [
        ...prev,
        {
          id: `mod-${Date.now()}`,
          speaker: 'gemini',
          text: res.text || 'Voice response generated.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error('Voice turn error:', err);
    } finally {
      setSynthesizing(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#080C15] text-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-[#0B101D] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-900/30 flex items-center justify-center">
            <div className="h-full w-full bg-[#090D18] rounded-[10px] flex items-center justify-center text-emerald-400">
              <Headphones className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100">Live Voice SOC Assistant</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                gemini-3.8-live
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time low-latency bidirectional voice conversations with Gemini Live API
            </p>
          </div>
        </div>

        {/* Status and Timer */}
        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
              <Activity className="h-3.5 w-3.5 animate-spin" />
              <span>LIVE: {formatSeconds(sessionDuration)}</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-mono">
            <Database className="h-3 w-3" />
            <span>Voice Sessions Auto-Saved</span>
          </div>
        </div>
      </header>

      {/* Hero Visualizer Card */}
      <div className="p-6 border-b border-slate-800 bg-gradient-to-b from-[#0B101D] to-[#080C15] shrink-0">
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-[#0F1424]/90 p-6 shadow-xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isModelSpeaking 
              ? 'bg-indigo-600/25' 
              : isRecording 
                ? 'bg-emerald-600/20' 
                : 'bg-slate-700/10'
          }`} />

          <div className="relative flex flex-col items-center text-center space-y-4">
            {/* Waveform Canvas */}
            <div className="w-full h-20 max-w-lg flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={500}
                height={80}
                className="w-full h-full"
              />
            </div>

            {/* Speaking State indicator */}
            <div className="flex items-center gap-2 text-xs font-mono">
              {isModelSpeaking ? (
                <span className="flex items-center gap-1.5 text-indigo-400 font-semibold animate-pulse">
                  <Volume2 className="h-4 w-4" />
                  Gemini (gemini-3.8-live) is speaking...
                </span>
              ) : isRecording ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Listening to your microphone (16kHz PCM)...
                </span>
              ) : (
                <span className="text-slate-400">
                  Microphone idle • Ready to connect
                </span>
              )}
            </div>

            {/* Main Interactive Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {!isConnected ? (
                <button
                  onClick={startLiveSession}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/40 transition-all active:scale-98 cursor-pointer"
                >
                  <Mic className="h-5 w-5" />
                  <span>Start Live Conversation (gemini-3.8-live)</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={stopLiveSession}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
                  >
                    <Square className="h-4 w-4" />
                    <span>End Voice Session</span>
                  </button>

                  <button
                    onClick={() => setIsMuted(prev => !prev)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isMuted 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span>{isMuted ? 'Muted' : 'Mute Mic'}</span>
                  </button>

                  {isModelSpeaking && (
                    <button
                      onClick={handleInterrupt}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
                      title="Interrupt and halt model response"
                    >
                      <VolumeX className="h-4 w-4 text-rose-400" />
                      <span>Interrupt</span>
                    </button>
                  )}
                </>
              )}
            </div>

            <p className="text-[11px] text-slate-400 max-w-md">
              {statusMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Transcript Log Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono pb-1 border-b border-slate-800">
            <span>LIVE SESSION TRANSCRIPTION</span>
            <span>gemini-3.8-live Voice Feed</span>
          </div>

          {transcripts.map((t) => {
            const isGemini = t.speaker === 'gemini';
            return (
              <div
                key={t.id}
                className={`flex gap-3 ${isGemini ? 'justify-start' : 'justify-end'}`}
              >
                {isGemini && (
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed max-w-[85%] ${
                    isGemini
                      ? 'bg-[#101728] border border-slate-800 text-slate-200 rounded-tl-xs'
                      : 'bg-emerald-600 text-white rounded-tr-xs shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] font-mono text-slate-400">
                    <span className={isGemini ? 'text-emerald-400 font-bold' : 'text-emerald-100 font-bold'}>
                      {isGemini ? 'Gemini 3.8 Live Voice' : 'Analyst (Voice/Audio)'}
                    </span>
                    <span>{t.time}</span>
                  </div>
                  <div>{t.text}</div>
                </div>

                {!isGemini && (
                  <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Voice Prompt Suggestions & Fallback Input */}
      <div className="p-4 bg-[#0B101D] border-t border-slate-800 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Quick Voice Questions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 shrink-0">Try Asking:</span>
            {[
              'Give me a brief summary of active critical fraud alerts',
              'Explain the top risk factor in our latest transaction anomaly',
              'What are the primary indicators of a card testing swarm?'
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleVoiceQuery(q)}
                disabled={synthesizing}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] shrink-0 transition-colors disabled:opacity-50"
              >
                "{q.slice(0, 36)}..."
              </button>
            ))}
          </div>

          {/* Fallback voice synthesis input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={typedVoiceInput}
                onChange={e => setTypedVoiceInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVoiceQuery()}
                placeholder="Or type a question to hear Gemini synthesize an authoritative voice response..."
                className="w-full bg-[#070A12] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/80"
              />
            </div>
            <button
              onClick={() => handleVoiceQuery()}
              disabled={!typedVoiceInput.trim() || synthesizing}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-40 cursor-pointer"
            >
              <span>{synthesizing ? 'Speaking...' : 'Speak'}</span>
              <Volume2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
