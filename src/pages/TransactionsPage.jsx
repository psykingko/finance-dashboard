import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

import useFinanceStore from "../store/useFinanceStore.js";
import {
  applyFilters,
  sortTransactions,
  groupTransactions,
} from "../utils/filterUtils.js";

import FilterBar from "../components/transactions/FilterBar.jsx";
import ExportMenu from "../components/transactions/ExportMenu.jsx";
import TransactionTable from "../components/transactions/TransactionTable.jsx";
import TransactionForm from "../components/transactions/TransactionForm.jsx";
import Modal from "../components/ui/Modal.jsx";

const CATEGORIES = [
  "Food",
  "Rent",
  "Salary",
  "Entertainment",
  "Transport",
  "Healthcare",
  "Freelance",
  "Utilities",
];

export default function TransactionsPage() {
  const transactions = useFinanceStore((s) => s.transactions);
  const filters = useFinanceStore((s) => s.filters);
  const role = useFinanceStore((s) => s.role);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const setFilters = useFinanceStore((s) => s.setFilters);
  const resetFilters = useFinanceStore((s) => s.resetFilters);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Derive visible list: filter → sort → group
  const filtered = useMemo(
    () => applyFilters(transactions, filters),
    [transactions, filters],
  );

  const sorted = useMemo(
    () => sortTransactions(filtered, filters.sortField, filters.sortDir),
    [filtered, filters.sortField, filters.sortDir],
  );

  const grouped = useMemo(
    () => groupTransactions(sorted, filters.groupBy),
    [sorted, filters.groupBy],
  );

  // Derive unique categories from all transactions for FilterBar
  const categories = useMemo(() => {
    const fromData = [...new Set(transactions.map((tx) => tx.category))].sort();
    // Merge with known categories to ensure completeness
    const merged = [...new Set([...CATEGORIES, ...fromData])].sort();
    return merged;
  }, [transactions]);

  function openAddModal() {
    setEditingTransaction(null);
    setIsModalOpen(true);
  }

  function openEditModal(transaction) {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTransaction(null);
  }

  function handleFormSubmit(fields) {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, fields);
    } else {
      addTransaction(fields);
    }
    closeModal();
  }

  // Flatten grouped transactions for export (use sorted filtered list)
  const exportList = sorted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col lg:h-full"
    >
      {/* Fixed header and filters */}
      <div className="flex-shrink-0 flex flex-col gap-6 p-4 sm:p-6 pb-4 border-b border-black/8 dark:border-white/10">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Transactions
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {sorted.length} transaction{sorted.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ExportMenu transactions={exportList} />

            {role === "admin" && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                <Plus size={16} />
                Add Transaction
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar
          filters={filters}
          categories={categories}
          onChange={setFilters}
          onReset={resetFilters}
        />
      </div>

      {/* Scrollable transaction list */}
      <div className="flex-1 overflow-y-auto lg:overflow-y-auto p-4 sm:p-6 pt-4">
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([groupKey, groupTxs]) => (
            <div key={groupKey} className="flex flex-col gap-3">
              <div className="rounded-xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#0f1623] overflow-hidden">
                <TransactionTable
                  transactions={groupTxs}
                  role={role}
                  onEdit={openEditModal}
                  scrollable={filters.groupBy === "none"}
                  groupKey={filters.groupBy !== "none" ? groupKey : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
      >
        <TransactionForm
          initial={editingTransaction}
          onSubmit={handleFormSubmit}
          onClose={closeModal}
        />
      </Modal>
    </motion.div>
  );
}
