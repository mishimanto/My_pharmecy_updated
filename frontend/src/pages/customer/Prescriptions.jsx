import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { FiCalendar, FiEye, FiFileText, FiTrash2, FiUploadCloud, FiUser } from 'react-icons/fi'
import EmptyState from '../../components/common/EmptyState'
import { prescriptionApi } from '../../api/prescriptionApi'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { readCustomerCache, writeCustomerCache } from '../../utils/customerDataCache'
import { date } from '../../utils/formatters'
import { prescriptionDisplayName, prescriptionSlug } from '../../utils/prescriptionDisplay'

const PRESCRIPTIONS_CACHE_KEY = 'prescriptions_list'

export default function Prescriptions() {
  const { loading: authLoading, ensureGuestToken } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const [items, setItems] = useState(() => readCustomerCache(PRESCRIPTIONS_CACHE_KEY, []))
  const [loading, setLoading] = useState(() => readCustomerCache(PRESCRIPTIONS_CACHE_KEY, null) === null)
  const [deletingId, setDeletingId] = useState(null)
  const t = (bn, en) => (isBangla ? bn : en)

  useEffect(() => {
    if (authLoading) return

    ensureGuestToken()
    prescriptionApi.list()
      .then(({ data }) => {
        const nextItems = data.data.data || []
        setItems(nextItems)
        writeCustomerCache(PRESCRIPTIONS_CACHE_KEY, nextItems)
      })
      .catch(() => toast.error(t('প্রেসক্রিপশন লোড করা যায়নি।', 'Prescriptions could not be loaded.')))
      .finally(() => setLoading(false))
  }, [authLoading, ensureGuestToken])

  const canUpload = items.length < 10

  const deletePrescription = async (item) => {
    const result = await Swal.fire({
      title: t('এই প্রেসক্রিপশন ডিলিট করবেন?', 'Delete this prescription?'),
      text: t('ডিলিট করলে এটি আর ব্যবহার করা যাবে না।', 'After deletion, it cannot be used again.'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('ডিলিট', 'Delete'),
      cancelButtonText: t('বাতিল', 'Cancel'),
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    setDeletingId(item.id)

    try {
      await prescriptionApi.destroy(item.id)
      const nextItems = items.filter((current) => String(current.id) !== String(item.id))
      setItems(nextItems)
      writeCustomerCache(PRESCRIPTIONS_CACHE_KEY, nextItems)
      toast.success(t('প্রেসক্রিপশন ডিলিট হয়েছে।', 'Prescription deleted successfully.'))
    } catch (error) {
      toast.error(error.response?.data?.message || t('প্রেসক্রিপশন ডিলিট করা যায়নি।', 'Prescription could not be deleted.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white p-5 sm:p-6">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6574]">{t('সব প্রেসক্রিপশন', 'All Prescriptions')}</div>
        </div>
        <Link
          className={`inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold transition ${
            canUpload
              ? 'bg-slate-950 text-white hover:bg-slate-800'
              : 'pointer-events-none bg-slate-200 text-slate-500'
          }`}
          to={canUpload ? '/upload-prescription' : '#'}
          aria-disabled={!canUpload}
        >
          <FiUploadCloud className="h-4 w-4" />
          {t('প্রেসক্রিপশন আপলোড', 'Upload prescription')}
        </Link>
      </div>

      {!canUpload ? (
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {t('আপনি সর্বোচ্চ ১০টি প্রেসক্রিপশন রাখতে পারবেন। নতুন প্রেসক্রিপশন আপলোড করার আগে পুরোনো একটি ডিলিট করুন।', 'You can keep up to 10 prescriptions. Delete an old prescription before uploading a new one.')}
        </div>
      ) : null}

      {loading && items.length === 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-48 animate-pulse border border-slate-200 bg-white" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="border border-slate-200 bg-white p-6">
          <EmptyState title={t('এখনও কোনো প্রেসক্রিপশন নেই', 'No prescriptions yet')} text={t('চেকআউটে ব্যবহার করার জন্য একটি প্রেসক্রিপশন আপলোড করুন।', 'Upload a prescription to use it during checkout.')} />
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item, index) => (
            <article key={item.id} className="border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-emerald-100 bg-emerald-50 text-emerald-700">
                    <FiFileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-950">{prescriptionDisplayName(index)}</h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <FiCalendar className="h-4 w-4" />
                      {date(item.uploaded_at || item.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    to={`/prescriptions/${prescriptionSlug(index)}`}
                  >
                    {t('দেখুন', 'View')}
                    <FiEye className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => deletePrescription(item)}
                    className="inline-flex h-10 w-10 items-center justify-center border border-rose-100 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Delete ${prescriptionDisplayName(index)}`}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoTile icon={FiUser} label="Patient" value={item.patient_name || '-'} />
                <InfoTile icon={FiUser} label="Doctor" value={item.doctor_name || '-'} />
              </div>

              <div className="mt-4 border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Review note</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.reviews?.[0]?.review_note || 'No review note added yet.'}</p>
              </div> */}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  )
}
