import { useState, useEffect } from 'react'
import { configApi } from '../../api/adminApi'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'

interface SystemConfig {
  trialDurationDays: number
  defaultNewUserPlan: string
  defaultLanguage: string
  emailTemplates: {
    welcome: string
    memberInvite: string
    passwordReset: string
  }
  paymentServiceConfig: {
    provider: string
    apiKey: string
  }
  emailServiceConfig: {
    provider: string
    apiKey: string
  }
}

export function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const data = await configApi.get()
      setConfig(data)
    } catch (error: any) {
      toast.error('Erro ao carregar configurações')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    try {
      setSaving(true)
      await configApi.update(config)
      toast.success('Configurações salvas com sucesso')
    } catch (error: any) {
      toast.error('Erro ao salvar configurações')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!config) {
    return null
  }

  // Garantir que todas as propriedades existam com valores padrão
  const safeConfig: SystemConfig = {
    trialDurationDays: config.trialDurationDays ?? 14,
    defaultNewUserPlan: config.defaultNewUserPlan ?? 'free',
    defaultLanguage: config.defaultLanguage ?? 'pt-BR',
    emailTemplates: {
      welcome: config.emailTemplates?.welcome ?? '',
      memberInvite: config.emailTemplates?.memberInvite ?? '',
      passwordReset: config.emailTemplates?.passwordReset ?? '',
    },
    paymentServiceConfig: {
      provider: config.paymentServiceConfig?.provider ?? '',
      apiKey: config.paymentServiceConfig?.apiKey ?? '',
    },
    emailServiceConfig: {
      provider: config.emailServiceConfig?.provider ?? '',
      apiKey: config.emailServiceConfig?.apiKey ?? '',
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configurações do Sistema
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure parâmetros globais do SaaS
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-admin text-white rounded-lg hover:bg-admin-dark disabled:opacity-50"
          data-testid="settings-save-button"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Parâmetros Globais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duração do Trial (dias)
              </label>
              <input
                type="number"
                value={safeConfig.trialDurationDays}
                onChange={(e) =>
                  setConfig({ ...safeConfig, trialDurationDays: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
                data-testid="settings-trial-duration"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plano Padrão
              </label>
              <input
                type="text"
                value={safeConfig.defaultNewUserPlan}
                onChange={(e) =>
                  setConfig({ ...safeConfig, defaultNewUserPlan: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Idioma Padrão
              </label>
              <input
                type="text"
                value={safeConfig.defaultLanguage}
                onChange={(e) =>
                  setConfig({ ...safeConfig, defaultLanguage: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Templates de Email
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de Boas-vindas
              </label>
              <textarea
                value={safeConfig.emailTemplates.welcome}
                onChange={(e) =>
                  setConfig({
                    ...safeConfig,
                    emailTemplates: {
                      ...safeConfig.emailTemplates,
                      welcome: e.target.value,
                    },
                  })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de Convite de Membro
              </label>
              <textarea
                value={safeConfig.emailTemplates.memberInvite}
                onChange={(e) =>
                  setConfig({
                    ...safeConfig,
                    emailTemplates: {
                      ...safeConfig.emailTemplates,
                      memberInvite: e.target.value,
                    },
                  })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de Reset de Senha
              </label>
              <textarea
                value={safeConfig.emailTemplates.passwordReset}
                onChange={(e) =>
                  setConfig({
                    ...safeConfig,
                    emailTemplates: {
                      ...safeConfig.emailTemplates,
                      passwordReset: e.target.value,
                    },
                  })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Integrações
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provedor de Pagamento
              </label>
              <input
                type="text"
                value={safeConfig.paymentServiceConfig.provider}
                onChange={(e) =>
                  setConfig({
                    ...safeConfig,
                    paymentServiceConfig: {
                      ...safeConfig.paymentServiceConfig,
                      provider: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key (Pagamento)
              </label>
              <input
                type="password"
                value={safeConfig.paymentServiceConfig.apiKey}
                onChange={(e) =>
                  setConfig({
                    ...safeConfig,
                    paymentServiceConfig: {
                      ...safeConfig.paymentServiceConfig,
                      apiKey: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provedor de Email
              </label>
              <input
                type="text"
                value={safeConfig.emailServiceConfig.provider}
                onChange={(e) =>
                  setConfig({
                    ...safeConfig,
                    emailServiceConfig: {
                      ...safeConfig.emailServiceConfig,
                      provider: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key (Email)
              </label>
              <input
                type="password"
                value={safeConfig.emailServiceConfig.apiKey}
                onChange={(e) =>
                  setConfig({
                    ...safeConfig,
                    emailServiceConfig: {
                      ...safeConfig.emailServiceConfig,
                      apiKey: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-admin focus:border-admin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
