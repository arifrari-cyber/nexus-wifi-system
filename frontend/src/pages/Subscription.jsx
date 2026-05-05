import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shield, Zap, Crown, CreditCard, ArrowRight, Loader2, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Subscription = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [trxId, setTrxId] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/api/subscription/packages');
      setPackages(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = async (pkg) => {
    try {
      setLoading(true);
      const res = await api.post('/api/payment/cck-te', {
        packageType: pkg.name,
        method: 'BKASH' // Defaulting for demo
      });
      setPaymentInfo(res.data.data);
      setSelectedPackage(pkg);
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!trxId) return toast.error('Please enter Transaction ID');
    
    setVerifying(true);
    try {
      const res = await api.post('/api/payment/verify', {
        tranId: paymentInfo.tranId,
        trxId: trxId,
        method: paymentInfo.method
      });
      if (res.data.success) {
        toast.success(res.data.message);
        // Refresh page or update user context
        setTimeout(() => window.location.href = '/dashboard', 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  if (loading && !packages.length) {
    return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white">Choose Your Plan</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">Get the best internet experience with our premium WiFi packages tailored for your needs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packages.map((pkg, idx) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative glass rounded-[2.5rem] p-8 flex flex-col premium-shadow transition-all border-2 ${
              pkg.recommended ? 'border-primary-500 scale-105 z-10' : 'border-transparent'
            }`}
          >
            {pkg.recommended && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                Recommended
              </span>
            )}

            <div className="flex items-center justify-between mb-8">
              <div className={`p-3 rounded-2xl ${
                pkg.name === 'GOLD' ? 'bg-amber-500/20 text-amber-500' :
                pkg.name === 'SILVER' ? 'bg-primary-500/20 text-primary-500' :
                'bg-slate-500/20 text-slate-500'
              }`}>
                {pkg.name === 'GOLD' ? <Crown size={24} /> : pkg.name === 'SILVER' ? <Zap size={24} /> : <Shield size={24} />}
              </div>
              <span className="text-slate-400 font-medium">{pkg.speed}</span>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{pkg.name}</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold text-slate-800 dark:text-white">৳{pkg.price}</span>
              <span className="text-slate-400">/month</span>
            </div>

            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Check size={18} className="text-emerald-500" />
                <span>Unlimited Data Usage</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Check size={18} className="text-emerald-500" />
                <span>Fiber Optic Connectivity</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Check size={18} className="text-emerald-500" />
                <span>24/7 Priority Support</span>
              </li>
            </ul>

            <button
              onClick={() => handleSelectPackage(pkg)}
              className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                pkg.recommended ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-600/30' : 'bg-slate-200 dark:bg-white/5 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-white/10'
              }`}
            >
              Get Started <ArrowRight size={18} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPaymentInfo(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
            >
              <button
                onClick={() => setPaymentInfo(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-slate-400"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-primary-500/20 text-primary-500 rounded-2xl flex items-center justify-center mx-auto">
                  <CreditCard size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Complete Payment</h2>
                  <p className="text-slate-500 dark:text-slate-400">Send ৳{selectedPackage?.price} to the number below via bKash.</p>
                </div>

                <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Merchant Number:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{paymentInfo.paymentNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Reference ID:</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{paymentInfo.tranId}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-left space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-2">Transaction ID (TrxID)</label>
                    <input
                      type="text"
                      placeholder="Enter TrxID after payment"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-transparent focus:border-primary-500 focus:ring-0 transition-all font-mono"
                    />
                  </div>
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {verifying ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                    Verify Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Subscription;
