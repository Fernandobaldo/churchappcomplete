export const AVAILABLE_PLAN_FEATURES = [
  { id: 'events', label: 'Eventos', description: 'Gerencie cultos e eventos' },
  { id: 'members', label: 'Membros', description: 'Gerencie membros da igreja' },
  { id: 'contributions', label: 'Contribuições', description: 'Gerencie ofertas e dízimos' },
  { id: 'finances', label: 'Finanças', description: 'Controle financeiro completo' },
  { id: 'devotionals', label: 'Devocionais', description: 'Compartilhe devocionais' },
  { id: 'white_label_app', label: 'App White-label', description: 'App personalizado para a igreja' },
  { id: 'advanced_reports', label: 'Relatórios Avançados', description: 'Relatórios detalhados e analytics' },
] as const

export type PlanFeatureId = typeof AVAILABLE_PLAN_FEATURES[number]['id']







