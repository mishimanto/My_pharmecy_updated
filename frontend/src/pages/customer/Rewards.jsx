import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiGift, FiPackage, FiShield, FiTruck } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import { orderApi } from '../../api/orderApi'
import { date, money } from '../../utils/formatters'

function tierFromPoints(points) {
  if (points >= 120) return { title: 'Gold member', next: null }
  if (points >= 60) return { title: 'Silver member', next: 120 }
  return { title: 'Starter member', next: 60 }
}

export default function Rewards() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderApi.list()
      .then((res) => setOrders(res.data.data?.data || []))
      .catch(() => toast.error('Rewards summary could not be loaded.'))
      .finally(() => setLoading(false))
  }, [])

  const summary = useMemo(() => {
    const deliveredOrders = orders.filter((order) => order.order_status === 'delivered')
    const totalSpent = deliveredOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    const points = Math.floor(totalSpent / 100)
    const tier = tierFromPoints(points)

    return {
      deliveredCount: deliveredOrders.length,
      totalSpent,
      points,
      tier,
      nextGap: tier.next ? Math.max(tier.next - points, 0) : 0,
      latestDelivered: deliveredOrders.slice(0, 3),
    }
  }, [orders])

  return (
    <>
      <PageHeader title="Rewards center" subtitle="Track your pharmacy member points, delivery history, and order-based progress from one place." />

      {loading ? <p className="text-sm text-slate-500">Loading rewards summary...</p> : null}

      {!loading ? (
        <div className="grid gap-6">
          <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.42)] sm:p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center border border-white/15 bg-white/10">
                <FiGift className="h-5 w-5" />
              </div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Member tier</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight">{summary.tier.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-300">
                This rewards view uses your delivered order activity to summarize a practical member-points program inside the pharmacy account center.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <RewardStat label="Member points" value={summary.points} />
                <RewardStat label="Delivered orders" value={summary.deliveredCount} />
                <RewardStat label="Delivered spend" value={money(summary.totalSpent)} />
              </div>
              {summary.tier.next ? (
                <div className="mt-6 border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  {summary.nextGap} more points to unlock the next tier.
                </div>
              ) : (
                <div className="mt-6 border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  Top tier reached based on current delivered-order activity.
                </div>
              )}
            </div>

            <div className="grid gap-4">
              <BenefitCard icon={FiPackage} title="Order-based progress" body="Delivered orders contribute to your member points summary and repeat-customer tier progress." />
              <BenefitCard icon={FiTruck} title="Delivery-linked activity" body="The more completed deliveries you receive, the stronger your order history and account insights become." />
              <BenefitCard icon={FiShield} title="Pharmacy loyalty context" body="Rewards stay connected to prescription-safe ordering rather than feeling like a generic ecommerce points box." />
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Delivered order activity</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Recent completed orders.</h2>
              </div>
              <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950">
                Open order history
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {summary.latestDelivered.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`} className="block border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-400">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{order.order_number}</p>
                      <p className="mt-1 text-sm text-slate-500">{date(order.order_date)} • {order.order_status}</p>
                    </div>
                    <div className="text-sm font-semibold text-slate-950">{money(order.total_amount)}</div>
                  </div>
                </Link>
              ))}
              {summary.latestDelivered.length === 0 ? <p className="text-sm text-slate-500">No delivered orders yet. Complete your first pharmacy order to start building points.</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}

function RewardStat({ label, value }) {
  return (
    <div className="border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
    </div>
  )
}

function BenefitCard({ icon: Icon, title, body }) {
  return (
    <div className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
      <div className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-950">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-500">{body}</p>
    </div>
  )
}
