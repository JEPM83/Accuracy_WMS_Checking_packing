import { useState, useEffect, useRef } from 'react'
import Modal from '../../common/Modal'
import Input from '../../common/Input'
import Select from '../../common/Select'
import Button from '../../common/Button'
import type { ScanResult } from '../../../types'

interface ScanProcessModalProps {
  scanResult: ScanResult | null
  onContinue: (data: any, shouldCloseModal?: boolean) => void
  onCancel: () => void
  lineProgress?: { checkedQty: number; pickedQty: number }
  labelInfo?: { seq: number; labelId: string } | null
}

export default function ScanProcessModal({
  scanResult,
  onContinue,
  onCancel,
  lineProgress,
  labelInfo,
}: ScanProcessModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [selectedUom, setSelectedUom] = useState('EA')
  const [lastSubmittedValue, setLastSubmittedValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const qtyInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Mantener el focus en el input cuando el modal se abre o se actualiza
    if (scanResult?.requiresInput?.type === 'SERIE' && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true })
      }, 100)
    }

    // Pre-seleccionar UOM si viene en los datos
    if (scanResult?.requiresInput?.type === 'QTY_UOM' && scanResult.requiresInput.data?.preselectedUom) {
      setSelectedUom(scanResult.requiresInput.data.preselectedUom)
    }
  }, [scanResult])

  // Detectar éxito (checkedQty incrementó) y limpiar input
  useEffect(() => {
    if (scanResult?.requiresInput?.type === 'SERIE' && lineProgress && lastSubmittedValue) {
      // Si checkedQty aumentó, significa que el scan fue exitoso
      // Limpiar el input para la siguiente serie
      setInputValue('')
      setLastSubmittedValue('')
    }
  }, [lineProgress?.checkedQty])

  // Detectar error y seleccionar texto
  useEffect(() => {
    // Si el modal sigue abierto con el mismo valor enviado (significa error)
    if (scanResult?.requiresInput?.type === 'SERIE' && lastSubmittedValue && inputValue === lastSubmittedValue) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.select()
          inputRef.current.focus({ preventScroll: true })
        }
      }, 100)
    }
  }, [scanResult, lastSubmittedValue, inputValue])

  if (!scanResult || !scanResult.requiresInput) return null

  const { type, data } = scanResult.requiresInput

  const handleSubmit = () => {
    if (type === 'SKU_SELECTION') {
      if (!inputValue) return
      // Buscar la UOM asociada al SKU seleccionado
      const selectedSkuData = data.skus.find((s: any) => s.sku.skuId === inputValue)
      onContinue({ skuId: inputValue, eanUom: selectedSkuData?.uom }, true)
      setInputValue('')
      setLastSubmittedValue('')
    } else if (type === 'SERIE') {
      if (!inputValue.trim()) return

      // Guardar el valor enviado para detectar errores
      setLastSubmittedValue(inputValue.trim())

      // Para series, verificar si quedan más por escanear
      const shouldClose = lineProgress
        ? (lineProgress.checkedQty + 1) >= lineProgress.pickedQty
        : true

      onContinue({ serie: inputValue.trim() }, shouldClose)

      // Si debe cerrar (última serie), limpiar
      // Si no, mantener el valor para que se seleccione en caso de error
      if (shouldClose) {
        setInputValue('')
        setLastSubmittedValue('')
      }

      // Mantener focus si no se cierra el modal
      if (!shouldClose && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus({ preventScroll: true })
        }, 100)
      }
    } else if (type === 'LOTE') {
      if (!inputValue) return
      onContinue({ lote: inputValue }, true)
      setInputValue('')
      setLastSubmittedValue('')
    } else if (type === 'QTY_UOM') {
      const qty = parseInt(inputValue)
      if (isNaN(qty) || qty <= 0) return
      onContinue({ qty, uom: selectedUom }, true)
      setInputValue('')
      setLastSubmittedValue('')
    } else if (type === 'CONFIRM_SOBRANTE') {
      onContinue({ confirmed: true, ...data }, true)
    }
    setSelectedUom('EA')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const renderContent = () => {
    switch (type) {
      case 'SKU_SELECTION':
        return (
          <>
            <p className="text-sm text-gray-600 mb-4">
              El EAN {data.ean} está asociado a múltiples SKUs. Seleccione el correcto:
            </p>
            <Select
              label="SKU"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              options={[
                { value: '', label: '-- Seleccione un SKU --' },
                ...data.skus.map((item: any) => ({
                  value: item.sku.skuId,
                  label: `${item.sku.skuId} - ${item.sku.description}${item.uom ? ` [${item.uom}]` : ''}`,
                }))
              ]}
            />
          </>
        )

      case 'SERIE':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 font-outfit">
                <strong>SKU:</strong> {data.skuId}
              </p>
              <p className="text-sm text-blue-800 font-outfit font-light">
                {data.description}
              </p>
            </div>
            {labelInfo && (
              <div className="bg-gradient-to-r from-accuracy-light to-accuracy-medium-light border border-accuracy-medium rounded-lg p-3">
                <p className="text-sm font-bold text-accuracy-navy font-outfit">
                  📦 Etiqueta destino: <span className="text-base">#{labelInfo.seq.toString().padStart(2, '0')}</span>
                </p>
                <p className="text-xs text-accuracy-navy/70 font-outfit font-light mt-0.5">
                  {labelInfo.labelId}
                </p>
              </div>
            )}
            <Input
              ref={inputRef}
              label="Número de Serie"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escanee o ingrese la serie"
              autoFocus
            />
            {lineProgress && (
              <p className="text-sm text-gray-600 mt-2 font-outfit">
                Progreso: {lineProgress.checkedQty} / {lineProgress.pickedQty} unidades
              </p>
            )}
          </div>
        )

      case 'LOTE':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 font-outfit">
                <strong>SKU:</strong> {data.skuId}
              </p>
              <p className="text-sm text-blue-800 font-outfit font-light">
                {data.description}
              </p>
            </div>
            {labelInfo && (
              <div className="bg-gradient-to-r from-accuracy-light to-accuracy-medium-light border border-accuracy-medium rounded-lg p-3">
                <p className="text-sm font-bold text-accuracy-navy font-outfit">
                  📦 Etiqueta destino: <span className="text-base">#{labelInfo.seq.toString().padStart(2, '0')}</span>
                </p>
                <p className="text-xs text-accuracy-navy/70 font-outfit font-light mt-0.5">
                  {labelInfo.labelId}
                </p>
              </div>
            )}
            <Input
              label="Lote"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ingrese el lote"
              autoFocus
            />
          </div>
        )

      case 'QTY_UOM':
        const uomOptions = Object.keys(data.availableUoms).map((uom) => ({
          value: uom,
          label: `${uom} (x${data.availableUoms[uom]})`,
        }))

        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 font-outfit">
                <strong>SKU:</strong> {data.skuId}
              </p>
              <p className="text-sm text-blue-800 font-outfit font-light">
                {data.description}
              </p>
            </div>
            {labelInfo && (
              <div className="bg-gradient-to-r from-accuracy-light to-accuracy-medium-light border border-accuracy-medium rounded-lg p-3">
                <p className="text-sm font-bold text-accuracy-navy font-outfit">
                  📦 Etiqueta destino: <span className="text-base">#{labelInfo.seq.toString().padStart(2, '0')}</span>
                </p>
                <p className="text-xs text-accuracy-navy/70 font-outfit font-light mt-0.5">
                  {labelInfo.labelId}
                </p>
              </div>
            )}
            {data.preselectedUom && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                <p className="text-xs text-green-800 font-outfit">
                  ✓ Unidad de medida detectada automáticamente: <strong>{data.preselectedUom}</strong>
                </p>
              </div>
            )}
            <Input
              ref={qtyInputRef}
              type="number"
              label="Cantidad"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ingrese cantidad"
              min="1"
              autoFocus
            />
            <Select
              label="Unidad de Medida"
              value={selectedUom}
              onChange={(e) => {
                setSelectedUom(e.target.value)
                // Focus en el input de cantidad cuando cambia la UOM
                setTimeout(() => {
                  qtyInputRef.current?.focus({ preventScroll: true })
                }, 100)
              }}
              options={uomOptions}
            />
          </div>
        )

      case 'CONFIRM_SOBRANTE':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="font-medium text-yellow-900 mb-2">⚠️ Sobrante Detectado</p>
            <p className="text-sm text-yellow-800 mb-4">{scanResult.message}</p>
            <div className="bg-white rounded p-3 text-sm">
              <p>
                <strong>SKU:</strong> {data.skuId}
              </p>
              <p>
                <strong>Cantidad a registrar:</strong> {data.qty} {data.uom}
              </p>
              <p>
                <strong>Sobrante:</strong> {data.sobrante} unidades
              </p>
            </div>
            <p className="text-xs text-yellow-700 mt-3">
              Esta acción requiere autorización de supervisor
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={
        type === 'SKU_SELECTION'
          ? 'Seleccionar SKU'
          : type === 'SERIE'
          ? 'Ingresar Serie'
          : type === 'LOTE'
          ? 'Ingresar Lote'
          : type === 'QTY_UOM'
          ? 'Ingresar Cantidad'
          : 'Confirmar Sobrante'
      }
      size="md"
      allowBodyScroll={true}
    >
      <div className="space-y-4">
        {renderContent()}

        <div className="flex space-x-2">
          <Button
            onClick={handleSubmit}
            className="flex-1"
            variant={type === 'CONFIRM_SOBRANTE' ? 'warning' : 'primary'}
          >
            {type === 'CONFIRM_SOBRANTE' ? 'Confirmar y Autorizar' : 'Continuar'}
          </Button>
          <Button onClick={onCancel} variant="secondary" className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
