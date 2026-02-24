'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AuroraBackgroundProps {
    color?: 'emerald' | 'amber' | 'red';
    isActive: boolean;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
    color = 'emerald',
    isActive
}) => {
    if (!isActive) return null;

    const baseColors = {
        emerald: ['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.15)', 'rgba(52, 211, 153, 0.1)'],
        amber: ['rgba(245, 158, 11, 0.1)', 'rgba(217, 119, 6, 0.15)', 'rgba(251, 191, 36, 0.1)'],
        red: ['rgba(239, 68, 68, 0.1)', 'rgba(185, 28, 28, 0.15)', 'rgba(248, 113, 113, 0.1)']
    };

    const selectedColors = baseColors[color];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute -top-1/4 -left-1/4 w-full h-full rounded-full blur-[100px]"
                style={{ backgroundColor: selectedColors[0] }}
            />
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    x: [0, -40, 0],
                    y: [0, 50, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute -bottom-1/4 -right-1/4 w-full h-full rounded-full blur-[100px]"
                style={{ backgroundColor: selectedColors[1] }}
            />
            <motion.div
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 bg-white/20 backdrop-blur-[1px]"
            />
        </div>
    );
};
