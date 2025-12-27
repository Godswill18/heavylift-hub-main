import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { ReactNode } from 'react';

// Stagger container for lists
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerContainer = ({ children, className, staggerDelay = 0.1 }: StaggerContainerProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: staggerDelay }
      }
    }}
  >
    {children}
  </motion.div>
);

// Stagger item
export const StaggerItem = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    }}
  >
    {children}
  </motion.div>
);

// Fade in on scroll
export const FadeIn = ({ children, className, delay = 0, direction = 'up' }: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}) => {
  const directionMap = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 }
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
};

// Scale on hover
export const ScaleOnHover = ({ children, className, scale = 1.02 }: {
  children: ReactNode;
  className?: string;
  scale?: number;
}) => (
  <motion.div
    className={className}
    whileHover={{ scale }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
  >
    {children}
  </motion.div>
);

// Animated card
export const AnimatedCard = ({ children, className, index = 0 }: {
  children: ReactNode;
  className?: string;
  index?: number;
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
    whileHover={{ 
      y: -4,
      boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
      transition: { duration: 0.2 }
    }}
  >
    {children}
  </motion.div>
);

// Page transition wrapper
export const PageTransition = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// Slide in from side
export const SlideIn = ({ children, className, from = 'right' }: {
  children: ReactNode;
  className?: string;
  from?: 'left' | 'right';
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, x: from === 'right' ? 50 : -50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
  >
    {children}
  </motion.div>
);

// Animated counter
export const AnimatedCounter = ({ value, className, duration = 1 }: {
  value: number;
  className?: string;
  duration?: number;
}) => (
  <motion.span
    className={className}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {value.toLocaleString()}
    </motion.span>
  </motion.span>
);

// Floating animation
export const Float = ({ children, className, duration = 3 }: {
  children: ReactNode;
  className?: string;
  duration?: number;
}) => (
  <motion.div
    className={className}
    animate={{ 
      y: [0, -10, 0],
    }}
    transition={{ 
      duration,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
  >
    {children}
  </motion.div>
);

// Pulse animation
export const Pulse = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    className={className}
    animate={{ 
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1]
    }}
    transition={{ 
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
  >
    {children}
  </motion.div>
);

// Success checkmark animation
export const SuccessCheck = ({ size = 48 }: { size?: number }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 50 50"
    initial="hidden"
    animate="visible"
  >
    <motion.circle
      cx="25"
      cy="25"
      r="23"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      variants={{
        hidden: { pathLength: 0, opacity: 0 },
        visible: { pathLength: 1, opacity: 1, transition: { duration: 0.5 } }
      }}
    />
    <motion.path
      d="M14 27l7 7 16-16"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={{
        hidden: { pathLength: 0, opacity: 0 },
        visible: { pathLength: 1, opacity: 1, transition: { duration: 0.3, delay: 0.5 } }
      }}
    />
  </motion.svg>
);
