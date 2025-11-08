import { Link } from 'react-router-dom';
import WalletConnect from './WalletConnect';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import Footer from './Footer';
import type { Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  notifications?: Notification[];
  onDismissNotification?: (id: string) => void;
}

export default function Layout({ children, notifications = [], onDismissNotification }: LayoutProps) {
  return (
    <div className="min-h-screen bg-theme-primary flex flex-col">
      <nav className="border-b border-theme-tertiary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="SynapseGov" className="w-8 h-8" />
              <span className="text-xl font-bold text-theme-primary">SynapseGov</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link
                to="/proposals"
                className="text-theme-secondary hover:text-theme-primary transition-colors"
              >
                Proposals
              </Link>
              
              <WalletConnect />
              
              <NotificationCenter
                notifications={notifications}
                onDismiss={onDismissNotification || (() => {})}
              />
              
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}

