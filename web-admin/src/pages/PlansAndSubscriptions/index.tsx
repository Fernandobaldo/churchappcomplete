import { useState } from 'react'
import { PlansList } from '../Plans'
import { SubscriptionsList } from '../Subscriptions'
import { CreditCard, Package } from 'lucide-react'

export function PlansAndSubscriptions() {
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos e Assinaturas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie planos e assinaturas do sistema
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('plans')}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'plans'
                  ? 'border-admin text-admin'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Package className="w-5 h-5" />
            Planos
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'subscriptions'
                  ? 'border-admin text-admin'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <CreditCard className="w-5 h-5" />
            Assinaturas
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'plans' && <PlansList />}
        {activeTab === 'subscriptions' && <SubscriptionsList />}
      </div>
    </div>
  )
}









