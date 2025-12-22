export const ROLE_PRIORITY = ['Admin', 'Artisan', 'Customer'];

export const extractRoleNames = (roles) => {
  if (!roles) return [];

  if (Array.isArray(roles)) {
    return roles
      .map((role) => {
        if (typeof role === 'string') return role;
        return role?.name || role?.roleName || role?.value || role?.code || '';
      })
      .filter(Boolean);
  }

  if (typeof roles === 'string') return [roles];

  if (typeof roles === 'object') {
    const name = roles?.name || roles?.roleName || roles?.value || roles?.code || '';
    return name ? [name] : [];
  }

  return [];
};

export const resolvePrimaryRole = (roles, priority = ROLE_PRIORITY) => {
  const names = extractRoleNames(roles);
  const normalized = new Set(names.map((role) => String(role).toLowerCase()));
  const preferred = (Array.isArray(priority) ? priority : ROLE_PRIORITY)
    .find((role) => normalized.has(String(role).toLowerCase()));

  return preferred || (names[0] ? String(names[0]) : null);
};

export const formatPrimaryRole = (roles, fallback = 'N/A') => resolvePrimaryRole(roles) || fallback;
