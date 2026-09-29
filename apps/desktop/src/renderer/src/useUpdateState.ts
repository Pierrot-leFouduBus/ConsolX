// Follows the state of app updates, as reported by the main process.
import { useEffect, useState } from 'react'
import type { UpdateState } from '../../shared/consolx-api'

export function useUpdateState(): UpdateState {
  const [state, setState] = useState<UpdateState>({ status: 'idle' })

  useEffect(() => {
    const updates = window.consolx.updates
    // Listen first, then ask for the current state, so no change is missed.
    const stop = updates.onState(setState)
    void updates.getState().then(setState)
    return stop
  }, [])

  return state
}
