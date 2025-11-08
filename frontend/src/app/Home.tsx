import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import DynamicHeroImages from '../components/DynamicHeroImages';
import { useNotifications } from '../hooks/useNotifications';

export default function Home() {
  const { notifications, dismissNotification } = useNotifications();

  return (
    <Layout notifications={notifications} onDismissNotification={dismissNotification}>
      {/* Hero Section with Dynamic Images (Tally-inspired) */}
      <section className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Real-Time DAO Governance
          </h1>
          <p className="text-xl text-dark-text-secondary mb-8 max-w-2xl mx-auto">
            Instant proposal appearance, live vote tracking, and real-time quorum visualization.
            Powered by Somnia Data Streams.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/proposals" className="btn-primary">
              View Proposals
            </Link>
            <a
              href="https://docs.somnia.network/somnia-data-streams"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Learn More
            </a>
          </div>
        </motion.div>

        {/* Dynamic Hero Images - Tally-inspired bent effect */}
        <DynamicHeroImages />

        {/* Interactive Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mt-16"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-dark-bg-secondary border border-dark-bg-tertiary rounded-xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="SynapseGov" className="w-6 h-6" />
                <span className="font-semibold">SynapseGov</span>
              </div>
              <div className="flex gap-2 text-sm">
                <button className="px-3 py-1 rounded bg-dark-bg-tertiary">Home</button>
                <button className="px-3 py-1 rounded bg-brand-primary text-white">Proposals</button>
                <button className="px-3 py-1 rounded bg-dark-bg-tertiary">Activity</button>
              </div>
            </div>

            {/* Mock Proposal Cards */}
            <div className="space-y-4">
              <div className="bg-dark-bg-tertiary rounded-lg p-4 border border-brand-primary/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Proposal #1: Upgrade Protocol</h3>
                  <span className="text-xs px-2 py-1 rounded bg-status-warning/20 text-status-warning">Active</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-dark-text-secondary mb-3">
                  <span>By 0x1234...5678</span>
                  <span>•</span>
                  <span>2d 5h left</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-status-success">For: 1,234</span>
                    <span className="text-status-error">Against: 567</span>
                  </div>
                  <div className="w-full bg-dark-bg-primary rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '68%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="bg-brand-primary h-2 rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-dark-text-secondary">
                    <span>Quorum: 68%</span>
                    <span>Required: 50%</span>
                  </div>
                </div>
              </div>

              <div className="bg-dark-bg-tertiary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Proposal #2: Treasury Allocation</h3>
                  <span className="text-xs px-2 py-1 rounded bg-status-success/20 text-status-success">Passed</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-dark-text-secondary">
                  <span>By 0xabcd...efgh</span>
                  <span>•</span>
                  <span>5d ago</span>
                </div>
              </div>
            </div>

            {/* Live Activity Indicator */}
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-6 flex items-center gap-2 text-sm text-brand-accent"
            >
              <span className="w-2 h-2 bg-brand-accent rounded-full"></span>
              <span>Live updates via Somnia Data Streams</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card text-center"
        >
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-xl font-semibold mb-2">Instant Updates</h3>
          <p className="text-dark-text-secondary text-sm">
            Proposals and votes appear instantly without page refresh
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card text-center"
        >
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">Live Tracking</h3>
          <p className="text-dark-text-secondary text-sm">
            Watch vote counts and quorum progress update in real-time
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card text-center"
        >
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-xl font-semibold mb-2">Composable</h3>
          <p className="text-dark-text-secondary text-sm">
            Integrate with any DAO framework using Somnia Data Streams
          </p>
        </motion.div>
      </section>

      {/* Create Proposal Section - Right Aligned */}
      <section className="flex justify-end">
        <div className="w-full md:w-auto">
          <Link
            to="/proposals/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Proposal
          </Link>
        </div>
      </section>
    </Layout>
  );
}
