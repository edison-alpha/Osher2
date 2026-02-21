import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import osherLogo from '@/assets/oserc.svg';

interface LoadingScreenProps {
  variant?: 'buyer' | 'courier';
}

export const LoadingScreen = ({ variant = 'buyer' }: LoadingScreenProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const isCourier = variant === 'courier';

  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: '#142328' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center">
        <div className="relative flex flex-col items-center gap-4">
          {/* Logo and Text - Horizontal Layout */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: [0, 1.1, 1],
                rotate: 0,
              }}
              transition={{ 
                duration: 0.8,
                times: [0, 0.6, 1],
                ease: "easeOut"
              }}
            >
              <motion.img 
                src={osherLogo} 
                alt="Osher Logo" 
                className="w-12 h-12 md:w-16 md:h-16"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.05, 1],
                opacity: 1,
              }}
              transition={{ 
                duration: 0.6,
                delay: 0.3,
                times: [0, 0.6, 1],
                ease: "easeOut"
              }}
            >
              <h1 className="text-3xl md:text-4xl font-medium text-white tracking-tight" style={{ fontFamily: 'Rubik, sans-serif' }}>
                OSHER
              </h1>
              {isCourier && (
                <p className="text-sm md:text-base text-white/60 font-medium tracking-wide mt-1" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  Kurir
                </p>
              )}
            </motion.div>
          </div>

          {/* Loading Dots */}
          <motion.div 
            className="text-2xl md:text-3xl text-white/60 font-bold h-8 tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {dots}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
