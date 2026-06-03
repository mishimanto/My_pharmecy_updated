import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../../layouts/AuthLayout'
import { useCustomerAuth } from '../../context/CustomerAuthContext'

export default function Register() {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useCustomerAuth()
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('অ্যাকাউন্ট তৈরি হয়েছে')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'রেজিস্ট্রেশন করা যায়নি')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    ['full_name', 'পূর্ণ নাম', 'text'],
    ['phone', 'ফোন নম্বর', 'text'],
    ['email', 'ইমেইল', 'email'],
    ['password', 'পাসওয়ার্ড', 'password'],
  ]

  return (
    <AuthLayout title="নতুন অ্যাকাউন্ট">
      <form className="space-y-3" onSubmit={submit}>
        {fields.map(([field, label, type]) => <input key={field} className="w-full rounded border px-3 py-2" type={type} placeholder={label} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />)}
        <button disabled={loading} className="w-full rounded bg-emerald-600 px-3 py-2 text-white disabled:opacity-60">{loading ? 'তৈরি হচ্ছে...' : 'রেজিস্টার'}</button>
      </form>
    </AuthLayout>
  )
}

