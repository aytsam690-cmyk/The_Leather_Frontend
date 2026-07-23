import React, { useState, useEffect } from 'react';
import {
  DollarSign, Plus, Download, Search, Calendar, Filter, Trash2, Edit2,
  TrendingDown, FileSpreadsheet, X, Loader2, CheckCircle2, PieChart
} from 'lucide-react';
import useAdminStore from '../store/adminStore';
import { useCurrency } from '../../utils/currency';
import {
  getExpenses, getExpenseStats, createExpense, updateExpense, deleteExpense
} from '../adminApi';

const CATEGORIES = [
  'Materials & Supplies',
  'Shipping & Courier',
  'Marketing & Ads',
  'Salaries & Wages',
  'Rent & Utilities',
  'Software & Tools',
  'Miscellaneous'
];

const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Credit/Debit Card',
  'Easypaisa/JazzCash',
  'Other'
];

const CATEGORY_COLORS = {
  'Materials & Supplies': 'bg-amber-100 text-amber-800 border-amber-200',
  'Shipping & Courier': 'bg-blue-100 text-blue-800 border-blue-200',
  'Marketing & Ads': 'bg-purple-100 text-purple-800 border-purple-200',
  'Salaries & Wages': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Rent & Utilities': 'bg-orange-100 text-orange-800 border-orange-200',
  'Software & Tools': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Miscellaneous': 'bg-slate-100 text-slate-800 border-slate-200',
};

