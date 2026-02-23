import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRestaurant() {
  const [restaurant, setRestaurant] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!rest) return

      const { data: sett } = await supabase
        .from('settings')
        .select('*')
        .eq('restaurant_id', rest.id)
        .single()

      setRestaurant(rest)
      setSettings(sett)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { restaurant, settings, loading, refetch: fetch }
}
