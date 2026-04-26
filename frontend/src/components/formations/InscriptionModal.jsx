import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Modal from '../modals/Modal'
import { createInscription } from '../../api/formations'
import { getFormations, getPayeurs, createPayeur } from '../../api/formations'

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY = {
  civilite: 'M',
  nom: '', prenom: '', telephone: '', email: '',
  date_naissance: '', lieu_naissance: '',
  nationalite: 'Burkinabè',
  ville: '', quartier: '', secteur: '',
  cnib_numero: '', cnib_date: '', cnib_lieu: '',
  contact_urgence_nom: '', contact_urgence_tel: '',
  formation: '', centre: 'OUAGA', option_cours: 'JOUR',
  niveau_etude: '', statut_professionnel: '', nom_employeur: '',
  projet_apres_formation: '',
  qui_paye: 'MOI_MEME', payeur: '',
  montant_formation: '', bourse_pourcentage: 0,
  frais_inscription: 15000, nombre_tranches: 1,
  date_inscription: today(),
}

const fmt = (n) => Number(n).toLocaleString('fr-FR')

export default function InscriptionModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [formations, setFormations] = useState([])
  const [payeurs, setPayeurs] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1=identité, 2=formation+paiement
  const [newPayeur, setNewPayeur] = useState({ nom: '', telephone: '', type_payeur: 'PARRAIN' })
  const [showNewPayeur, setShowNewPayeur] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setStep(1)
      setShowNewPayeur(false)
      getFormations({ actif: 'true' }).then(r => setFormations(r.data.results || r.data)).catch(() => {})
      getPayeurs().then(r => setPayeurs(r.data.results || r.data)).catch(() => {})
    }
  }, [open])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const selectedFormation = formations.find(f => String(f.id) === String(form.formation))

  // Calcul automatique
  const fraisInscription = Number(form.frais_inscription) || 15000
  const montantFormation = Number(form.montant_formation) || 0
  const reste = Math.max(0, montantFormation - fraisInscription)
  const reduction = Math.round(reste * Number(form.bourse_pourcentage) / 100)
  const netTranches = reste - reduction
  const parTranche = form.nombre_tranches > 0 ? Math.round(netTranches / form.nombre_tranches) : 0
  const totalDu = fraisInscription + netTranches

  const handleFormationChange = (e) => {
    const f = formations.find(f => String(f.id) === e.target.value)
    set('formation', e.target.value)
    if (f) set('montant_formation', f.prix_base)
  }

  const handleAddPayeur = async () => {
    if (!newPayeur.nom.trim()) return
    try {
      const { data } = await createPayeur(newPayeur)
      setPayeurs(p => [...p, data])
      set('payeur', data.id)
      setShowNewPayeur(false)
      setNewPayeur({ nom: '', telephone: '', type_payeur: 'PARRAIN' })
      toast.success('Payeur ajouté.')
    } catch {
      toast.error('Erreur création payeur.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nom.trim() || !form.prenom.trim() || !form.telephone.trim()) {
      toast.error('Nom, prénom et téléphone sont obligatoires.')
      return
    }
    if (!form.formation) { toast.error('Sélectionnez une formation.'); return }
    if (!form.montant_formation || Number(form.montant_formation) <= 0) {
      toast.error('Saisissez le montant de la formation.'); return
    }
    if (form.qui_paye !== 'MOI_MEME' && !form.payeur) {
      toast.error('Sélectionnez ou créez le payeur.'); return
    }

    const payload = {
      ...form,
      montant_formation: Number(form.montant_formation),
      bourse_pourcentage: Number(form.bourse_pourcentage),
      frais_inscription: Number(form.frais_inscription),
      nombre_tranches: Number(form.nombre_tranches),
      payeur: form.qui_paye === 'MOI_MEME' ? null : form.payeur || null,
      date_naissance: form.date_naissance || null,
      cnib_date: form.cnib_date || null,
    }

    setLoading(true)
    try {
      await createInscription(payload)
      toast.success('Inscription créée.')
      onSaved()
      onClose()
    } catch (err) {
      const detail = err.response?.data
      const msg = typeof detail === 'string' ? detail
        : detail?.detail || Object.values(detail || {})[0]?.[0] || 'Erreur lors de la création.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle inscription" size="xl">
      {/* Étapes */}
      <div className="flex gap-1 mb-5">
        {[{ n: 1, label: 'Identité' }, { n: 2, label: 'Formation & Paiement' }].map(s => (
          <button
            key={s.n}
            type="button"
            onClick={() => setStep(s.n)}
            className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
              step === s.n ? 'bg-primary-700 text-white border-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {s.n}. {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* ÉTAPE 1 — Identité */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Civilité *</label>
                <select className="input" value={form.civilite} onChange={e => set('civilite', e.target.value)}>
                  <option value="M">M.</option>
                  <option value="MME">Mme</option>
                  <option value="MLLE">Mlle</option>
                </select>
              </div>
              <div>
                <label className="label">Nom *</label>
                <input className="input" required value={form.nom} onChange={e => set('nom', e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="label">Prénom(s) *</label>
                <input className="input" required value={form.prenom} onChange={e => set('prenom', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date de naissance</label>
                <input type="date" className="input" value={form.date_naissance} onChange={e => set('date_naissance', e.target.value)} />
              </div>
              <div>
                <label className="label">Lieu de naissance</label>
                <input className="input" value={form.lieu_naissance} onChange={e => set('lieu_naissance', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Téléphone *</label>
                <input className="input" required value={form.telephone} onChange={e => set('telephone', e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Nationalité</label>
                <input className="input" value={form.nationalite} onChange={e => set('nationalite', e.target.value)} />
              </div>
              <div>
                <label className="label">Ville</label>
                <input className="input" value={form.ville} onChange={e => set('ville', e.target.value)} />
              </div>
              <div>
                <label className="label">Quartier / Secteur</label>
                <input className="input" value={form.quartier} onChange={e => set('quartier', e.target.value)} placeholder="Quartier" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">N° CNIB</label>
                <input className="input" value={form.cnib_numero} onChange={e => set('cnib_numero', e.target.value)} />
              </div>
              <div>
                <label className="label">Date CNIB</label>
                <input type="date" className="input" value={form.cnib_date} onChange={e => set('cnib_date', e.target.value)} />
              </div>
              <div>
                <label className="label">Lieu CNIB</label>
                <input className="input" value={form.cnib_lieu} onChange={e => set('cnib_lieu', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Niveau d'étude</label>
                <select className="input" value={form.niveau_etude} onChange={e => set('niveau_etude', e.target.value)}>
                  <option value="">—</option>
                  {[['BEPC','BEPC'],['BAC','BAC'],['BAC_PLUS','BAC+'],['LICENCE','Licence'],['M1_M2','M1/M2']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Statut professionnel</label>
                <select className="input" value={form.statut_professionnel} onChange={e => set('statut_professionnel', e.target.value)}>
                  <option value="">—</option>
                  {[['EMPLOYE_TP','Employé temps plein'],['FREELANCE','Free-lance'],['STAGIAIRE','Stagiaire'],['ENTREPRENEUR','Entrepreneur'],['ETUDIANT','Étudiant(e)'],['AUTRE','Autre']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Employeur</label>
                <input className="input" value={form.nom_employeur} onChange={e => set('nom_employeur', e.target.value)} />
              </div>
              <div>
                <label className="label">Personne à contacter (urgence)</label>
                <div className="flex gap-1">
                  <input className="input" placeholder="Nom" value={form.contact_urgence_nom} onChange={e => set('contact_urgence_nom', e.target.value)} />
                  <input className="input w-32" placeholder="Tél" value={form.contact_urgence_tel} onChange={e => set('contact_urgence_tel', e.target.value)} />
                </div>
              </div>
            </div>
            <div>
              <label className="label">Projet après la formation</label>
              <textarea rows={2} className="input resize-none" value={form.projet_apres_formation} onChange={e => set('projet_apres_formation', e.target.value)} />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setStep(2)} className="btn-primary">Suivant →</button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 — Formation & Paiement */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Formation *</label>
                <select className="input" required value={form.formation} onChange={handleFormationChange}>
                  <option value="">Sélectionner…</option>
                  {['INFORMATIQUE','HUMANITAIRE'].map(prog => (
                    <optgroup key={prog} label={prog === 'INFORMATIQUE' ? 'Informatique & Management' : 'Action Humanitaire'}>
                      {formations.filter(f => f.programme === prog).map(f => (
                        <option key={f.id} value={f.id}>{f.nom}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date d'inscription *</label>
                <input type="date" className="input" required value={form.date_inscription} onChange={e => set('date_inscription', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Centre *</label>
                <select className="input" value={form.centre} onChange={e => set('centre', e.target.value)}>
                  <option value="OUAGA">EPA Ouagadougou</option>
                  <option value="BOBO">EPA Bobo</option>
                  <option value="SAHEL">EPA Sahel/Dori</option>
                </select>
              </div>
              <div>
                <label className="label">Option cours *</label>
                <select className="input" value={form.option_cours} onChange={e => set('option_cours', e.target.value)}>
                  <option value="JOUR">Jour</option>
                  <option value="SOIR">Soir</option>
                  <option value="EN_LIGNE">En ligne</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-3">
              <h3 className="text-xs font-semibold text-gray-600 mb-2">Paiement</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Montant formation (FCFA) *</label>
                  <input type="number" className="input text-right font-mono" required
                    value={form.montant_formation}
                    onChange={e => set('montant_formation', e.target.value)} />
                  {selectedFormation && Number(form.montant_formation) !== Number(selectedFormation.prix_base) && (
                    <p className="text-xs text-amber-600 mt-0.5">Prix catalogue : {fmt(selectedFormation.prix_base)} FCFA (modifié)</p>
                  )}
                </div>
                <div>
                  <label className="label">Frais d'inscription (FCFA)</label>
                  <input type="number" className="input text-right font-mono"
                    value={form.frais_inscription}
                    onChange={e => set('frais_inscription', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="label">Bourse (%)</label>
                  <select className="input" value={form.bourse_pourcentage} onChange={e => set('bourse_pourcentage', e.target.value)}>
                    {[0,5,10,15,20,25,30,35,40,45,50].map(p => <option key={p} value={p}>{p}%</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Nombre de tranches</label>
                  <select className="input" value={form.nombre_tranches} onChange={e => set('nombre_tranches', e.target.value)}>
                    <option value={1}>1 tranche</option>
                    <option value={2}>2 tranches</option>
                    <option value={3}>3 tranches</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Récapitulatif calcul */}
            {montantFormation > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                <div className="font-semibold text-amber-800 mb-2 text-xs">Récapitulatif financier</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <span className="text-gray-600">Prix formation :</span><span className="font-mono font-bold">{fmt(montantFormation)} FCFA</span>
                  <span className="text-gray-600">Frais inscription (payés maintenant) :</span><span className="font-mono">{fmt(fraisInscription)} FCFA</span>
                  <span className="text-gray-600">Reste avant bourse :</span><span className="font-mono">{fmt(reste)} FCFA</span>
                  {form.bourse_pourcentage > 0 && <><span className="text-gray-600">Bourse {form.bourse_pourcentage}% :</span><span className="font-mono text-green-700">- {fmt(reduction)} FCFA</span></>}
                  <span className="text-gray-600">Net en {form.nombre_tranches} tranche(s) de :</span><span className="font-mono font-bold text-primary-700">{fmt(parTranche)} FCFA</span>
                  <span className="font-semibold text-amber-800">Total à payer :</span><span className="font-mono font-bold text-amber-800">{fmt(totalDu)} FCFA</span>
                </div>
              </div>
            )}

            {/* Qui paye */}
            <div>
              <label className="label">Qui paye les frais ?</label>
              <select className="input" value={form.qui_paye} onChange={e => { set('qui_paye', e.target.value); set('payeur', '') }}>
                <option value="MOI_MEME">Moi-même</option>
                <option value="PARRAIN">Mon parrain</option>
                <option value="ENTREPRISE">Mon Entreprise / ONG</option>
              </select>
            </div>
            {form.qui_paye !== 'MOI_MEME' && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="label mb-0">Payeur *</label>
                  <button type="button" onClick={() => setShowNewPayeur(v => !v)} className="text-xs text-primary-600 hover:underline">
                    {showNewPayeur ? 'Annuler' : '+ Nouveau payeur'}
                  </button>
                </div>
                {showNewPayeur ? (
                  <div className="flex gap-2">
                    <select className="input w-36" value={newPayeur.type_payeur} onChange={e => setNewPayeur(p => ({...p, type_payeur: e.target.value}))}>
                      <option value="PARRAIN">Parrain</option>
                      <option value="ENTREPRISE">Entreprise/ONG</option>
                    </select>
                    <input className="input flex-1" placeholder="Nom *" value={newPayeur.nom} onChange={e => setNewPayeur(p => ({...p, nom: e.target.value}))} />
                    <input className="input w-36" placeholder="Téléphone" value={newPayeur.telephone} onChange={e => setNewPayeur(p => ({...p, telephone: e.target.value}))} />
                    <button type="button" onClick={handleAddPayeur} className="btn-primary text-xs px-3">Ajouter</button>
                  </div>
                ) : (
                  <select className="input" value={form.payeur} onChange={e => set('payeur', e.target.value)}>
                    <option value="">Sélectionner…</option>
                    {payeurs.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.type_payeur})</option>)}
                  </select>
                )}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">← Retour</button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Enregistrement…' : 'Créer l\'inscription'}
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
