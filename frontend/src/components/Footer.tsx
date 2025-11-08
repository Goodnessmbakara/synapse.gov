import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer Component with Scattered Pixel Pattern
 * Inspired by Tally.xyz footer design
 */
export default function Footer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawPattern(ctx, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const drawPattern = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height);

    // Center point at bottom center
    const centerX = width / 2;
    const centerY = height;

    // Create scattered pixel pattern
    const pixelSize = 2;
    const numPixels = 800; // Total number of pixels

    for (let i = 0; i < numPixels; i++) {
      // Create wave-like distribution from bottom center
      const angle = (Math.random() - 0.5) * Math.PI * 1.5; // Spread angle
      const distance = Math.random() * height * 0.8; // Distance from center
      
      // Create curved wave pattern
      const waveOffset = Math.sin(angle) * 0.3;
      const x = centerX + Math.cos(angle) * distance * (1 + waveOffset);
      const y = centerY - distance * (0.7 + Math.random() * 0.3);

      // Skip pixels outside canvas
      if (x < 0 || x > width || y < 0 || y > height) continue;

      // Calculate opacity based on distance (fade out as distance increases)
      const distanceFromCenter = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      const maxDistance = height * 0.9;
      const opacity = Math.max(0, 1 - distanceFromCenter / maxDistance);

      // Vary colors between purple and blue
      const colorVariation = Math.random();
      const r = colorVariation < 0.5 ? 139 : 6; // Purple or Cyan
      const g = colorVariation < 0.5 ? 92 : 182;
      const b = colorVariation < 0.5 ? 246 : 212;

      // Draw pixel with varying brightness
      const brightness = 0.3 + Math.random() * 0.7;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * brightness * 0.6})`;
      ctx.fillRect(x, y, pixelSize, pixelSize);

      // Add glow effect for some pixels
      if (Math.random() > 0.7) {
        ctx.shadowBlur = 3;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${opacity * 0.5})`;
        ctx.fillRect(x - 1, y - 1, pixelSize + 2, pixelSize + 2);
        ctx.shadowBlur = 0;
      }
    }
  };

  return (
    <footer className="relative w-full bg-theme-primary border-t border-theme-tertiary overflow-hidden">
      {/* Scattered Pixel Pattern Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Footer Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/logo.svg" alt="SynapseGov" className="w-8 h-8" />
              <span className="text-xl font-bold text-theme-primary">SynapseGov</span>
            </Link>
            <p className="text-sm text-theme-secondary">
              Real-time DAO governance
            </p>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-theme-primary mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://docs.somnia.network/somnia-data-streams"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://docs.somnia.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <Link
                  to="/proposals"
                  className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  Proposals
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/somnia-network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-theme-primary mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://somnia.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@somnia.network"
                  className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="https://somnia.network/team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  Team
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold text-theme-primary mb-4">
              Community
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://twitter.com/somnia_network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/somnia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/somnia-network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-theme-tertiary pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <a
                href="https://twitter.com/somnia_network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
              >
                Twitter
              </a>
              <a
                href="https://github.com/somnia-network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
              >
                GitHub
              </a>
            </div>
            <div className="flex items-center gap-4 text-sm text-theme-secondary">
              <a
                href="#"
                className="hover:text-theme-primary transition-colors"
              >
                Privacy Policy
              </a>
              <span>•</span>
              <a
                href="#"
                className="hover:text-theme-primary transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

