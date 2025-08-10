import React from 'react'
import { useTranslation } from 'react-i18next'
export default function LegendsScreen() {
  const { t } = useTranslation()
  return <section><h1>{t('legends.title')}</h1><p>{t('legends.body')}</p></section>
}
