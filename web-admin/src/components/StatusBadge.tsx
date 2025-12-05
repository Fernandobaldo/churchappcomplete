interface StatusBadgeProps {
  status: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}

export function StatusBadge({ status, variant = 'neutral' }: StatusBadgeProps) {
  const variantStyles = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      blocked: 'Bloqueado',
      suspended: 'Suspenso',
      cancelled: 'Cancelado',
      trial: 'Trial',
      'payment_failed': 'Pagamento Falhou',
    }
    return labels[status.toLowerCase()] || status
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}
      data-testid={`status-badge-${status}`}
    >
      {getStatusLabel(status)}
    </span>
  )
}


