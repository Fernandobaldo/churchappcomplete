export const ALL_PERMISSION_TYPES = [
    'devotional_manage',
    'members_view',
    'members_manage', // Permissão para criar/editar membros
    'events_manage',
    'contributions_manage',
    'finances_manage',
    'church_manage' // Permissão para editar igreja e gerenciar horários de culto
];

// Permissões que requerem pelo menos role COORDINATOR
export const RESTRICTED_PERMISSIONS = [
  'finances_manage',
  'church_manage',
  'contributions_manage',
  'members_manage'
];
