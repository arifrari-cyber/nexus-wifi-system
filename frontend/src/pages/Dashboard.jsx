import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Wifi, Calendar, User, Copy, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const isPaid = user?.accountSection === 'PAID';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Welcome back, {user?.fullName}</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your WiFi subscription and connection.</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
          isPaid ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
        }`}>
          {isPaid ? <CheckCircle size={16} /> : <Clock size={16} />}
          Account Status: {user?.accountSection}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass rounded-3xl p-8 space-y-6 premium-shadow"
        >
          <div className="flex items-center gap-3 text-primary-500 font-semibold text-lg">
            <Wifi size={24} />
            <h2>Connection Credentials</h2>
          </div>

          {!isPaid ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="p-4 bg-primary-500/10 rounded-full text-primary-500">
                <Wifi size={40} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Activate your Connection</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                  Your account is currently FREE. Subscribe to a plan to get your PPPoE credentials and enjoy high-speed internet.
                </p>
              </div>
              <Link to="/subscription" className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20">
                View Plans
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">PPPoE Username</label>
                <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-white/5 rounded-2xl group border border-transparent hover:border-primary-500/30 transition-all">
                  <span className="font-mono text-slate-800 dark:text-slate-200">{user?.pppoe_username}</span>
                  <button onClick={() => copyToClipboard(user?.pppoe_username, 'Username')} className="p-2 opacity-0 group-hover:opacity-100 text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">PPPoE Password</label>
                <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-white/5 rounded-2xl group border border-transparent hover:border-primary-500/30 transition-all">
                  <span className="font-mono text-slate-800 dark:text-slate-200">{user?.pppoe_password}</span>
                  <button onClick={() => copyToClipboard(user?.pppoe_password, 'Password')} className="p-2 opacity-0 group-hover:opacity-100 text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Subscription Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-8 space-y-6 premium-shadow"
        >
          <div className="flex items-center gap-3 text-emerald-500 font-semibold text-lg">
            <Calendar size={24} />
            <h2>Subscription</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <Clock className="text-slate-400" size={20} />
                <span className="text-slate-600 dark:text-slate-300">Expires on</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-white">
                {user?.expirationDate ? new Date(user.expirationDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            <div className="p-6 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl text-white space-y-2">
              <p className="text-primary-100 text-sm">Need more speed?</p>
              <h3 className="text-xl font-bold">Upgrade your plan</h3>
              <Link to="/subscription" className="block w-full text-center mt-4 py-3 bg-white text-primary-600 rounded-xl font-bold hover:bg-slate-100 transition-colors">
                View Packages
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
