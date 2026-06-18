import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiFileText, FiUpload, FiX } from 'react-icons/fi'
import { prescriptionApi } from '../../api/prescriptionApi'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useLanguage } from '../../context/LanguageContext'

const ACCEPTED_TYPES = 'image/*,.pdf'
const MAX_FILE_MB = 4

export default function UploadPrescription() {
  const { ensureGuestToken } = useCustomerAuth()
  const { isBangla } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ patient_name: '', doctor_name: '', notes: '' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const t = useCallback((bn, en) => (isBangla ? bn : en), [isBangla])

  const fileSummary = useMemo(() => {
    if (!file) return null

    const sizeInMb = Number(file.size || 0) / (1024 * 1024)

    return {
      name: file.name,
      type: file.type || t('অজানা', 'Unknown'),
      size: `${sizeInMb.toFixed(sizeInMb >= 1 ? 1 : 2)} MB`,
    }
  }, [file, t])

  const previewKind = useMemo(() => {
    if (!file) return null
    if (file.type?.startsWith('image/')) return 'image'
    if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) return 'pdf'
    return 'file'
  }, [file])
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])

  const updateField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null

    if (selectedFile && selectedFile.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Prescription file must be ${MAX_FILE_MB} MB or smaller.`)
      event.target.value = ''
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  const clearFile = () => {
    setFile(null)
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!file) {
      toast.error(t('প্রেসক্রিপশন ফাইল নির্বাচন করুন।', 'Please select a prescription file.'))
      return
    }

    setLoading(true)

    const body = new FormData()
    body.append('prescription_file', file)
    Object.entries(form).forEach(([key, value]) => body.append(key, value || ''))

    try {
      ensureGuestToken()
      await prescriptionApi.create(body)
      toast.success(t('প্রেসক্রিপশন সফলভাবে আপলোড হয়েছে।', 'Prescription uploaded successfully.'))
      navigate(searchParams.get('returnTo') || '/prescriptions')
    } catch (error) {
      toast.error(error.response?.data?.message || t('প্রেসক্রিপশন আপলোড করা যায়নি।', 'Prescription upload failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* <PageHeader
        title={t('প্রেসক্রিপশন আপলোড', 'Upload prescription')}
        subtitle={t(
          'পরিষ্কার ছবি বা PDF দিন। রিভিউ শেষ হলে এটি প্রেসক্রিপশন-নির্ভর অর্ডারের জন্য ব্যবহার করতে পারবেন।',
          'Upload a clear image or PDF. After review, you can use it for prescription-required orders.',
        )}
      /> */}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white p-5 sm:p-6">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6574]">
            {t('Upload prescription', 'Upload prescription')}
          </div>
        </div>
        <Link
          to="/prescriptions"
          className="inline-flex items-center justify-center gap-1 px-5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:underline hover:text-emerald-700"
        >
          <FiFileText className="h-3 w-3" />
          {t('All prescriptions', 'All prescriptions')}
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form className="border border-slate-200 bg-white p-5 sm:p-6" onSubmit={submit}>
          {/* <div className="border-b border-slate-200 pb-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0e6574]">
              {t('প্রেসক্রিপশন ফাইল', 'Prescription file')}
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {t('ফাইল, রোগীর তথ্য, আর নোট এক জায়গায় দিন', 'Keep the file, patient details, and notes in one place')}
            </h2>
          </div> */}

          <div className=" grid gap-5">
            <label className="block cursor-pointer border border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-slate-400 hover:bg-white">
              <input type="file" accept={ACCEPTED_TYPES} className="sr-only" onChange={handleFileChange} />
              <div className="flex flex-col items-center justify-center text-center">
                <span className="inline-flex h-12 w-12 items-center justify-center border border-slate-200 bg-white text-slate-900">
                  <FiUpload className="h-5 w-5" />
                </span>
                <div className="mt-4 text-base font-semibold text-slate-950">
                  {fileSummary
                    ? t('নতুন ফাইল দিতে এখানে ক্লিক করুন', 'Click here to choose a new file')
                    : t('ছবি বা PDF আপলোড করুন', 'Upload an image or PDF')}
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-500">
                  {t('JPG, PNG, WebP অথবা PDF। সর্বোচ্চ', 'JPG, PNG, WebP, or PDF. Up to')} {MAX_FILE_MB} MB.
                </div>
              </div>
            </label>

            {fileSummary ? (
              <div className="border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    
                    <div className="mt-2 break-all text-base font-semibold text-slate-950">{fileSummary.name}</div>
                    <div className="mt-2 text-sm text-slate-500">
                      Format: <span className="font-semibold">{fileSummary.type}</span> • Size: <span className="font-semibold">{fileSummary.size}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="inline-flex h-10 w-10 items-center justify-center border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                    aria-label={t('নির্বাচিত ফাইল সরান', 'Remove selected file')}
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-sm font-medium text-slate-700">{t('রোগীর নাম', 'Patient name')}</div>
                <input
                  className="w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                  placeholder={t('যেমন: মো. করিম', 'For example: John Karim')}
                  value={form.patient_name}
                  onChange={updateField('patient_name')}
                />
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-medium text-slate-700">{t('ডাক্তারের নাম', 'Doctor name')}</div>
                <input
                  className="w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                  placeholder={t('যেমন: ডা. রহমান', 'For example: Dr. Rahman')}
                  value={form.doctor_name}
                  onChange={updateField('doctor_name')}
                />
              </label>
            </div>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">{t('নোট', 'Notes')}</div>
              <textarea
                className="min-h-[132px] w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                placeholder={t(
                  'ওষুধ, ডেলিভারি, বা রিভিউ নিয়ে কিছু জানাতে চাইলে এখানে লিখুন।',
                  'Add any note about the medicine, delivery, or prescription review here.',
                )}
                value={form.notes}
                onChange={updateField('notes')}
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
              <button
                disabled={loading}
                className="inline-flex items-center gap-2 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FiUpload className="h-4 w-4" />
                {loading ? t('আপলোড হচ্ছে...', 'Uploading...') : t('প্রেসক্রিপশন আপলোড করুন', 'Upload prescription')}
              </button>
              <div className="text-sm text-slate-500">
                {t('আপলোড শেষ হলে এটি প্রেসক্রিপশনস তালিকায় দেখা যাবে।', 'After upload, it will appear in the Prescriptions list.')}
              </div>
            </div>
          </div>
        </form>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="overflow-hidden border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="text-sm text-center font-semibold uppercase tracking-[0.18em] text-[#0e6574]">
                {t('প্রেসক্রিপশন প্রিভিউ', 'Prescription preview')}
              </div>
            </div>

            <div className="bg-slate-50 p-4">
              <div className="flex min-h-[420px] items-center justify-center border border-slate-200 bg-white">
                {!fileSummary ? (
                  <div className="max-w-[240px] text-center">
                    <span className="inline-flex h-14 w-14 items-center justify-center border border-slate-200 bg-slate-50 text-slate-800">
                      <FiFileText className="h-6 w-6" />
                    </span>
                    <div className="mt-4 text-base font-semibold text-slate-950">
                      {t('এখনও কোনো ফাইল নির্বাচন করা হয়নি', 'No file selected yet')}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {t(
                        'বাম পাশের আপলোড বক্স থেকে ছবি বা PDF বেছে নিলে এখানেই লাইভ প্রিভিউ দেখা যাবে।',
                        'Choose an image or PDF from the upload box and the live preview will appear here.',
                      )}
                    </p>
                  </div>
                ) : previewKind === 'image' && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={t('প্রেসক্রিপশন প্রিভিউ', 'Prescription preview')}
                    className="max-h-[560px] w-full object-contain"
                  />
                ) : previewKind === 'pdf' && previewUrl ? (
                  <iframe
                    src={previewUrl}
                    title={t('প্রেসক্রিপশন PDF প্রিভিউ', 'Prescription PDF preview')}
                    className="h-[560px] w-full"
                  />
                ) : (
                  <div className="max-w-[240px] text-center">
                    <span className="inline-flex h-14 w-14 items-center justify-center border border-slate-200 bg-slate-50 text-slate-800">
                      <FiFileText className="h-6 w-6" />
                    </span>
                    <div className="mt-4 text-base font-semibold text-slate-950">
                      {t('এই ফাইলের প্রিভিউ দেখানো যাচ্ছে না', 'Preview is not available for this file')}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {t('তবুও ফাইলটি আপলোড করা যাবে।', 'You can still upload this file.')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* <div className="grid gap-px border-t border-slate-200 bg-slate-200">
              <PreviewMeta
                label={t('ফাইল ধরন', 'File type')}
                value={fileSummary?.type || t('এখনও নেই', 'Not selected')}
              />
              <PreviewMeta
                label={t('ফাইল সাইজ', 'File size')}
                value={fileSummary?.size || `0 MB`}
              />
            </div> */}
          </div>
        </aside>
      </div>
    </>
  )
}
