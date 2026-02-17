"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { base } from "wagmi/chains";
import sdk from "@farcaster/miniapp-sdk";
import { Trophy, Coins, Zap, Loader2, Wallet, Share2 } from "lucide-react";
import { useConnect, useReconnect } from "wagmi";

const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export default function Home() {
  const [score, setScore] = useState(0);
  const [localScore, setLocalScore] = useState(0);
  const [pendingTaps, setPendingTaps] = useState(0);
  const [animations, setAnimations] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isReady, setIsReady] = useState(false);
  const tapBuffer = useRef(0);
  const isSyncing = useRef(false);

  const { address, status, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending: isConnectPending } = useConnect();
  const { reconnect } = useReconnect();

  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const init = async () => {
      sdk.actions.ready();
    };
    if (!isReady) {
      setIsReady(true);
      init();
    }
  }, [isReady]);

  // Persistent session support
  useEffect(() => {
    reconnect();
  }, [reconnect]);

  // Auto-connect
  useEffect(() => {
    if (status === "disconnected" && !isConnecting && !isConnectPending && connectors.length > 0) {
      const connector = connectors.find((c) => c.id === "injected") || connectors[0];
      connect({ connector });
    }
  }, [status, isConnecting, isConnectPending, connectors, connect]);

  // Robust Syncing Logic: Check every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      if (tapBuffer.current > 0 && isConnected && address && !isPending && !isConfirming && !isSyncing.current) {
        const amountToSync = tapBuffer.current;
        isSyncing.current = true;

        sendTransaction({
          to: address,
          value: parseEther((amountToSync * 0.000000000000000001).toFixed(18)),
          chainId: base.id,
        }, {
          onSettled: () => {
            isSyncing.current = false;
          },
          onSuccess: () => {
            tapBuffer.current -= amountToSync;
            setPendingTaps(tapBuffer.current);
          },
          onError: () => {
            // Keep taps in buffer to retry
            isSyncing.current = false;
          }
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected, address, isPending, isConfirming, sendTransaction]);

  // Load saved score on connect
  useEffect(() => {
    if (isConnected && address) {
      const saved = localStorage.getItem(`base_tapper_score_${address}`);
      if (saved) {
        const val = parseInt(saved);
        setScore(val);
        setLocalScore(val);
      }
    }
  }, [isConnected, address]);

  // Save score on change
  useEffect(() => {
    if (isConnected && address && localScore > 0) {
      localStorage.setItem(`base_tapper_score_${address}`, localScore.toString());
    }
  }, [localScore, isConnected, address]);

  // Handle score increment on confirmed transaction
  useEffect(() => {
    if (isConfirmed) {
      setScore((s) => s + 1);
    }
  }, [isConfirmed]);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isConnected) return;

    // Prevent zoom/scroll/double-tap ghosting
    if (e.cancelable) e.preventDefault();

    // Visual feedback
    const x = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const y = 'clientY' in e ? e.clientY : e.touches[0].clientY;

    const id = Date.now();
    setAnimations(prev => [...prev.slice(-20), { id, x, y }]); // Keep last 20 for performance
    setTimeout(() => setAnimations(prev => prev.filter(a => a.id !== id)), 1000);

    // Score updates
    setLocalScore(s => s + 1);
    tapBuffer.current += 1;
    setPendingTaps(tapBuffer.current);

    if ('vibrate' in navigator) navigator.vibrate(5);
  }, [isConnected]);

  if (!isConnected) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-white font-sans text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,82,255,0.1),transparent)] pointer-events-none" />

        <div className="w-24 h-24 mb-8 relative">
          <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-50 animate-pulse" />
          <div className="relative w-full h-full rounded-full bg-blue-600 flex items-center justify-center border-4 border-white/20">
            <div className="w-12 h-12 rounded-full border-4 border-white" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
          Base Tapper
        </h1>
        <p className="text-slate-400 mb-12 max-w-xs text-lg">
          {isConnecting || isConnectPending ? "Подключение к кошельку..." : "Ожидание авторизации..."}
        </p>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 px-8 py-4 rounded-2xl font-bold text-xl border border-white/10 opacity-70">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span>{isConnecting || isConnectPending ? "Подключение" : "Авторизация"}</span>
          </div>

          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
            Base App Environment
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 bg-slate-950 text-white overflow-hidden font-sans select-none touch-none">
      {/* Flying Numbers */}
      <AnimatePresence>
        {animations.map(anim => (
          <motion.span
            key={anim.id}
            initial={{ opacity: 1, y: anim.y - 20, x: anim.x }}
            animate={{ opacity: 0, y: anim.y - 150 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none text-blue-400 font-black text-2xl z-[100] drop-shadow-[0_0_10px_rgba(0,82,255,0.8)]"
          >
            +1
          </motion.span>
        ))}
      </AnimatePresence>

      {/* Header */}
      <div className="relative w-full flex justify-between items-center opacity-80 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Base Mainnet</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-1 rounded-lg border border-white/10">
          {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "???"}
        </div>
      </div>

      {/* Score Section */}
      <div className="relative flex flex-col items-center gap-2 mt-8 z-10">
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-8 py-4 rounded-3xl backdrop-blur-xl shadow-2xl relative group">
          <div className="absolute -top-3 -right-3 bg-blue-600 text-[10px] font-black px-2 py-1 rounded-full border-2 border-slate-950 shadow-lg">
            LIVE
          </div>
          <Trophy className="w-8 h-8 text-yellow-400" />
          <div className="flex flex-col">
            <span className="text-5xl font-black tracking-tighter tabular-nums leading-none">
              {localScore}
            </span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">
              {pendingTaps > 0 ? `Syncing ${pendingTaps} tap(s)...` : "Points Earned"}
            </span>
          </div>
        </div>

        {localScore > score && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-slate-500 font-medium italic"
          >
            Awaiting on-chain confirmation...
          </motion.div>
        )}
      </div>

      {/* Main Tapper Logo */}
      <div className="relative flex items-center justify-center flex-1 w-full">
        <div className="absolute w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full -z-10 animate-pulse-slow" />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.92 }}
          onPointerDown={handleTap}
          className="relative group transition-all duration-300 pointer-events-auto"
        >
          {/* Base Logo (Authentic CSS) */}
          <div className="w-60 h-60 rounded-full bg-[#0052FF] flex items-center justify-center shadow-[0_0_80px_rgba(0,82,255,0.3)] border-[12px] border-white/10 relative overflow-hidden active:border-white/30 transition-colors">
            <div className="w-32 h-32 rounded-full border-[10px] border-white" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
            <div className="absolute -inset-4 bg-blue-400 opacity-20 blur-xl scale-0 group-active:scale-100 transition-transform duration-500 rounded-full" />
          </div>

          {/* Status Overlay */}
          <AnimatePresence>
            {(isPending || isConfirming) && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-full pointer-events-none"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-400" />
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white animate-pulse" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Floating Tx Link */}
        <AnimatePresence>
          {hash && (
            <motion.a
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              href={`https://basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-10 text-[10px] font-mono text-blue-500/60 hover:text-blue-500 underline decoration-blue-500/20 underline-offset-4 transition-colors"
            >
              Latest Tx: {hash.slice(0, 10)}...
            </motion.a>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Stats */}
      <div className="relative w-full grid grid-cols-2 gap-4 pb-4 z-10">
        <div className="bg-white/5 border border-white/5 p-4 rounded-[2rem] flex flex-col items-center gap-1 backdrop-blur-md">
          <Coins className="w-4 h-4 text-blue-400" />
          <span className="text-xl font-black">1 WEI</span>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Per Tap</span>
        </div>
        <div className="bg-white/5 border border-white/5 p-4 rounded-[2rem] flex flex-col items-center gap-1 backdrop-blur-md">
          <Zap className="w-4 h-4 text-orange-400" />
          <span className="text-xl font-black">FAST</span>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Base Network</span>
        </div>
      </div>

      <button
        onClick={() => {
          const text = `I've earned ${localScore} points on Base Tapper! Can you beat me? 🔵🚀`;
          sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`);
        }}
        className="w-full mb-8 bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl flex items-center justify-center gap-3 transition-colors active:scale-95 z-10"
      >
        <Share2 className="w-5 h-5 text-blue-400" />
        <span className="font-bold">Share Score</span>
      </button>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 left-6 right-6 bg-red-600 border border-white/10 text-white p-4 rounded-[1.5rem] shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Error</span>
            <p className="font-bold text-sm">
              {error.message.includes("User rejected") ? "Transaction Canceled" : "Network Delay - Try Again"}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
