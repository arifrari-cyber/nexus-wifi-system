import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Edit2, Check, X, Shield, User as UserIcon, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({
      accountSection: user.accountSection,
      pppoe_username: user.pppoe_username || '',
      pppoe_password: user.pppoe_password || '',
      expirationDate: user.expirationDate ? user.expirationDate.split('T')[0] : ''
    });
  };

  const handleUpdate = async (id) => {
    try {
      await api.put(`/api/admin/user/${id}`, editForm);
      toast.success('User updated successfully');
      setEditingId(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.mobile.includes(search)
  );

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Admin Control Center</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage all users and their WiFi credentials.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-white/5 border border-transparent focus:border-primary-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="glass rounded-[2rem] overflow-hidden premium-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-slate-100/50 dark:bg-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">PPPoE Credentials</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Expiration</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{user.fullName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <select
                        value={editForm.accountSection}
                        onChange={(e) => setEditForm({...editForm, accountSection: e.target.value})}
                        className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-sm outline-none"
                      >
                        <option value="FREE">FREE</option>
                        <option value="PAID">PAID</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        user.accountSection === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {user.accountSection}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={editForm.pppoe_username}
                          onChange={(e) => setEditForm({...editForm, pppoe_username: e.target.value})}
                          placeholder="User"
                          className="w-full bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={editForm.pppoe_password}
                          onChange={(e) => setEditForm({...editForm, pppoe_password: e.target.value})}
                          placeholder="Pass"
                          className="w-full bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 text-xs"
                        />
                      </div>
                    ) : (
                      <div className="text-xs font-mono">
                        <p className="text-slate-400">U: <span className="text-slate-700 dark:text-slate-300">{user.pppoe_username || 'N/A'}</span></p>
                        <p className="text-slate-400">P: <span className="text-slate-700 dark:text-slate-300">{user.pppoe_password || 'N/A'}</span></p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <input
                        type="date"
                        value={editForm.expirationDate}
                        onChange={(e) => setEditForm({...editForm, expirationDate: e.target.value})}
                        className="bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 text-xs"
                      />
                    ) : (
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {user.expirationDate ? new Date(user.expirationDate).toLocaleDateString() : 'Never'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {editingId === user.id ? (
                        <>
                          <button onClick={() => handleUpdate(user.id)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(user)} className="p-2 bg-primary-500/10 text-primary-500 rounded-lg hover:bg-primary-500/20 transition-all">
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
