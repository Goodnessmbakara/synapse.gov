import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Notification } from '../types';
// Using simple X icon instead of lucide-react

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export default function NotificationCenter({ notifications, onDismiss }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-theme-secondary hover:bg-theme-tertiary transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-status-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 bg-theme-secondary border border-theme-tertiary rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-4 border-b border-theme-tertiary flex items-center justify-between">
              <h3 className="font-semibold text-theme-primary">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-theme-secondary hover:text-theme-primary"
              >
                ✕
              </button>
            </div>
            
            <div className="divide-y divide-theme-tertiary">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`p-4 hover:bg-theme-tertiary transition-colors ${
                      !notification.read ? 'bg-theme-tertiary/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1 text-theme-primary">{notification.title}</h4>
                        <p className="text-xs text-theme-secondary">{notification.message}</p>
                        {notification.link && (
                          <a
                            href={notification.link}
                            className="text-xs text-brand-primary hover:underline mt-1 inline-block"
                          >
                            View →
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => onDismiss(notification.id)}
                        className="text-theme-secondary hover:text-theme-primary"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {notifications.length === 0 && (
              <div className="p-8 text-center text-theme-secondary text-sm">
                No notifications
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

