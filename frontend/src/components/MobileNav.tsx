import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WalletConnect from './WalletConnect';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import type { Notification } from '../types';

interface MobileNavProps {
  notifications?: Notification[];
  onDismissNotification?: (id: string) => void;
}

export default function MobileNav({ notifications = [], onDismissNotification }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 rounded-lg hover:bg-theme-tertiary transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={closeMenu}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-theme-secondary border-r border-theme-tertiary z-50 md:hidden overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
                    <img src="/logo.svg" alt="SynapseGov" className="w-8 h-8" />
                    <span className="text-xl font-bold text-theme-primary">SynapseGov</span>
                  </Link>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-4">
                  <Link
                    to="/"
                    onClick={closeMenu}
                    className="block px-4 py-3 rounded-lg text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/proposals"
                    onClick={closeMenu}
                    className="block px-4 py-3 rounded-lg text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary transition-colors"
                  >
                    Proposals
                  </Link>
                </nav>

                {/* Divider */}
                <div className="border-t border-theme-tertiary" />

                {/* Components */}
                <div className="space-y-4">
                  <div className="px-4">
                    <WalletConnect />
                  </div>
                  
                  <div className="px-4">
                    <NotificationCenter
                      notifications={notifications}
                      onDismiss={onDismissNotification || (() => {})}
                    />
                  </div>
                  
                  <div className="px-4">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

