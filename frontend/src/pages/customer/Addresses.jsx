import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import PageHeader from '../../components/common/PageHeader'
import { addressApi } from '../../api/addressApi'
import { readCustomerCache, writeCustomerCache } from '../../utils/customerDataCache'

const ADDRESSES_CACHE_KEY = 'addresses_list'

function createForm() {
  return {
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    area: '',
    postal_code: '',
    is_default: false,
  }
}

export default function Addresses() {
  const [addresses, setAddresses] = useState(() => readCustomerCache(ADDRESSES_CACHE_KEY, []))
  const [form, setForm] = useState(createForm())
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(() => readCustomerCache(ADDRESSES_CACHE_KEY, null) === null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    addressApi.list()
      .then((res) => {
        const nextAddresses = res.data.data?.data || res.data.data || []
        setAddresses(nextAddresses)
        writeCustomerCache(ADDRESSES_CACHE_KEY, nextAddresses)
      })
      .catch(() => toast.error('Addresses could not be loaded.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      if (editingId) {
        await addressApi.update(editingId, form)
        toast.success('Address updated successfully.')
      } else {
        await addressApi.create(form)
        toast.success('Address saved successfully.')
      }

      setForm(createForm())
      setEditingId(null)
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Address could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const edit = (address) => {
    setEditingId(address.id)
    setForm({
      full_name: address.full_name || '',
      phone: address.phone || '',
      address_line_1: address.address_line_1 || '',
      address_line_2: address.address_line_2 || '',
      city: address.city || '',
      area: address.area || '',
      postal_code: address.postal_code || '',
      is_default: Boolean(address.is_default),
    })
  }

  const remove = async (address) => {
    const result = await Swal.fire({
      title: 'Delete this address?',
      text: `${address.area}, ${address.city}`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed) return

    try {
      await addressApi.remove(address.id)
      toast.success('Address deleted successfully.')
      if (editingId === address.id) {
        setEditingId(null)
        setForm(createForm())
      }
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Address could not be deleted.')
    }
  }

  const markDefault = async (addressId) => {
    try {
      await addressApi.setDefault(addressId)
      toast.success('Default address updated.')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Default address could not be updated.')
    }
  }

  return (
    <>
      <PageHeader title="Addresses" />

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <form onSubmit={submit} className="border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">{editingId ? 'Edit address' : 'New address'}</p>
              
            </div>
            {editingId ? (
              <button
                type="button"
                className="border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                onClick={() => {
                  setEditingId(null)
                  setForm(createForm())
                }}
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <AddressField label="Full name" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} />
            <AddressField label="Phone number" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <AddressField label="Address line 1" value={form.address_line_1} onChange={(value) => setForm({ ...form, address_line_1: value })} className="md:col-span-2" />
            <AddressField label="Address line 2" value={form.address_line_2} onChange={(value) => setForm({ ...form, address_line_2: value })} className="md:col-span-2" />
            <AddressField label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
            <AddressField label="Area" value={form.area} onChange={(value) => setForm({ ...form, area: value })} />
            <AddressField label="Postal code" value={form.postal_code} onChange={(value) => setForm({ ...form, postal_code: value })} />
            <label className="flex items-center gap-2 text-md text-slate-700">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(event) => setForm({ ...form, is_default: event.target.checked })}
              />
              Set as default address
            </label>
          </div>

          <button disabled={saving} className="mt-5 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
            {saving ? 'Saving address...' : editingId ? 'Update address' : 'Save address'}
          </button>
        </form>

        <section className="space-y-4">
          {loading ? <p className="text-sm text-slate-500">Loading addresses...</p> : null}
          {!loading && addresses.length === 0 ? (
            <div className="border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
              No saved addresses yet.
            </div>
          ) : null}
          {addresses.map((address) => (
            <div key={address.id} className="border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.22)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-950">{address.full_name}</h3>
                    {address.is_default ? <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Default</span> : null}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    {address.phone}<br />
                    {address.address_line_1}
                    {address.address_line_2 ? `, ${address.address_line_2}` : ''}<br />
                    {address.area}, {address.city}
                    {address.postal_code ? `, ${address.postal_code}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!address.is_default ? (
                    <button type="button" className="border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => markDefault(address.id)}>
                      Make default
                    </button>
                  ) : null}
                  <button type="button" className="border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => edit(address)}>
                    Edit
                  </button>
                  <button type="button" className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700" onClick={() => remove(address)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}

function AddressField({ label, value, onChange, className = '' }) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none"
      />
    </div>
  )
}
