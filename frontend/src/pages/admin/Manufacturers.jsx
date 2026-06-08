import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { adminApi } from '../../api/adminApi'
import { getCachedList, setCachedList } from '../../utils/adminResourceCache'

const statusClass = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-700',
}

export default function Manufacturers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const initialCache = getCachedList('manufacturers', { search: '', page: 1 })
  const [manufacturers, setManufacturers] = useState(initialCache?.data || [])
  const [meta, setMeta] = useState(initialCache || null)
  const [loading, setLoading] = useState(!initialCache)
  const currentParams = useMemo(() => ({ search, page }), [page, search])

  useEffect(() => {
    const cached = getCachedList('manufacturers', currentParams)
    let syncTimer = null

    if (cached) {
      syncTimer = window.setTimeout(() => {
        setManufacturers(cached.data || [])
        setMeta(cached)
        setLoading(false)
      }, 0)
    }

    let active = true

    adminApi.list('manufacturers', currentParams).then(({ data }) => {
      if (!active) return
      const payload = data.data
      setManufacturers(payload.data || [])
      setMeta(payload)
      setCachedList('manufacturers', currentParams, payload)
    }).catch(() => active && toast.error('ম্যানুফ্যাকচারার লোড করা যায়নি।'))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
      if (syncTimer) window.clearTimeout(syncTimer)
    }
  }, [currentParams])

  const remove = async (manufacturer) => {
    const result = await Swal.fire({
      title: 'ম্যানুফ্যাকচারার ডিলিট করবেন?',
      text: manufacturer.manufacturer_name,
      showCancelButton: true,
      confirmButtonText: 'ডিলিট',
      cancelButtonText: 'বাতিল',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    await adminApi.remove('manufacturers', manufacturer.id)
    toast.success('ম্যানুফ্যাকচারার ডিলিট হয়েছে।')
    const payload = await adminApi.list('manufacturers', currentParams).then(({ data }) => data.data)
    setManufacturers(payload.data || [])
    setMeta(payload)
    setCachedList('manufacturers', currentParams, payload)
  }

  return (
    <>
      <PageHeader
        title="ম্যানুফ্যাকচারার"
        subtitle="Company details, logo, country এবং active status ম্যানেজ করুন।"
        action={<Link className="rounded bg-slate-950 px-4 py-2 text-sm text-white" to="/admin/manufacturers/create">নতুন ম্যানুফ্যাকচারার</Link>}
      />

      <input
        className="mb-4 w-full rounded border px-3 py-2"
        placeholder="নাম, দেশ বা স্ট্যাটাস দিয়ে খুঁজুন"
        value={search}
        onChange={(event) => { setSearch(event.target.value); setPage(1) }}
      />

      {loading && manufacturers.length === 0 && <ManufacturerListSkeleton />}
      {!loading && manufacturers.length === 0 && <EmptyState title="কোনো ম্যানুফ্যাকচারার নেই" text="নতুন company যোগ করলে এখানে দেখা যাবে।" />}

      {manufacturers.length > 0 ? (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-3">লোগো</th>
                <th className="px-3 py-3">নাম</th>
                <th className="px-3 py-3">দেশ</th>
                <th className="px-3 py-3">স্ট্যাটাস</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {manufacturers.map((manufacturer) => (
                <tr key={manufacturer.id} className="border-t">
                  <td className="px-3 py-3">
                    {manufacturer.logo_url ? (
                      <img src={manufacturer.logo_url} alt={manufacturer.manufacturer_name} className="h-12 w-12 rounded border object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded border bg-slate-50 text-xs font-semibold text-slate-500">
                        {manufacturer.manufacturer_name?.slice(0, 2)?.toUpperCase() || 'NA'}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-950">{manufacturer.manufacturer_name}</td>
                  <td className="px-3 py-3 text-slate-600">{manufacturer.country || '-'}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass[manufacturer.status] || statusClass.inactive}`}>
                      {manufacturer.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link className="rounded bg-slate-100 px-3 py-1.5" to={`/admin/manufacturers/${manufacturer.id}/edit`}>এডিট</Link>
                      <button className="rounded bg-rose-50 px-3 py-1.5 text-rose-700" onClick={() => remove(manufacturer)}>ডিলিট</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {meta ? (
        <div className="mt-4 flex justify-between text-sm">
          <span>পৃষ্ঠা {meta.current_page} / {meta.last_page}</span>
          <div className="flex gap-2">
            <button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>আগে</button>
            <button className="rounded border px-3 py-1 disabled:opacity-40" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}>পরে</button>
          </div>
        </div>
      ) : null}
    </>
  )
}

function ManufacturerListSkeleton() {
  return (
    <div className="rounded border bg-white p-4">
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="grid animate-pulse gap-3 border-b border-slate-100 pb-3 md:grid-cols-[80px_1.4fr_1fr_1fr_1fr]">
            <div className="h-12 w-12 rounded bg-slate-200" />
            <div className="h-5 rounded bg-slate-200" />
            <div className="h-5 rounded bg-slate-100" />
            <div className="h-5 rounded bg-slate-100" />
            <div className="h-5 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
