import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import { FiArrowUpRight, FiClock, FiMail, FiPaperclip, FiPhone, FiSend, FiShield, FiUser } from 'react-icons/fi'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import PageHeader from '../../components/common/PageHeader'
import { date } from '../../utils/formatters'

const statuses = ['open', 'in_progress', 'resolved', 'closed']

function statusBadgeClass(status) {
  if (status === 'open') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'in_progress') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (status === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'closed') return 'border-slate-200 bg-slate-100 text-slate-600'
  return 'border-slate-200 bg-slate-50 text-slate-500'
}

function statusLabel(status) {
  if (!status) return 'Unknown'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function InfoCard({ icon: Icon, label, value, link = null }) {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-slate-950">{value}</div>
    </div>
  )

  if (!link) return content

  return (
    <Link to={link} className="block transition hover:opacity-90">
      {content}
    </Link>
  )
}

export default function SupportTicketDetails() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [staff, setStaff] = useState([])
  const [status, setStatus] = useState('')
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [attachmentKey, setAttachmentKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [savingAssign, setSavingAssign] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)

  const conversation = useMemo(() => {
    if (!ticket) return []

    return [
      {
        id: `ticket-${ticket.id}`,
        role: 'customer',
        author: ticket.user?.full_name || 'Customer',
        message: ticket.description,
        created_at: ticket.created_at,
        attachment_url: null,
      },
      ...(ticket.replies || []).map((replyItem) => ({
        id: `reply-${replyItem.id}`,
        role: replyItem.staff ? 'staff' : 'customer',
        author: replyItem.staff?.full_name || replyItem.customer?.full_name || 'Customer',
        message: replyItem.message,
        created_at: replyItem.created_at,
        attachment_url: replyItem.attachment_url,
      })),
    ]
  }, [ticket])

  const load = () => {
    setLoading(true)
    adminApi.show('support-tickets', id)
      .then((ticketRes) => {
        const nextTicket = ticketRes.data.data
        setTicket(nextTicket)
        setStatus(nextTicket.status)
        setAssignedStaffId(String(nextTicket.assigned_staff_id || ''))
        setStaff(nextTicket.staff_options || [])
      })
      .catch(() => toast.error('Unable to load support ticket details.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const assign = async () => {
    if (!assignedStaffId || assignedStaffId === String(ticket.assigned_staff_id || '')) return

    const result = await Swal.fire({
      title: 'Assign this ticket?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Assign',
      cancelButtonText: 'Cancel',
    })
    if (!result.isConfirmed) return

    setSavingAssign(true)
    try {
      const res = await adminApi.patch('support-tickets', id, 'assign', { assigned_staff_id: assignedStaffId })
      setTicket(res.data.data)
      setAssignedStaffId(String(res.data.data.assigned_staff_id || ''))
      setStatus(res.data.data.status)
      toast.success('Ticket assigned.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to assign ticket.')
    } finally {
      setSavingAssign(false)
    }
  }

  const updateStatus = async () => {
    if (!status || status === ticket.status) return

    const result = await Swal.fire({
      title: 'Update ticket status?',
      text: `${statusLabel(ticket.status)} to ${statusLabel(status)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
    })
    if (!result.isConfirmed) return

    setSavingStatus(true)
    try {
      const res = await adminApi.patch('support-tickets', id, 'status', { status })
      setTicket(res.data.data)
      setStatus(res.data.data.status)
      setAssignedStaffId(String(res.data.data.assigned_staff_id || ''))
      toast.success('Status updated.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update status.')
    } finally {
      setSavingStatus(false)
    }
  }

  const reply = async (event) => {
    event.preventDefault()
    const payload = new FormData()
    payload.append('message', message)
    if (attachment) payload.append('attachment', attachment)

    setSendingReply(true)
    try {
      const res = await adminApi.replySupportTicket(id, payload)
      setTicket(res.data.data)
      setStatus(res.data.data.status)
      setMessage('')
      setAttachment(null)
      setAttachmentKey((current) => current + 1)
      toast.success('Reply sent.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send reply.')
    } finally {
      setSendingReply(false)
    }
  }

  if (loading) return <AdminLoadingState className="py-8" />
  if (!ticket) return <p className="text-sm text-slate-600">Ticket not found.</p>

  const replyBlocked = ['closed'].includes(ticket.status)

  return (
    <>
      <PageHeader title="Support Ticket Details" subtitle="Track the conversation, assign ownership, and send updates from here." />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 px-5 py-6 text-white sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-100">
                Ticket #{ticket.id}
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">{ticket.subject}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-200">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(ticket.status)}`}>
                  {statusLabel(ticket.status)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <FiClock className="h-4 w-4" />
                  {date(ticket.created_at, 'en-US')}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoCard icon={FiUser} label="Customer" value={ticket.user?.full_name || '-'} link={ticket.user?.id ? `/admin/users/${ticket.user.id}` : null} />
              <InfoCard icon={FiPhone} label="Phone" value={ticket.user?.phone || '-'} />
              <InfoCard icon={FiMail} label="Assigned To" value={ticket.assigned_staff?.full_name || 'Unassigned'} />
              <InfoCard
                icon={FiShield}
                label="Linked Order"
                value={ticket.order?.order_number || 'No linked order'}
                link={ticket.order?.id ? `/admin/orders/${ticket.order.id}` : null}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
            <h3 className="text-sm font-semibold text-slate-950">Conversation</h3>
            <p className="mt-1 text-sm text-slate-500">Full support thread between the customer and staff.</p>
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-6">
            {conversation.map((item, index) => {
              const staffReply = item.role === 'staff'

              return (
                <div key={item.id} className={`flex ${staffReply ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3xl rounded-2xl border px-4 py-4 shadow-sm ${staffReply ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-white'}`}>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{index === 0 ? 'Customer issue' : item.author}</span>
                      <span>•</span>
                      <span>{staffReply ? 'Staff reply' : 'Customer message'}</span>
                      <span>•</span>
                      <span>{date(item.created_at, 'en-US')}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{item.message}</p>
                    {item.attachment_url ? (
                      <a
                        href={item.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
                      >
                        <FiPaperclip className="h-4 w-4" />
                        Open attachment
                      </a>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-950">Ticket Actions</h3>
            <p className="mt-1 text-sm text-slate-500">Assign a staff member and keep the ticket status updated.</p>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Assign Staff</label>
            <select
              value={assignedStaffId}
              onChange={(event) => setAssignedStaffId(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Select staff</option>
              {staff.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
            </select>
            <button
              type="button"
              disabled={!assignedStaffId || assignedStaffId === String(ticket.assigned_staff_id || '') || savingAssign}
              onClick={assign}
              className="mt-3 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {savingAssign ? 'Assigning...' : 'Assign Ticket'}
            </button>

            <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Update Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            >
              {statuses.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
            </select>
            <button
              type="button"
              disabled={status === ticket.status || savingStatus}
              onClick={updateStatus}
              className="mt-3 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {savingStatus ? 'Updating...' : 'Update Status'}
            </button>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ticket.user?.id ? (
                <Link
                  to={`/admin/users/${ticket.user.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                >
                  Open User
                  <FiArrowUpRight className="h-4 w-4" />
                </Link>
              ) : null}
              {ticket.order?.id ? (
                <Link
                  to={`/admin/orders/${ticket.order.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                >
                  Open Order
                  <FiArrowUpRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>

          <form onSubmit={reply} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-950">Send Reply</h3>
            <p className="mt-1 text-sm text-slate-500">
              Closed tickets do not accept new replies.
            </p>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              disabled={replyBlocked || sendingReply}
              placeholder="Write your response to the customer"
              className="mt-4 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />

            <input
              key={attachmentKey}
              type="file"
              disabled={replyBlocked || sendingReply}
              onChange={(event) => setAttachment(event.target.files?.[0] || null)}
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
            />

            {attachment ? (
              <p className="mt-2 text-xs text-slate-500">Selected file: {attachment.name}</p>
            ) : null}

            <button
              type="submit"
              disabled={replyBlocked || sendingReply || !message.trim()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <FiSend className="h-4 w-4" />
              <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
            </button>
          </form>
        </aside>
      </div>
    </>
  )
}
