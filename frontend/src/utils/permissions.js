export const hasPermission = (staff, permission) =>
  staff?.permissions?.includes(permission) || staff?.roles?.some((role) => role.name === 'Super Admin')

