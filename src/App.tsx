import { useState } from 'react'
import type { AppState } from './types'
import { LandingPage } from './components/LandingPage/LandingPage'
import { ChatReader } from './components/ChatReader/ChatReader'
import { loadFromZip } from './loader/loadFromZip'
import { loadFromFolder } from './loader/loadFromFolder'

function App() {
  const [state, setState] = useState<AppState>({ status: 'idle' })

  async function handleZipFile(file: File) {
    setState({ status: 'loading' })
    try {
      const chat = await loadFromZip(file)
      setState({ status: 'loaded', chat })
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  async function handleFolder(files: FileList) {
    setState({ status: 'loading' })
    try {
      const chat = await loadFromFolder(files)
      setState({ status: 'loaded', chat })
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  if (state.status === 'loaded') {
    return <ChatReader chat={state.chat} onReset={() => setState({ status: 'idle' })} />
  }

  return (
    <LandingPage
      isLoading={state.status === 'loading'}
      error={state.status === 'error' ? state.message : null}
      onZipFile={handleZipFile}
      onFolder={handleFolder}
    />
  )
}

export default App
