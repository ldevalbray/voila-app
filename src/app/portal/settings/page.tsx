import { LanguageSwitcher } from '@/components/language-switcher'

export default async function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-2 text-base text-slate-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Language Settings */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Language</h2>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}

