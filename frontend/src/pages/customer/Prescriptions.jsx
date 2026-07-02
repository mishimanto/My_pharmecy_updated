import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { FiCalendar, FiEye, FiFileText, FiTrash2, FiUploadCloud } from 'react-icons/fi'
import EmptyState from '../../components/common/EmptyState'
import { prescriptionApi } from '../../api/prescriptionApi'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { customerQueryKeys, usePrescriptionsQuery } from '../../queries/customerQueries'
import { date } from '../../utils/formatters'
import { prescriptionSlug } from '../../utils/prescriptionDisplay'

const statusLabels = {
  pending: ['পেন্ডিং', 'Pending'],
  approved: ['অনুমোদিত', 'Approved'],
  rejected: ['রিজেক্টেড', 'Rejected'],
  need_clarification: ['আরও তথ্য প্রয়োজন', 'Needs clarification'],
}

const statusClasses = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  need_clarification: 'border-violet-200 bg-violet-50 text-violet-700',
}

function localizedNumber(value, isBangla) {
  return Number(value || 0).toLocaleString(isBangla ? 'bn-BD' : 'en-US')
}

function prescriptionName(index, isBangla) {
  return isBangla ? `প্রেসক্রিপশন ${localizedNumber(index + 1, true)}` : `Prescription ${index + 1}`
}

function statusText(status, isBangla) {
  const labels = statusLabels[status] || [status || 'স্ট্যাটাস নেই', status || 'No status']
  return isBangla ? labels[0] : labels[1]
}

export default function Prescriptions() {
  const queryClient = useQueryClient()
  const { loading: authLoading, ensureGuestToken } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const [deletingId, setDeletingId] = useState(null)
  const t = useCallback((bn, en) => (isBangla ? bn : en), [isBangla])
  const locale = isBangla ? 'bn-BD' : 'en-US'
  const prescriptionsQuery = usePrescriptionsQuery({
    enabled: !authLoading,
    placeholderData: (previous) => previous,
  })
  const items = useMemo(() => prescriptionsQuery.data || [], [prescriptionsQuery.data])
  const loading = prescriptionsQuery.isLoading

  useEffect(() => {
    if (!authLoading) {
      ensureGuestToken().catch(() => {})
    }
  }, [authLoading, ensureGuestToken])

  useEffect(() => {
    if (prescriptionsQuery.isError) {
      toast.error(t('প্রেসক্রিপশন লোড করা যায়নি।', 'Prescriptions could not be loaded.'))
    }
  }, [prescriptionsQuery.isError, t])

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
      queryClient.setQueryData(customerQueryKeys.prescriptions, (current = []) => (
        current.filter((prescription) => String(prescription.id) !== String(item.id))
      ))
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
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6574]">
            {t('সব প্রেসক্রিপশন', 'All Prescriptions')}
          </div>
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

      {loading && items.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="border border-slate-200 bg-white p-5 shadow-sm">
              <div className="animate-pulse">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="h-12 w-12 shrink-0 border border-emerald-100 bg-emerald-50" />
                    <div className="min-w-0 flex-1">
                      <div className="h-6 w-40 bg-slate-200" />
                      <div className="mt-3 h-4 w-32 bg-slate-100" />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <div className="hidden h-8 w-24 bg-slate-100 sm:block" />
                    <div className="h-10 w-20 bg-slate-200" />
                    <div className="h-10 w-10 bg-rose-50" />
                  </div>
                </div>

                <div className="mt-4 sm:hidden">
                  <div className="h-7 w-28 bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="border border-slate-200 bg-white p-6">
          <EmptyState title={t('এখনো কোনো প্রেসক্রিপশন নেই', 'No prescriptions yet')} text={t('চেকআউটে ব্যবহার করার জন্য একটি প্রেসক্রিপশন আপলোড করুন।', 'Upload a prescription to use it during checkout.')} />
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item, index) => (
            <article key={item.id} className="border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-emerald-100 bg-emerald-50 text-emerald-700">
                    <FiFileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-950">{prescriptionName(index, isBangla)}</h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <FiCalendar className="h-4 w-4" />
                      {date(item.uploaded_at || item.created_at, locale)}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className={`hidden border px-2.5 py-1 text-xs font-semibold sm:inline-flex ${statusClasses[item.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                    {statusText(item.status, isBangla)}
                  </span>
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
                    aria-label={`${t('ডিলিট', 'Delete')} ${prescriptionName(index, isBangla)}`}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 sm:hidden">
                <span className={`border px-2.5 py-1 text-xs font-semibold ${statusClasses[item.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                  {statusText(item.status, isBangla)}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}
