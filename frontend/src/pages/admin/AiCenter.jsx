import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiCpu, FiRefreshCw, FiSearch, FiSettings, FiZap } from 'react-icons/fi'
import { adminApi } from '../../api/adminApi'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import EmptyState from '../../components/common/EmptyState'
import { date } from '../../utils/formatters'

const initialParams = {
  feature: '',
  status: '',
  search: '',
  date_from: '',
  date_to: '',
  page: 1,
  per_page: 15,
}

export default function AiCenter() {
  const [summary, setSummary] = useState(null)
  const [interactions, setInteractions] = useState(null)
  const [params, setParams] = useState(initialParams)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState(null)

  const rows = interactions?.data || []
  const features = summary?.features || []
  const featureOptions = useMemo(() => features.map((feature) => ({ value: feature.key, label: feature.label })), [features])

  const stats = useMemo(() => [
    { label: 'Customer AI', value: summary?.enabled ? 'Enabled' : 'Disabled', variant: summary?.enabled ? 'emerald' : 'rose', icon: FiCpu },
    { label: 'Provider Key', value: summary?.key_configured ? 'Ready' : 'Missing', variant: summary?.key_configured ? 'emerald' : 'amber', icon: summary?.key_configured ? FiCheckCircle : FiAlertTriangle },
    { label: 'AI Requests', value: summary?.stats?.total || 0, variant: 'sky', icon: FiActivity },
    { label: 'Failed Requests', value: summary?.stats?.failed || 0, variant: summary?.stats?.failed ? 'rose' : 'slate', icon: FiAlertTriangle },
  ], [summary])

  const loadSummary = () => adminApi.aiSummary()
    .then((response) => setSummary(response.data.data))
    .catch(() => toast.error('Unable to load AI summary.'))

  const loadInteractions = (nextParams = params) => {
    setUpdating(true)
    return adminApi.aiInteractions(cleanParams(nextParams))
      .then((response) => setInteractions(response.data.data))
      .catch(() => toast.error('Unable to load AI interactions.'))
      .finally(() => {
        setLoading(false)
        setUpdating(false)
      })
  }

  useEffect(() => {
    loadSummary()
  }, [])

  useEffect(() => {
    if (summary?.settings) {
      setSettingsForm({
        enabled: Boolean(summary.settings.enabled),
        provider: summary.settings.provider || 'openai',
        model: summary.settings.model || '',
        timeout: Number(summary.settings.timeout || 25),
        max_tokens: Number(summary.settings.max_tokens || 700),
        temperature: Number(summary.settings.temperature ?? 0.2),
        features: {
          product_questions: Boolean(summary.settings.features?.product_questions),
          smart_search: Boolean(summary.settings.features?.smart_search),
          support_assistant: Boolean(summary.settings.features?.support_assistant),
          prescription_summary: Boolean(summary.settings.features?.prescription_summary),
        },
      })
    }
  }, [summary])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParams((current) => current.search === search ? current : { ...current, search, page: 1 })
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    loadInteractions(params)
  }, [params])

  const refresh = () => {
    loadSummary()
    loadInteractions(params)
  }

  const updateSettingsField = (key, value) => {
    setSettingsForm((current) => ({ ...current, [key]: value }))
  }

  const updateFeature = (key, value) => {
    setSettingsForm((current) => ({
      ...current,
      features: {
        ...current.features,
        [key]: value,
      },
    }))
  }

  const saveSettings = async () => {
    if (!settingsForm) return

    setSavingSettings(true)

    try {
      await adminApi.updateAiSettings({
        ...settingsForm,
        model: settingsForm.model.trim() || null,
        timeout: Number(settingsForm.timeout),
        max_tokens: Number(settingsForm.max_tokens),
        temperature: Number(settingsForm.temperature),
      })
      toast.success('AI settings updated.')
      loadSummary()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update AI settings.')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} variant={item.variant} icon={item.icon} />
        ))}
      </div>

      <section className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg font-semibold text-slate-950">AI Center</h1>
              </div>
              <button
                type="button"
                onClick={refresh}
                className="inline-flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                <FiRefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-3">
            <ConfigItem label="Provider" value={summary?.provider || '-'} />
            <ConfigItem label="Model" value={summary?.model || 'Provider default'} />
            <ConfigItem label="Timeout" value={`${summary?.timeout || 0}s`} />
            <ConfigItem label="Max Tokens" value={summary?.max_tokens || '-'} />
            <ConfigItem label="Temperature" value={summary?.temperature ?? '-'} />
            <ConfigItem label="Token Usage" value={(summary?.stats?.tokens || 0).toLocaleString('en-US')} />
          </div>
        </div>

        <div className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Environment Checklist</h2>
          </div>
          <div className="space-y-2 p-5">
            {(summary?.env_keys || []).map((key) => (
              <div key={key} className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2 text-sm">
                <span className="font-mono text-xs text-slate-600">{key}</span>
                <span className="text-xs font-semibold text-slate-400">.env</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-4 border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">AI Controls</h2>
            </div>
            <button
              type="button"
              onClick={saveSettings}
              disabled={!settingsForm || savingSettings}
              className="inline-flex h-10 items-center justify-center gap-2 border border-emerald-600 bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingSettings ? 'Saving...' : 'Save AI Settings'}
            </button>
          </div>
        </div>

        {settingsForm ? (
          <div className="grid gap-5 p-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-4">
              <ToggleRow
                label="Customer AI"
                description="Master switch for all customer-facing AI features."
                checked={settingsForm.enabled}
                onChange={(checked) => updateSettingsField('enabled', checked)}
              />

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Provider</span>
                  <select
                    value={settingsForm.provider}
                    onChange={(event) => updateSettingsField('provider', event.target.value)}
                    className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  >
                    {['openai', 'gemini', 'anthropic', 'groq', 'deepseek', 'ollama', 'openrouter', 'xai'].map((provider) => (
                      <option key={provider} value={provider}>{label(provider)}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Model</span>
                  <input
                    value={settingsForm.model}
                    onChange={(event) => updateSettingsField('model', event.target.value)}
                    placeholder="Blank uses provider default"
                    className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Timeout seconds</span>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={settingsForm.timeout}
                    onChange={(event) => updateSettingsField('timeout', event.target.value)}
                    className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Max tokens</span>
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    value={settingsForm.max_tokens}
                    onChange={(event) => updateSettingsField('max_tokens', event.target.value)}
                    className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Temperature</span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settingsForm.temperature}
                    onChange={(event) => updateSettingsField('temperature', event.target.value)}
                    className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.key}
                  feature={feature}
                  checked={Boolean(settingsForm.features[feature.key])}
                  disabled={!settingsForm.enabled}
                  onChange={(checked) => updateFeature(feature.key, checked)}
                />
              ))}
            </div>
          </div>
        ) : (
          <AdminLoadingState className="py-8" />
        )}
      </section>

      <section className="mb-4 border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[170px_160px_160px_160px_minmax(0,1fr)]">
          <select
            value={params.feature}
            onChange={(event) => setParams({ ...params, feature: event.target.value, page: 1 })}
            className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All features</option>
            {featureOptions.map((feature) => <option key={feature.value} value={feature.value}>{feature.label}</option>)}
          </select>
          <select
            value={params.status}
            onChange={(event) => setParams({ ...params, status: event.target.value, page: 1 })}
            className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <input
            type="date"
            value={params.date_from}
            onChange={(event) => setParams({ ...params, date_from: event.target.value, page: 1 })}
            className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            type="date"
            value={params.date_to}
            onChange={(event) => setParams({ ...params, date_to: event.target.value, page: 1 })}
            className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <label className="relative block min-w-0">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search prompt, response, customer, or guest token"
              className="h-10 w-full border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>
      </section>

      {updating && !loading ? <AdminLoadingState className="justify-start pb-3" /> : null}
      {loading ? <AdminLoadingState className="py-8" /> : null}
      {!loading && rows.length === 0 ? (
        <EmptyState title="No AI interactions found" text="Customer product questions, smart searches, and support drafts will appear here." />
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Feature</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Prompt</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Tokens</th>
                <th className="px-4 py-3 text-center">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((interaction) => (
                <tr key={interaction.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-950">{label(interaction.feature)}</p>
                    <p className="mt-1 text-xs text-slate-500">{interaction.provider || '-'} {interaction.model ? `- ${interaction.model}` : ''}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-700">{interaction.user?.full_name || 'Guest session'}</p>
                    <p className="mt-1 text-xs text-slate-500">{interaction.user?.email || interaction.guest_token || '-'}</p>
                  </td>
                  <td className="max-w-xl px-4 py-4">
                    <p className="line-clamp-2 text-slate-700">{interaction.prompt || '-'}</p>
                    {interaction.error_message ? <p className="mt-2 line-clamp-1 text-xs font-medium text-rose-700">{interaction.error_message}</p> : null}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${statusClass(interaction.status)}`}>
                      {label(interaction.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-slate-700">{interaction.total_tokens || 0}</td>
                  <td className="px-4 py-4 text-center text-slate-600">{date(interaction.created_at, 'en-US')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {interactions?.last_page > 1 ? (
        <div className="mt-4 flex items-center justify-between border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="text-slate-500">
            Page {interactions.current_page} of {interactions.last_page}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={interactions.current_page <= 1}
              onClick={() => setParams((current) => ({ ...current, page: current.page - 1 }))}
              className="border border-slate-300 px-3 py-2 font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={interactions.current_page >= interactions.last_page}
              onClick={() => setParams((current) => ({ ...current, page: current.page + 1 }))}
              className="border border-slate-300 px-3 py-2 font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

function ConfigItem({ label: itemLabel, value }) {
  return (
    <div className="border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{itemLabel}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function FeatureCard({ feature, checked, disabled, onChange }) {
  const ready = feature.enabled && feature.configured

  return (
    <div className="border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center ${ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {ready ? <FiZap className="h-5 w-5" /> : <FiSettings className="h-5 w-5" />}
        </span>
        <ToggleSwitch checked={checked} disabled={disabled} onChange={onChange} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-950">{feature.label}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {ready ? 'Feature is ready for customers.' : feature.configured ? 'Feature toggle is off or master switch is disabled.' : 'Provider API key needs setup.'}
      </p>
    </div>
  )
}

function ToggleRow({ label: rowLabel, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 border border-slate-200 bg-slate-50 p-4">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-950">{rowLabel}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  )
}

function ToggleSwitch({ checked, disabled = false, onChange }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 border transition disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-slate-200'}`}
      aria-pressed={checked}
    >
      <span className={`absolute top-1 h-5 w-5 bg-white shadow-sm transition ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

function label(value) {
  return String(value || '-').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function statusClass(status) {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'failed') return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function cleanParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined))
}
