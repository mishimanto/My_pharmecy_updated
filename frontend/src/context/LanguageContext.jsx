import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'my-pharmecy-language'
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') {
      return 'bn'
    }

    const storedLanguage = window.localStorage.getItem(STORAGE_KEY)
    return storedLanguage === 'en' ? 'en' : 'bn'
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  const value = useMemo(() => ({
    language,
    setLanguage,
    isBangla: language === 'bn',
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }

  return context
}
