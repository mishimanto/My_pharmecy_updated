import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/adminApi'

export const adminQueryKeys = {
  all: ['admin'],
  dashboard: ['admin', 'dashboard'],
  dashboardSummary: ['admin', 'dashboard', 'summary'],
  dashboardRecentOrders: ['admin', 'dashboard', 'recent-orders'],
  dashboardPendingPrescriptions: ['admin', 'dashboard', 'pending-prescriptions'],
  dashboardLowStock: ['admin', 'dashboard', 'low-stock'],
  dashboardNearExpiry: ['admin', 'dashboard', 'near-expiry'],
  resourceList: (resource, params = {}) => ['admin', resource, 'list', params],
  resourceDetail: (resource, id) => ['admin', resource, 'detail', String(id || '')],
  report: (type, params = {}) => ['admin', 'reports', type, params],
  notifications: (params = {}) => ['admin', 'notifications', params],
  permissions: ['admin', 'permissions'],
  userHistory: (id, type) => ['admin', 'users', String(id || ''), type],
}

export function useAdminListQuery(resource, params = {}, options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.resourceList(resource, params),
    queryFn: () => adminApi.list(resource, params).then((response) => response.data.data),
    enabled: Boolean(resource),
    ...options,
  })
}

export function useAdminFreshListQuery(resource, params = {}, options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.resourceList(resource, params),
    queryFn: () => adminApi.listFresh(resource, params).then((response) => response.data.data),
    enabled: Boolean(resource),
    ...options,
  })
}

export function useAdminShowQuery(resource, id, options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.resourceDetail(resource, id),
    queryFn: () => adminApi.show(resource, id).then((response) => response.data.data),
    enabled: Boolean(resource && id),
    ...options,
  })
}

export function useAdminReportQuery(type, params = {}, options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.report(type, params),
    queryFn: () => adminApi.report(type, params, { fresh: true }).then((response) => response.data.data),
    enabled: Boolean(type),
    ...options,
  })
}

export function useAdminDashboardQuery(options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.dashboard,
    queryFn: () => adminApi.dashboard().then((response) => response.data.data),
    ...options,
  })
}

export function useAdminDashboardSummaryQuery(options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.dashboardSummary,
    queryFn: () => adminApi.dashboardSummary().then((response) => response.data.data),
    ...options,
  })
}

export function useAdminPermissionsQuery(options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.permissions,
    queryFn: () => adminApi.permissions().then((response) => response.data.data || []),
    ...options,
  })
}

export function useAdminUserHistoryQuery(id, type, options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.userHistory(id, type),
    queryFn: () => adminApi.userHistory(id, type).then((response) => response.data.data || []),
    enabled: Boolean(id && type),
    ...options,
  })
}

export function useAdminResourceMutation(mutationFn, invalidateKeys = adminQueryKeys.all, options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: invalidateKeys })
      options.onSuccess?.(...args)
    },
  })
}
