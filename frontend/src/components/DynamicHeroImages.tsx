import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * Dynamic Hero Images Component
 * Inspired by Tally.xyz landing page
 * Images appear "bent" initially and straighten as user scrolls
 */
export default function DynamicHeroImages() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress within this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Transform values that change based on scroll
  // Images start "bent" (perspective distortion) and straighten as you scroll
  const rotateX1 = useTransform(scrollYProgress, [0, 1], [35, 0]); // Start tilted, end flat
  const rotateX2 = useTransform(scrollYProgress, [0, 1], [25, 0]);
  const rotateX3 = useTransform(scrollYProgress, [0, 1], [30, 0]);
  
  const rotateY1 = useTransform(scrollYProgress, [0, 1], [-5, 0]); // Slight Y rotation for depth
  const rotateY2 = useTransform(scrollYProgress, [0, 1], [5, 0]);
  const rotateY3 = useTransform(scrollYProgress, [0, 1], [-3, 0]);
  
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1]); // Start slightly zoomed, end normal
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.9]); // Fade slightly as scroll
  
  // Parallax effect - images move at different speeds
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -40]);

  // Image data - using gradient backgrounds that represent governance concepts
  const images = [
    {
      id: 1,
      gradient: 'from-purple-600 via-purple-500 to-cyan-500',
      title: 'Real-Time Proposals',
      description: 'Instant proposal appearance',
      rotateX: rotateX1,
      rotateY: rotateY1,
      y: y1,
    },
    {
      id: 2,
      gradient: 'from-cyan-500 via-blue-500 to-purple-500',
      title: 'Live Voting',
      description: 'Watch votes in real-time',
      rotateX: rotateX2,
      rotateY: rotateY2,
      y: y2,
    },
    {
      id: 3,
      gradient: 'from-purple-500 via-pink-500 to-cyan-500',
      title: 'Quorum Tracking',
      description: 'See progress instantly',
      rotateX: rotateX3,
      rotateY: rotateY3,
      y: y3,
    },
  ];

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[600px] md:h-[700px] overflow-hidden mb-16"
      style={{ perspective: '1000px' }}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-bg-primary via-dark-bg-secondary to-dark-bg-primary opacity-50" />
      
      {/* Container for images */}
      <div className="relative h-full flex items-center justify-center gap-4 md:gap-8 px-4" style={{ transformStyle: 'preserve-3d' }}>
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            className="relative w-full max-w-[300px] md:max-w-[400px] h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl"
            style={{
              rotateX: image.rotateX,
              rotateY: image.rotateY,
              y: image.y,
              scale,
              opacity,
              transformStyle: 'preserve-3d',
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.2,
              duration: 0.8,
              type: 'spring',
              stiffness: 100,
            }}
          >
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${image.gradient} opacity-90`} />
            
            {/* Overlay pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            
            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white z-10">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
                className="text-6xl md:text-7xl mb-4"
              >
                {index === 0 && '📋'}
                {index === 1 && '🗳️'}
                {index === 2 && '📊'}
              </motion.div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2 text-center">
                {image.title}
              </h3>
              <p className="text-sm md:text-base text-white/80 text-center">
                {image.description}
              </p>
            </div>

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
                ease: 'linear',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-dark-text-secondary"
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-sm">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