export default function Expenses() {
  const { setBreadcrumbs } = useAdminStore();
  const { formatPrice } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({
    totalAllTime: 0,
    totalThisMonth: 0,
    totalCount: 0,
    categoryBreakdown: []
  });

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Materials & Supplies',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: ''
  });

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Admin', path: '/aytsam-abdullah' },
      { label: 'Expenses', path: '/aytsam-abdullah/expenses' }
    ]);
  }, [setBreadcrumbs]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expensesRes, statsRes] = await Promise.all([
        getExpenses({
          page,
          limit: 30,
          search,
          category: selectedCategory,
          startDate,
          endDate
        }),
        getExpenseStats()
      ]);

      if (expensesRes) {
        setExpenses(expensesRes.expenses || []);
        setTotalPages(expensesRes.pages || 1);
        setTotalRecords(expensesRes.total || 0);
      }

      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Failed to load expenses data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, selectedCategory, startDate, endDate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadData();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const openAddModal = () => {
    setEditingExpense(null);
    setForm({
      title: '',
      category: 'Materials & Supplies',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setForm({
      title: expense.title || '',
      category: expense.category || 'Materials & Supplies',
      amount: expense.amount !== undefined ? expense.amount : '',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: expense.paymentMethod || 'Cash',
      notes: expense.notes || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || form.amount === '' || Number(form.amount) < 0) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount)
      };

      if (editingExpense) {
        await updateExpense(editingExpense._id, payload);
      } else {
        await createExpense(payload);
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save expense:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteExpense(deleteId);
      setDeleteId(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Export to CSV spreadsheet
  const handleExportCSV = () => {
    if (expenses.length === 0) return;

    const headers = ['Date', 'Title', 'Category', 'Amount (PKR)', 'Payment Method', 'Notes'];
    const rows = expenses.map(item => [
      new Date(item.date).toLocaleDateString(),
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      item.amount,
      `"${(item.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expenses_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const topCategory = stats.categoryBreakdown?.[0]?.category || 'N/A';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111111] flex items-center gap-2">
            <FileSpreadsheet className="text-[#C9A96E]" size={26} />
            Expense Tracker
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">
            Track, manage, and audit all store operating expenses in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={expenses.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm border border-[#D0D0CA] bg-white text-sm font-semibold text-[#111111] hover:bg-[#F8F8F6] transition-all disabled:opacity-50"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[#111111] text-white text-sm font-semibold hover:bg-[#2C2C26] transition-all"
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-sm border border-[#E8E8E4] shadow-sm">
          <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">This Month Expenses</span>
            <div className="p-2 rounded-full bg-red-50 text-red-600">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111111]">{formatPrice(stats.totalThisMonth || 0)}</p>
          <p className="text-xs text-[#9E9E9E] mt-1">Current month total</p>
        </div>

        <div className="bg-white p-5 rounded-sm border border-[#E8E8E4] shadow-sm">
          <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total All-Time</span>
            <div className="p-2 rounded-full bg-amber-50 text-amber-600">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111111]">{formatPrice(stats.totalAllTime || 0)}</p>
          <p className="text-xs text-[#9E9E9E] mt-1">{stats.totalCount || 0} total entries logged</p>
        </div>

        <div className="bg-white p-5 rounded-sm border border-[#E8E8E4] shadow-sm">
          <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Spending Category</span>
            <div className="p-2 rounded-full bg-purple-50 text-purple-600">
              <PieChart size={18} />
            </div>
          </div>
          <p className="text-lg font-bold text-[#111111] truncate">{topCategory}</p>
          <p className="text-xs text-[#9E9E9E] mt-1">Highest expense sector</p>
        </div>

        <div className="bg-white p-5 rounded-sm border border-[#E8E8E4] shadow-sm">
          <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Filtered Items</span>
            <div className="p-2 rounded-full bg-blue-50 text-blue-600">
              <Filter size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111111]">{totalRecords}</p>
          <p className="text-xs text-[#9E9E9E] mt-1">Matching current filters</p>
        </div>
      </div>

      {/* Filters & Control Bar */}
      <div className="bg-white p-4 rounded-sm border border-[#E8E8E4] shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
          <input
            type="text"
            placeholder="Search by title or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#D0D0CA] rounded-sm text-sm outline-none focus:border-[#111111] transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-52">
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-[#D0D0CA] rounded-sm text-sm outline-none bg-white focus:border-[#111111]"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-2.5 py-2 border border-[#D0D0CA] rounded-sm text-xs outline-none focus:border-[#111111]"
            title="Start Date"
          />
          <span className="text-xs text-[#9E9E9E]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-2.5 py-2 border border-[#D0D0CA] rounded-sm text-xs outline-none focus:border-[#111111]"
            title="End Date"
          />
          {(startDate || endDate || selectedCategory !== 'All' || search) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-sm transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet / Table */}
      <div className="bg-white rounded-sm border border-[#E8E8E4] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#9E9E9E] gap-2">
            <Loader2 size={24} className="animate-spin text-[#111111]" />
            <span className="text-sm font-medium">Loading expenses spreadsheet...</span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center text-[#9E9E9E]">
            <FileSpreadsheet size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-base font-semibold text-[#111111]">No Expense Entries Found</p>
            <p className="text-sm mt-1">Start by clicking "+ Add Expense" to log your first business expense.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#F8F8F6] border-b border-[#E8E8E4] text-[#6B6B6B] uppercase text-[11px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Title / Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E4]">
                {expenses.map((expense) => {
                  const badgeClass = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS['Miscellaneous'];
                  return (
                    <tr key={expense._id} className="hover:bg-[#F8F8F6]/80 transition-colors group">
                      <td className="py-3 px-4 text-xs font-medium text-[#111111] whitespace-nowrap">
                        {new Date(expense.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#111111]">
                        {expense.title}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#9B2226] whitespace-nowrap">
                        {formatPrice(expense.amount)}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#6B6B6B] whitespace-nowrap">
                        {expense.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#6B6B6B] max-w-xs truncate" title={expense.notes}>
                        {expense.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="p-1.5 rounded text-[#6B6B6B] hover:text-[#111111] hover:bg-[#E8E8E4] transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(expense._id)}
                            className="p-1.5 rounded text-[#6B6B6B] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#F8F8F6] border-t border-[#E8E8E4] flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Showing Page {page} of {totalPages} ({totalRecords} records)</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-[#D0D0CA] rounded bg-white font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-[#D0D0CA] rounded bg-white font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-[#E8E8E4] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E4] bg-[#F8F8F6]">
              <h3 className="font-bold text-[#111111] text-base flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-[#C9A96E]" />
                {editingExpense ? 'Edit Expense Record' : 'Add New Expense'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-[#9E9E9E] hover:text-[#111111]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1 uppercase tracking-wider">
                  Expense Title / Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leather Sheets Purchase, Facebook Ad Campaign..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D0D0CA] rounded-sm text-sm outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1 uppercase tracking-wider">
                    Amount (PKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="e.g. 15000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D0D0CA] rounded-sm text-sm outline-none focus:border-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1 uppercase tracking-wider">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D0D0CA] rounded-sm text-sm outline-none bg-white focus:border-[#111111]"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1 uppercase tracking-wider">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D0D0CA] rounded-sm text-sm outline-none focus:border-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1 uppercase tracking-wider">
                    Payment Method
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D0D0CA] rounded-sm text-sm outline-none bg-white focus:border-[#111111]"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1 uppercase tracking-wider">
                  Notes / Reference No.
                </label>
                <textarea
                  rows="2"
                  placeholder="Optional details, invoice receipt number, supplier notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D0D0CA] rounded-sm text-sm outline-none focus:border-[#111111]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E8E4]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-[#D0D0CA] rounded-sm hover:bg-[#F8F8F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 text-sm font-semibold bg-[#111111] text-white rounded-sm hover:bg-[#2C2C26] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-[#E8E8E4] p-6 max-w-sm w-full space-y-4">
            <h4 className="font-bold text-[#111111] text-lg">Confirm Delete</h4>
            <p className="text-sm text-[#6B6B6B]">
              Are you sure you want to delete this expense record? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-semibold border border-[#D0D0CA] rounded-sm hover:bg-[#F8F8F6]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
