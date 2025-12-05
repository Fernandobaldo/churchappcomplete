import { Subscription } from '../types'
import { StatusBadge } from './StatusBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreditCard, Calendar, User } from 'lucide-react'

interface SubscriptionCardProps {
  subscription: Subscription
  onClick?: () => void
}

export function SubscriptionCard({ subscription, onClick }: SubscriptionCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-admin-light rounded-lg">
            <CreditCard className="w-5 h-5 text-admin-dark" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{subscription.planName}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <User className="w-4 h-4" />
              <span className="font-medium">Responsável:</span>{' '}
              <span>{subscription.userName || subscription.user?.name || subscription.userEmail || subscription.user?.email || 'N/A'}</span>
            </p>
          </div>
        </div>
        <StatusBadge
          status={subscription.status}
          variant={
            subscription.status === 'active'
              ? 'success'
              : subscription.status === 'canceled' || subscription.status === 'unpaid'
              ? 'danger'
              : subscription.status === 'past_due'
              ? 'warning'
              : 'neutral'
          }
        />
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>
            Início: {format(new Date(subscription.startedAt), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        </div>
        {subscription.currentPeriodEnd && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              Próxima cobrança: {format(new Date(subscription.currentPeriodEnd), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
        )}
        {subscription.endsAt && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              Fim: {format(new Date(subscription.endsAt), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
        )}
        {subscription.cancelAtPeriodEnd && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ Será cancelada ao fim do período
          </div>
        )}
        {subscription.gatewayProvider && (
          <div className="text-xs text-gray-500 mt-2">
            Gateway: {subscription.gatewayProvider}
          </div>
        )}
      </div>
    </div>
  )
}

