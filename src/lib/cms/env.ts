type EnvMap = Record<string, string | undefined>

function getImportMetaEnv(): EnvMap {
  try {
    return ((import.meta as { env?: EnvMap }).env || {}) as EnvMap
  } catch {
    return {}
  }
}

const metaEnv = getImportMetaEnv()

export function readEnv(key: string): string {
  const fromMeta = metaEnv[key]
  if (typeof fromMeta === 'string' && fromMeta.length > 0) {
    return fromMeta
  }

  const fromProcess = process.env[key]
  if (typeof fromProcess === 'string' && fromProcess.length > 0) {
    return fromProcess
  }

  return ''
}
