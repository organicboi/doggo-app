import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Account from '../../components/Account'
import { supabase } from '../../lib/supabase'

const UserScreen = () => {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <View style={styles.container}>
      {session && <Account session={session} />}
    </View>
  )
}

export default UserScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})