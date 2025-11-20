/**
 * Types et utilitaires pour la pagination
 */

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

/**
 * Normalise les paramètres de pagination
 */
export function normalizePagination(
  params?: PaginationParams
): { page: number; limit: number; offset: number } {
  const page = Math.max(1, params?.page || 1)
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, params?.limit || DEFAULT_PAGE_SIZE)
  )
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Calcule les métadonnées de pagination
 */
export function calculatePaginationMetadata(
  total: number,
  page: number,
  limit: number
): PaginatedResult<never>['pagination'] {
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore,
  }
}

