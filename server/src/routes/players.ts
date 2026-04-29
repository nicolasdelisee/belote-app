import { Router } from 'express'
import { supabase } from '../lib/supabase'

export const playersRouter = Router()

playersRouter.get('/leaderboard', async (_req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, elo, games_played, games_won')
    .order('elo', { ascending: false })
    .limit(20)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json(data)
})

playersRouter.get('/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  res.json(data)
})
