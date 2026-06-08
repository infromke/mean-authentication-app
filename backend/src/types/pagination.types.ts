// query de listagem
export interface ListQuery {
  page?: string
  size?: string
  sort?: string
}

// para os parâmetros de busca
export interface FindAllParams {
  page: number
  size: number
  sortField: string
  sortOrder: 1 | -1
}

// para o objeto de paginação
export interface PaginationResult {
  content: any[]
  first: boolean
  last: boolean
  number: number
  numberOfElements: number
  size: number
  totalElements: number
  totalPages: number
}
