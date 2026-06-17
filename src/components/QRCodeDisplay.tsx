'use client'

import { QRCodeSVG } from 'qrcode.react'

interface Props {
  value: string
  size?: number
}

export default function QRCodeDisplay({ value, size = 200 }: Props) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor="#ffffff"
      fgColor="#1f2937"
      level="M"
      includeMargin
    />
  )
}
