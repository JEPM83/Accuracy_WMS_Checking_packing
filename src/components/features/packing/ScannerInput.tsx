import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import Input from '../../common/Input'
import Button from '../../common/Button'
import LabelCards from './LabelCards'
import type { LabelWithDetails } from '../../../types'
import toast from 'react-hot-toast'

interface ScannerInputProps {
  labels: LabelWithDetails[]
  selectedLabelId: string
  onLabelChange: (labelId: string) => void
  onScan: (input: string, labelId: string) => void
  disabled: boolean
  quickMode: boolean
  onQuickModeChange: (enabled: boolean) => void
  soundEnabled: boolean
  onSoundEnabledChange: (enabled: boolean) => void
  lastScannedCode?: string
  onCloseLabel?: (label: LabelWithDetails) => void
  onViewScans?: (label: LabelWithDetails) => void
}

export interface ScannerInputRef {
  focus: () => void
}

const ScannerInput = forwardRef<ScannerInputRef, ScannerInputProps>(
  ({ labels, selectedLabelId, onLabelChange, onScan, disabled, quickMode, onQuickModeChange, soundEnabled, onSoundEnabledChange, lastScannedCode, onCloseLabel, onViewScans }, ref) => {
    const [input, setInput] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => {
        setTimeout(() => {
          inputRef.current?.focus({ preventScroll: true })
        }, 100)
      },
    }))

  useEffect(() => {
    // Auto-focus en el input al montar y cuando cambia el label
    if (!disabled) {
      inputRef.current?.focus({ preventScroll: true })
    }
  }, [selectedLabelId, disabled])

  const handleScan = () => {
    if (!input.trim()) return

    // VALIDACIÓN CRÍTICA: Verificar que selectedLabelId corresponda a una etiqueta ABIERTA
    if (selectedLabelId) {
      const selectedLabel = labels.find((l) => l.labelId === selectedLabelId)
      if (selectedLabel && selectedLabel.status === 'CLOSED') {
        // Bloquear escaneo en etiqueta cerrada
        toast.error('⚠️ La etiqueta seleccionada está cerrada. No se puede escanear.')
        return
      }
    }

    // Permitir scan incluso sin labelId (se auto-creará en OutboundDetail)
    onScan(input.trim(), selectedLabelId || '')
    setInput('')
    inputRef.current?.focus({ preventScroll: true })
  }

  const openLabels = labels.filter((l) => l.status === 'OPEN')

  // Verificar si la etiqueta seleccionada está cerrada
  const selectedLabel = selectedLabelId ? labels.find((l) => l.labelId === selectedLabelId) : null
  const isSelectedLabelClosed = !!(selectedLabel && selectedLabel.status === 'CLOSED')

    return (
        <div className="bg-gradient-to-br from-accuracy-medium to-accuracy-navy rounded-xl shadow-2xl border-2 border-accuracy-medium p-4 md:p-6">
          {/* Header con icono y toggles */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="bg-accuracy-light/20 rounded-xl p-2 md:p-3 backdrop-blur-sm flex-shrink-0">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-accuracy-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white font-outfit">Escáner de Productos</h3>
                <p className="text-xs md:text-sm text-accuracy-light/80 font-outfit font-light">Escanee EAN o ingrese SKU manualmente</p>
              </div>
            </div>

            {/* Toggles compactos */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center cursor-pointer bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 hover:bg-white/20 transition">
                <input
                  type="checkbox"
                  checked={quickMode}
                  onChange={(e) => onQuickModeChange(e.target.checked)}
                  className="w-4 h-4 text-accuracy-light rounded focus:ring-2 focus:ring-accuracy-light"
                />
                <span className="ml-2 text-sm font-medium text-white font-outfit whitespace-nowrap">⚡ Rápido</span>
              </label>

              <label className="flex items-center cursor-pointer bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 hover:bg-white/20 transition">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => onSoundEnabledChange(e.target.checked)}
                  className="w-4 h-4 text-accuracy-light rounded focus:ring-2 focus:ring-accuracy-light"
                />
                <span className="ml-2 text-sm font-medium text-white font-outfit">
                  {soundEnabled ? '🔊' : '🔇'}
                </span>
              </label>
            </div>
          </div>

          {/* Etiquetas Cards */}
          {openLabels.length > 0 && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-accuracy-light uppercase tracking-wide mb-3 font-outfit">
                Etiqueta Activa
              </label>
              <LabelCards
                labels={labels}
                selectedLabelId={selectedLabelId}
                onLabelChange={onLabelChange}
                disabled={disabled}
                onCloseLabel={onCloseLabel}
                onViewScans={onViewScans}
              />
            </div>
          )}

          {/* Alertas */}
          {openLabels.length === 0 && (
            <div className="text-center py-3 bg-accuracy-light/10 backdrop-blur-sm rounded-lg border border-accuracy-light/30 mb-4">
              <p className="text-accuracy-light font-medium text-sm font-outfit">ℹ️ No hay etiquetas abiertas</p>
              <p className="text-xs text-white/70 mt-1 font-outfit font-light">
                Se creará automáticamente al escanear el primer producto
              </p>
            </div>
          )}

          {isSelectedLabelClosed && (
            <div className="text-center py-3 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-400/50 mb-4">
              <p className="text-white font-medium text-sm font-outfit">⚠️ Etiqueta cerrada</p>
              <p className="text-xs text-white/80 mt-1 font-outfit font-light">
                La etiqueta seleccionada está cerrada. Seleccione o cree una etiqueta abierta.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                ref={inputRef}
                label=""
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleScan()
                  }
                }}
                placeholder="Escanee código EAN o ingrese SKU..."
                disabled={disabled || (openLabels.length > 0 && !selectedLabelId) || isSelectedLabelClosed}
                className="text-lg md:text-xl font-mono h-14 md:h-16 bg-white/95 backdrop-blur-sm border-2 border-white/50 focus:border-accuracy-light"
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={disabled || (openLabels.length > 0 && !selectedLabelId) || !input.trim() || isSelectedLabelClosed}
              className="h-14 md:h-16 px-6 md:px-8 text-base md:text-lg bg-accuracy-light hover:bg-white text-accuracy-navy font-bold rounded-lg shadow-lg hover:shadow-xl transition-all font-outfit whitespace-nowrap"
            >
              ✓ Escanear
            </Button>
          </div>

          {/* Último código escaneado */}
          {lastScannedCode && (
            <div className="mt-3 text-xs text-accuracy-light/90 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 inline-block font-outfit">
              Último: <span className="font-mono font-bold text-white">{lastScannedCode}</span>
            </div>
          )}
        </div>
    )
  }
)

ScannerInput.displayName = 'ScannerInput'

export default ScannerInput
