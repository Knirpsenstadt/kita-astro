import React from 'react'
import { wrapFieldsWithMeta } from 'tinacms'
import { ICON_OPTIONS } from '../../src/lib/iconOptions'

export const IconPicker = wrapFieldsWithMeta((props: any) => {
  const value = props.input?.value

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(86px, 1fr))', gap: '0.5rem' }}>
      {ICON_OPTIONS.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => props.input?.onChange(option.value)}
            title={option.label}
            style={{
              border: active ? '2px solid #5d9847' : '1px solid #d7dee9',
              borderRadius: '10px',
              padding: '0.5rem',
              background: active ? '#f5fbe9' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              style={{ width: '22px', height: '22px', color: '#4a7a3a' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={option.path} />
            </svg>
            <span style={{ fontSize: '11px', lineHeight: 1.15, textAlign: 'center', color: '#334155' }}>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
})
