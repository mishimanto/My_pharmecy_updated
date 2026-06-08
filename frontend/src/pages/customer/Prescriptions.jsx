import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { prescriptionApi } from '../../api/prescriptionApi'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { date } from '../../utils/formatters'

const labels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', need_clarification: 'Needs clarification' }

export default function Prescriptions() {
  const { loading: authLoading, ensureGuestToken } = useCustomerAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    ensureGuestToken()
    prescriptionApi.list()
      .then(({ data }) => setItems(data.data.data || []))
      .catch(() => toast.error('Prescriptions could not be loaded.'))
      .finally(() => setLoading(false))
  }, [authLoading, ensureGuestToken])

  return (
    <>
      <PageHeader title="Prescriptions" subtitle="Review uploaded prescriptions and their pharmacist review status." action={<Link className="rounded bg-emerald-600 px-4 py-2 text-sm text-white" to="/upload-prescription">Upload</Link>} />
      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {!loading && items.length === 0 && <EmptyState title="No prescriptions yet" text="Upload a prescription to use it during checkout." />}
      {items.length > 0 && (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2">Patient</th>
                <th className="px-3 py-2">Doctor</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Review note</th>
                <th className="px-3 py-2">Uploaded</th>
                <th className="px-3 py-2">File</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">{item.patient_name || '-'}</td>
                  <td className="px-3 py-2">{item.doctor_name || '-'}</td>
                  <td className="px-3 py-2">{labels[item.status] || item.status}</td>
                  <td className="px-3 py-2">{item.reviews?.[0]?.review_note || '-'}</td>
                  <td className="px-3 py-2">{date(item.uploaded_at || item.created_at)}</td>
                  <td className="px-3 py-2">{item.file_url && <a className="text-emerald-700" href={item.file_url} target="_blank" rel="noreferrer">View</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
