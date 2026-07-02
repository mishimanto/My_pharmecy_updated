import { useId, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

export default function AuthPasswordField({
  label,
  value,
  onChange,
  placeholder,
  error = '',
  className = 'mt-1',
  inputClassName = '',
  autoComplete = 'current-password',
  id,
}) {
  const generatedId = useId()
  const inputId = id || generatedId
  const [visible, setVisible] = useState(false)

  return (
    <div>
      {label ? <label htmlFor={inputId} className="text-sm font-medium text-slate-700">{label}</label> : null}
      <div className={`relative ${className}`}>
        <input
          id={inputId}
          className={`w-full border border-slate-300 px-4 py-3 pr-12 text-sm text-slate-900 outline-none placeholder:text-slate-400 ${inputClassName}`.trim()}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={onChange}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-0 top-0 inline-flex h-full w-12 items-center justify-center text-slate-500 transition hover:text-slate-900"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </div>
  )
}
