import { beforeEach, describe, expect, it, vi } from 'vitest'

import cache from '../lib/cache.js'

import clearUserCache from './clearUserCache.js'

vi.mock('../lib/cache.js', () => ({
  default: {
    keys: vi.fn(),
    del: vi.fn(),
  },
}))

describe('clearUserCache', () => {
  beforeEach(() => {
    vi.clearAllMocks() // Limpa o histórico de chamadas dos mocks antes de cada teste
  })

  it('should clear global users list cache if matching keys exist', () => {
    vi.mocked(cache.keys).mockReturnValue([
      'users_list_{"page":"0","size":"10","sort":"createdAt,desc"}',
      'users_list_page_1',
      'other_cached_data',
    ])

    clearUserCache()

    expect(cache.del).toHaveBeenCalledWith([
      'users_list_{"page":"0","size":"10","sort":"createdAt,desc"}',
      'users_list_page_1',
    ])
  })

  it('should clear individual user session and profile cache when userId is provided', () => {
    vi.mocked(cache.keys).mockReturnValue(['other_cache_keys_not_necessarily_user_related'])

    clearUserCache('6a38b73e47674137b7f282b1')

    expect(cache.del).toHaveBeenCalledWith('user_id_6a38b73e47674137b7f282b1')
    expect(cache.del).toHaveBeenCalledWith('user_session_6a38b73e47674137b7f282b1')
  })

  it('should not clear individual user cache if userId is not provided', () => {
    vi.mocked(cache.keys).mockReturnValue([])

    clearUserCache()

    expect(cache.del).not.toHaveBeenCalledWith(
      expect.stringContaining('user_id_6a271e20c2ba8ff33bb56ec0'),
    )
    expect(cache.del).not.toHaveBeenCalledWith(
      expect.stringContaining('user_session_6a271e20c2ba8ff33bb56ec0'),
    )
  })
})
