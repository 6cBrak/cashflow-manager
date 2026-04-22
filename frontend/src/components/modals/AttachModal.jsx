import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { uploadFichier } from '../../api/fichiers'

export default function AttachModal({ open, onClose, operation, onSaved }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!file) { toast.error('Sélectionnez un fichier.'); return }
    setLoading(true)
    try {
      await uploadFichier(operation.id, file)
      toast.success('Pièce jointe ajoutée.')
      onSaved()
      onClose()
    } catch (err) {
      const d = err.response?.data
      toast.error(d?.fichier?.[0] || d?.detail || 'Erreur lors de l\'upload.')
    } finally {
      setLoading(false)
      setFile(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Joindre un fichier" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Formats acceptés : PDF, JPG, PNG — Taille max : 5 Mo
        </p>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
          onClick={() => inputRef.current.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setFile(e.target.files[0] || null)}
          />
          {file ? (
            <p className="text-sm font-medium text-primary-700">{file.name}</p>
          ) : (
            <p className="text-sm text-gray-400">Cliquez pour sélectionner un fichier</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={loading || !file} className="btn-primary">
            {loading ? 'Upload…' : 'Joindre'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
