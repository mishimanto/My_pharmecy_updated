import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'

const statuses = ['open', 'in_progress', 'resolved', 'closed']

export default function SupportTicketDetails() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [staff, setStaff] = useState([])
  const [status, setStatus] = useState('')
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminApi.show('support-tickets', id)
      .then((ticketRes) => {
        setTicket(ticketRes.data.data)
        setStatus(ticketRes.data.data.status)
        setAssignedStaffId(ticketRes.data.data.assigned_staff_id || '')
        setStaff(ticketRes.data.data.staff_options || [])
      })
      .catch(() => toast.error('Unable to load support ticket details.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const assign = async () => {
    if (!assignedStaffId) return
    const result = await Swal.fire({ title: 'Assign this ticket?', icon: 'question', showCancelButton: true, confirmButtonText: 'Assign', cancelButtonText: 'Cancel' })
    if (!result.isConfirmed) return
    try {
      const res = await adminApi.patch('support-tickets', id, 'assign', { assigned_staff_id: assignedStaffId })
      setTicket(res.data.data)
      toast.success('Ticket assigned.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to assign ticket.')
    }
  }

  const updateStatus = async () => {
    if (!status || status === ticket.status) return
    const result = await Swal.fire({ title: 'Update ticket status?', text: `${ticket.status} to ${status}`, icon: 'question', showCancelButton: true, confirmButtonText: 'Update', cancelButtonText: 'Cancel' })
    if (!result.isConfirmed) return
    try {
      const res = await adminApi.patch('support-tickets', id, 'status', { status })
      setTicket(res.data.data)
      toast.success('Status updated.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update status.')
    }
  }

  const reply = async (event) => {
    event.preventDefault()
    const payload = new FormData()
    payload.append('message', message)
    if (attachment) payload.append('attachment', attachment)
    try {
      const res = await adminApi.replySupportTicket(id, payload)
      setTicket(res.data.data)
      setMessage('')
      setAttachment(null)
      toast.success('Reply sent.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send reply.')
    }
  }

  if (loading) return <AdminLoadingState className="py-8" />
  if (!ticket) return <p className="text-sm text-slate-600">Ticket not found.</p>

  return (
    <>
      <PageHeader title={ticket.subject} subtitle={`${ticket.user?.full_name || 'Customer'} - ${ticket.status}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-700">{ticket.description}</p>
          </div>
          {ticket.replies?.map((replyItem) => (
            <div key={replyItem.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>{replyItem.staff ? `Staff: ${replyItem.staff.full_name}` : `Customer: ${replyItem.customer?.full_name || '-'}`}</span>
                <span>{date(replyItem.created_at, 'en-US')}</span>
              </div>
              <p className="text-sm text-slate-800">{replyItem.message}</p>
              {replyItem.attachment_url && <a href={replyItem.attachment_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-emerald-700">View Attachment</a>}
            </div>
          ))}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-950">Manage</h2>
            <select value={assignedStaffId} onChange={(event) => setAssignedStaffId(event.target.value)} className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select staff</option>
              {staff.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
            </select>
            <button onClick={assign} className="mt-3 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Assign</button>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button disabled={status === ticket.status} onClick={updateStatus} className="mt-3 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">Update Status</button>
          </div>
          <form onSubmit={reply} className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-950">Reply</h2>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} required placeholder="Write your reply" className="mt-3 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input type="file" onChange={(event) => setAttachment(event.target.files?.[0] || null)} className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <button className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Send Reply</button>
          </form>
        </aside>
      </div>
    </>
  )
}
