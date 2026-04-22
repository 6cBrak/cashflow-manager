import Modal from './Modal'

export default function ConfirmModal({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirmer'} size="sm">
      <p className="text-sm text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn-secondary">Annuler</button>
        <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>
          Confirmer
        </button>
      </div>
    </Modal>
  )
}
