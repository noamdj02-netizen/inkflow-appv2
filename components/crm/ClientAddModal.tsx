/**
 * Modal d'ajout de client — extrait de ClientList.tsx.
 */
import React from 'react';
import { Modal } from '../ui/Modal';

interface AddForm {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface ClientAddModalProps {
  addForm: AddForm;
  setAddForm: React.Dispatch<React.SetStateAction<AddForm>>;
  onClose: () => void;
  onSubmit: () => void;
  clientLimitReached?: boolean;
}

export const ClientAddModal: React.FC<ClientAddModalProps> = ({
  addForm,
  setAddForm,
  onClose,
  onSubmit,
  clientLimitReached,
}) => {
  return (
    <Modal isOpen onClose={onClose} title="Ajouter un client" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Nom</label>
          <input
            type="text"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Jean Dupont"
            className="w-full px-4 py-3 min-h-[48px] border border-neutral-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Email *</label>
          <input
            type="email"
            value={addForm.email}
            onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="client@exemple.com"
            className="w-full px-4 py-3 min-h-[48px] border border-neutral-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Téléphone</label>
          <input
            type="tel"
            value={addForm.phone}
            onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+33 6 12 34 56 78"
            className="w-full px-4 py-3 min-h-[48px] border border-neutral-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Notes</label>
          <textarea
            rows={3}
            value={addForm.notes}
            onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes sur ce client…"
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="min-h-[44px] px-6 py-3 border-2 border-neutral-200 dark:border-zinc-700 rounded-xl font-semibold hover:border-neutral-900 dark:hover:border-zinc-500"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={!addForm.email.trim() || clientLimitReached}
            className="min-h-[44px] px-6 py-3 bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ajouter
          </button>
        </div>
        {clientLimitReached && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Limite de votre plan atteinte. Passez au plan Studio pour ajouter plus de clients.
          </p>
        )}
      </div>
    </Modal>
  );
};
