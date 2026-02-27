import React from 'react'
import './DateDivider.css'

export default function DateDivider({ label }) {
  return (
    <div className="date-divider">
      <span className="date-divider-line" />
      <span className="date-divider-label">{label}</span>
      <span className="date-divider-line" />
    </div>
  )
}
