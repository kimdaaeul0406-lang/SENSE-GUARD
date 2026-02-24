'use client';

import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
    stream: MediaStream | null;
    isActive: boolean;
    color?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
    stream,
    isActive,
    color = '#10b981' // emerald-500
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!stream || !isActive) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);

        // FFT size for frequency data (controls resolution)
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8; // Smooth transition
        source.connect(analyser);

        analyserRef.current = analyser;
        audioContextRef.current = audioCtx;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 0.8;
            let barHeight;
            let x = 0;

            const centerY = canvas.height / 2;

            for (let i = 0; i < bufferLength; i++) {
                // Boost the gain for visualization
                const rawValue = dataArray[i];
                // Apply a small breathing effect even when quiet
                const boost = 1.6;
                const breath = Math.sin(Date.now() / 500) * 2;
                barHeight = (rawValue / 255) * canvas.height * boost + breath;

                if (barHeight < 4) barHeight = 4; // Minimum visible bar

                const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
                gradient.addColorStop(0, `${color}44`); // Top
                gradient.addColorStop(0.5, color);     // Center (thickest/brightest)
                gradient.addColorStop(1, `${color}44`); // Bottom

                ctx.fillStyle = gradient;

                // Mirrored rounded bar
                const radius = barWidth / 2;
                const barX = x + (canvas.width - (barWidth * bufferLength)) / 2; // Center horizontally
                const barY = centerY - barHeight / 2;

                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(barX, barY, barWidth - 1, barHeight, radius);
                } else {
                    ctx.fillRect(barX, barY, barWidth - 1, barHeight);
                }
                ctx.fill();

                x += barWidth;
            }
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, [stream, isActive, color]);

    return (
        <div className="w-full h-20 flex items-center justify-center overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/30 shadow-inner">
            <canvas
                ref={canvasRef}
                width={200}
                height={80}
                className="w-full h-full"
            />
        </div>
    );
};
