import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAuthorization } from '../hooks/useAuthorization'
import { useSounds } from '../hooks/useSounds'
import { useConfirm } from '../hooks/useConfirm'
import { getOrderById, closeOrder, reopenOrder } from '../services/orderService'
import {
  createLabel,
  getLabelsForOrder,
  closeLabel,
  reopenLabel,
  deleteLabel,
} from '../services/labelService'
import { processScan, processScanWithSobrante, reportFaltante, deleteScan, deleteAllScansFromLabel } from '../services/scanService'
import type { OrderWithDetails, LabelWithDetails, OrderLineWithDetails, ScanResult } from '../types'
import toast from 'react-hot-toast'
import Button from '../components/common/Button'
import Chip from '../components/common/Chip'
import Spinner from '../components/common/Spinner'
import OrderLines from '../components/features/packing/OrderLines'
import LabelsList from '../components/features/packing/LabelsList'
import ScannerInput, { type ScannerInputRef } from '../components/features/packing/ScannerInput'
import CloseLabelModal from '../components/features/packing/CloseLabelModal'
import ReportFaltanteModal from '../components/features/packing/ReportFaltanteModal'
import ScanProcessModal from '../components/features/packing/ScanProcessModal'
import AuthorizationModal from '../components/common/AuthorizationModal'
import ViewScansModal from '../components/features/packing/ViewScansModal'
import PrintLabelsButton from '../components/features/packing/PrintLabelsButton'
import RecentScans from '../components/features/packing/RecentScans'
import SelectLabelModal from '../components/features/packing/SelectLabelModal'
import SelectLineForScanModal from '../components/features/packing/SelectLineForScanModal'
import EmptyLabelsModal from '../components/features/packing/EmptyLabelsModal'
import LinesSummary from '../components/features/packing/LinesSummary'
import LinesDetailModal from '../components/features/packing/LinesDetailModal'
import { formatearFecha } from '../utils/formatters'

export default function OutboundDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const authorization = useAuthorization()
  const { soundEnabled, setSoundEnabled, playSuccess, playError } = useSounds()
  const { confirm, ConfirmDialogComponent } = useConfirm()
  const scannerRef = useRef<ScannerInputRef>(null)

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [labels, setLabels] = useState<LabelWithDetails[]>([])
  const [selectedLabelId, setSelectedLabelId] = useState('')
  const [loading, setLoading] = useState(true)

  // Mejoras de productividad
  const [quickMode, setQuickMode] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [showLabelsSection, setShowLabelsSection] = useState(true)
  const [lastScannedCode, setLastScannedCode] = useState<string>('')
  const [flashFeedback, setFlashFeedback] = useState<'success' | 'error' | null>(null)
  const [scansRefreshTrigger, setScansRefreshTrigger] = useState(0)
  const [activeSkuId, setActiveSkuId] = useState<string>('')
  const [lastScanId, setLastScanId] = useState<string>('')
  const [sessionStartTime, setSessionStartTime] = useState(Date.now())
  const [totalSessionScans, setTotalSessionScans] = useState(0)
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Modales
  const [closeLabelModalOpen, setCloseLabelModalOpen] = useState(false)
  const [labelToClose, setLabelToClose] = useState<LabelWithDetails | null>(null)
  const [faltanteModalOpen, setFaltanteModalOpen] = useState(false)
  const [lineForFaltante, setLineForFaltante] = useState<OrderLineWithDetails | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [pendingScanData, setPendingScanData] = useState<any>(null)
  const [accumulatedScanData, setAccumulatedScanData] = useState<any>({})
  const [viewScansModalOpen, setViewScansModalOpen] = useState(false)
  const [labelForViewScans, setLabelForViewScans] = useState<LabelWithDetails | null>(null)
  const [selectLabelModalOpen, setSelectLabelModalOpen] = useState(false)
  const [pendingScanForLabelSelection, setPendingScanForLabelSelection] = useState<{
    input: string
    additionalData?: any
  } | null>(null)
  const [emptyLabelsModalOpen, setEmptyLabelsModalOpen] = useState(false)
  const [emptyLabels, setEmptyLabels] = useState<LabelWithDetails[]>([])
  const [showLinesDetail, setShowLinesDetail] = useState(false)
  const [isProgressSticky, setIsProgressSticky] = useState(false)

  useEffect(() => {
    if (orderId) {
      loadData()
      // Inicializar tiempo de sesión al cargar pedido
      setSessionStartTime(Date.now())
      setTotalSessionScans(0)
    }
  }, [orderId])

  // Feedback visual flash
  useEffect(() => {
    if (flashFeedback) {
      const timer = setTimeout(() => {
        setFlashFeedback(null)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [flashFeedback])

  // Limpiar último código escaneado después de 3 segundos
  useEffect(() => {
    if (lastScannedCode) {
      const timer = setTimeout(() => {
        setLastScannedCode('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [lastScannedCode])

  // Limpiar activeSkuId después de 5 segundos (para highlight temporal)
  useEffect(() => {
    if (activeSkuId) {
      const timer = setTimeout(() => {
        setActiveSkuId('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [activeSkuId])

  // Actualizar el tiempo cada segundo para los stats
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Detectar scroll para sticky progress bar (solo desktop)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      // Activar sticky después de 200px de scroll
      if (scrollY > 200) {
        setIsProgressSticky(true)
      } else {
        setIsProgressSticky(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Verificar que la etiqueta seleccionada esté abierta
  useEffect(() => {
    if (!selectedLabelId) return

    const selectedLabel = labels.find((l) => l.labelId === selectedLabelId)

    // Si la etiqueta seleccionada está cerrada o no existe, cambiar a una abierta
    if (!selectedLabel || selectedLabel.status === 'CLOSED') {
      const openLabels = labels.filter((l) => l.status === 'OPEN')
      if (openLabels.length > 0) {
        setSelectedLabelId(openLabels[0].labelId)
      } else {
        setSelectedLabelId('')
      }
    }
  }, [labels, selectedLabelId])

  // Atajos de teclado
  useEffect(() => {
    console.log('🎯 Registrando event listener de teclado. lastScanId actual:', lastScanId)

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z: Deshacer último scan (detectar tanto 'z' como 'Z')
      if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        console.log('⌨️ Ctrl+Z detectado! Key:', e.key, 'ctrlKey:', e.ctrlKey)
        e.preventDefault()
        e.stopPropagation()

        if (!order) {
          console.log('❌ No hay orden cargada')
          return
        }
        if (order.status === 'CONFIRMADO WMS') {
          console.log('❌ Pedido está cerrado')
          toast.error('No se puede deshacer scans en pedidos cerrados')
          return
        }
        handleUndoLastScan()
      }

      // F2: Crear nueva etiqueta
      if (e.key === 'F2') {
        e.preventDefault()
        if (!order || order.status === 'CONFIRMADO WMS') return
        handleCreateLabel()
      }

      // F5: Recargar
      if (e.key === 'F5') {
        e.preventDefault()
        loadData()
        toast.success('Datos recargados')
      }

      // Tab: Cambiar etiqueta (solo si no está en un input)
      if (e.key === 'Tab' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        const openLabels = labels.filter((l) => l.status === 'OPEN')
        if (openLabels.length > 1) {
          const currentIndex = openLabels.findIndex((l) => l.labelId === selectedLabelId)
          const nextIndex = (currentIndex + 1) % openLabels.length
          setSelectedLabelId(openLabels[nextIndex].labelId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      console.log('🔄 Desmontando event listener de teclado')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [order, labels, selectedLabelId, lastScanId])

  const loadData = async () => {
    if (!orderId || !session) return

    try {
      setLoading(true)
      const orderData = await getOrderById(orderId)

      if (!orderData) {
        toast.error('Pedido no encontrado')
        navigate('/outbound')
        return
      }

      // Verificar acceso
      if (!session.allowedClients.includes(orderData.clientId)) {
        toast.error('No tiene acceso a este pedido')
        navigate('/outbound')
        return
      }

      setOrder(orderData)

      const labelsData = await getLabelsForOrder(orderId)
      setLabels(labelsData)

      // Seleccionar primera etiqueta abierta
      const firstOpen = labelsData.find((l) => l.status === 'OPEN')
      if (firstOpen) {
        setSelectedLabelId(firstOpen.labelId)
      }
    } catch (error) {
      console.error('Error cargando pedido:', error)
      toast.error('Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }

  // Recarga solo las etiquetas (más rápido, sin parpadeo)
  const loadLabels = async () => {
    if (!orderId) return
    try {
      const labelsData = await getLabelsForOrder(orderId)
      setLabels(labelsData)
    } catch (error) {
      console.error('Error cargando etiquetas:', error)
    }
  }

  // Recarga solo el orden (para actualizar progreso y estado)
  const loadOrderHeader = async () => {
    if (!orderId || !session) return
    try {
      const orderData = await getOrderById(orderId)
      if (orderData) {
        setOrder(orderData)
      }
    } catch (error) {
      console.error('Error cargando orden:', error)
    }
  }

  const handleCreateLabel = async () => {
    if (!orderId || !session) return

    try {
      const newLabel = await createLabel(orderId, session.user.userId)
      // Actualizar solo las etiquetas sin recargar todo
      await loadLabels()
      // Seleccionar la nueva etiqueta automáticamente
      setSelectedLabelId(newLabel.labelId)
      toast.success('Etiqueta creada')
    } catch (error) {
      console.error('Error creando etiqueta:', error)
      toast.error('Error al crear etiqueta')
    }
  }

  const handleCloseLabel = (labelOrId: string | LabelWithDetails) => {
    const label = typeof labelOrId === 'string'
      ? labels.find((l) => l.labelId === labelOrId)
      : labelOrId
    if (label) {
      setLabelToClose(label)
      setCloseLabelModalOpen(true)
    }
  }

  const handleConfirmCloseLabel = async (realWeight?: number) => {
    if (!labelToClose || !session) return

    try {
      const closedLabelId = labelToClose.labelId
      const { incidentCreated } = await closeLabel(
        closedLabelId,
        session.user.userId,
        realWeight
      )

      setCloseLabelModalOpen(false)
      setLabelToClose(null)

      // Recargar etiquetas
      await loadLabels()

      // Si la etiqueta cerrada era la seleccionada, cambiar a otra abierta
      if (selectedLabelId === closedLabelId) {
        const updatedLabels = await getLabelsForOrder(orderId!)
        const firstOpen = updatedLabels.find((l) => l.status === 'OPEN')
        setSelectedLabelId(firstOpen?.labelId || '')
      }

      if (incidentCreated) {
        toast.success('Etiqueta cerrada - Se detectó diferencia de peso')
      } else {
        toast.success('Etiqueta cerrada correctamente')
      }
    } catch (error) {
      console.error('Error cerrando etiqueta:', error)
      toast.error('Error al cerrar etiqueta')
    }
  }

  const handleReopenLabel = (labelId: string) => {
    authorization.requestAuthorization(
      'Reabrir etiqueta cerrada',
      async (_authorizedBy) => {
        try {
          await reopenLabel(labelId)
          // Solo recargar etiquetas
          await loadLabels()
          toast.success('Etiqueta reabierta')
        } catch (error) {
          console.error('Error reabriendo etiqueta:', error)
          toast.error('Error al reabrir etiqueta')
        }
      }
    )
  }

  const handleDeleteLabel = async (labelId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Etiqueta',
      message: '¿Está seguro de eliminar esta etiqueta?\n\nEsta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      await deleteLabel(labelId)
      // Solo recargar etiquetas
      await loadLabels()
      // Si era la etiqueta seleccionada, seleccionar otra
      if (selectedLabelId === labelId) {
        const remainingLabels = labels.filter(l => l.labelId !== labelId)
        const firstOpen = remainingLabels.find(l => l.status === 'OPEN')
        setSelectedLabelId(firstOpen?.labelId || '')
      }
      toast.success('Etiqueta eliminada')
    } catch (error: any) {
      console.error('Error eliminando etiqueta:', error)
      toast.error(error.message || 'Error al eliminar etiqueta')
    }
  }

  const handleViewScans = (labelOrId: string | LabelWithDetails) => {
    const label = typeof labelOrId === 'string'
      ? labels.find((l) => l.labelId === labelOrId)
      : labelOrId
    if (label) {
      setLabelForViewScans(label)
      setViewScansModalOpen(true)
    }
  }

  const handleDeleteScan = (scanId: string) => {
    authorization.requestAuthorization(
      'Eliminar scan',
      async (_authorizedBy) => {
        try {
          await deleteScan(scanId)
          // Recargar etiquetas y header (afecta progreso)
          await Promise.all([loadLabels(), loadOrderHeader()])
          // Cerrar el modal y recargar
          setViewScansModalOpen(false)
          setLabelForViewScans(null)
          toast.success('Scan eliminado correctamente')
        } catch (error: any) {
          console.error('Error eliminando scan:', error)
          toast.error(error.message || 'Error al eliminar scan')
        }
      }
    )
  }

  const handleDeleteAllScans = () => {
    if (!labelForViewScans) return

    authorization.requestAuthorization(
      'Eliminar todos los scans',
      async (_authorizedBy) => {
        try {
          await deleteAllScansFromLabel(labelForViewScans.labelId)
          // Recargar etiquetas y header (afecta progreso)
          await Promise.all([loadLabels(), loadOrderHeader()])
          // Cerrar el modal y recargar
          setViewScansModalOpen(false)
          setLabelForViewScans(null)
          toast.success('Todos los scans eliminados correctamente')
        } catch (error: any) {
          console.error('Error eliminando scans:', error)
          toast.error(error.message || 'Error al eliminar scans')
        }
      }
    )
  }

  const handleSelectLabel = (labelId: string) => {
    // Guardar la selección del usuario
    setSelectedLabelId(labelId)
    setSelectLabelModalOpen(false)

    // Si había un scan pendiente, procesarlo ahora con la etiqueta seleccionada
    if (pendingScanForLabelSelection) {
      const { input, additionalData } = pendingScanForLabelSelection
      setPendingScanForLabelSelection(null)
      // Llamar a handleScan con la etiqueta seleccionada
      handleScan(input, labelId, additionalData)
    }
  }

  const handleUndoLastScan = () => {
    console.log('🔄 handleUndoLastScan llamado, lastScanId:', lastScanId)

    if (!lastScanId) {
      console.log('❌ No hay lastScanId disponible')
      toast.error('No hay scans recientes para deshacer')
      return
    }

    console.log('✅ Solicitando autorización para deshacer scan:', lastScanId)
    authorization.requestAuthorization(
      'Deshacer último scan',
      async (_authorizedBy) => {
        try {
          console.log('🗑️ Eliminando scan:', lastScanId)
          await deleteScan(lastScanId)
          // Recargar etiquetas y header (afecta progreso)
          await Promise.all([loadLabels(), loadOrderHeader()])
          // Refrescar panel de últimos scans
          setScansRefreshTrigger((prev) => prev + 1)
          setLastScanId('')
          toast.success('Último scan deshecho correctamente')
        } catch (error: any) {
          console.error('Error deshaciendo scan:', error)
          toast.error(error.message || 'Error al deshacer scan')
        }
      },
      () => {
        console.log('❌ Autorización cancelada')
        toast('Acción cancelada')
      }
    )
  }

  const handleScan = async (
    input: string,
    labelId: string,
    additionalData?: any,
    keepModalOpenOnSuccess?: boolean
  ) => {
    if (!orderId || !session) return

    // Recargar etiquetas para asegurar que tenemos el estado más actual
    const currentLabels = await getLabelsForOrder(orderId)
    const openLabels = currentLabels.filter((l) => l.status === 'OPEN')
    let actualLabelId = labelId

    // VERIFICACIÓN CRÍTICA: Si se proporciona un labelId, verificar que esté ABIERTO
    if (actualLabelId) {
      const selectedLabel = currentLabels.find((l) => l.labelId === actualLabelId)

      // Si la etiqueta está CERRADA o no existe → bloquear y crear nueva
      if (!selectedLabel || selectedLabel.status === 'CLOSED') {
        // Si hay otras etiquetas abiertas, preguntar al usuario
        if (openLabels.length > 1) {
          setPendingScanForLabelSelection({ input, additionalData })
          setSelectLabelModalOpen(true)
          toast('La etiqueta seleccionada está cerrada. Seleccione una etiqueta abierta.')
          return
        } else if (openLabels.length === 1) {
          // Solo hay una abierta, usarla automáticamente
          actualLabelId = openLabels[0].labelId
          setSelectedLabelId(actualLabelId)
          toast.success('Etiqueta cerrada detectada - Cambiando a etiqueta abierta')
        } else {
          // No hay etiquetas abiertas, crear una nueva
          try {
            const newLabel = await createLabel(orderId, session.user.userId)
            await loadLabels()
            setSelectedLabelId(newLabel.labelId)
            actualLabelId = newLabel.labelId
            toast.success('Etiqueta cerrada detectada - Nueva etiqueta creada automáticamente')
          } catch (error) {
            console.error('Error creando etiqueta:', error)
            toast.error('Error al crear etiqueta')
            return
          }
        }
      }
    }

    // CASO 2: Si hay múltiples etiquetas abiertas y no hay selección → preguntar
    if ((!actualLabelId || actualLabelId === '') && openLabels.length > 1) {
      setPendingScanForLabelSelection({ input, additionalData })
      setSelectLabelModalOpen(true)
      return
    }

    // CASO 3: Si no hay etiqueta y no hay etiquetas abiertas → auto-crear
    if (!actualLabelId || actualLabelId === '') {
      if (openLabels.length === 0) {
        try {
          const newLabel = await createLabel(orderId, session.user.userId)
          await loadLabels()
          setSelectedLabelId(newLabel.labelId)
          actualLabelId = newLabel.labelId
          toast.success('Etiqueta creada automáticamente')
        } catch (error) {
          console.error('Error creando etiqueta:', error)
          toast.error('Error al crear etiqueta')
          return
        }
      } else if (openLabels.length === 1) {
        // Solo hay una etiqueta abierta → usarla automáticamente
        actualLabelId = openLabels[0].labelId
        setSelectedLabelId(actualLabelId)
      }
    }

    // Guardar último código escaneado
    setLastScannedCode(input)

    try {
      // Pasar quickMode en additionalData
      const scanData = { ...additionalData, quickMode }
      const result = await processScan(input, orderId, actualLabelId, session.user.userId, scanData)

      if (result.success) {
        // Feedback visual de éxito
        setFlashFeedback('success')
        setActiveSkuId('')

        // Reproducir sonido de éxito
        playSuccess()

        // Guardar último scanId para poder deshacerlo
        if (result.scan?.scanId) {
          console.log('💾 Guardando lastScanId:', result.scan.scanId)
          setLastScanId(result.scan.scanId)
        } else {
          console.warn('⚠️ No se recibió scanId en el resultado')
        }

        // Incrementar contador de scans
        setTotalSessionScans((prev) => prev + 1)

        toast.success(result.message)
        // Recargar etiquetas y header en paralelo (más rápido)
        await Promise.all([loadLabels(), loadOrderHeader()])

        // Refrescar panel de últimos scans
        setScansRefreshTrigger((prev) => prev + 1)

        // Si es una serie y se debe mantener el modal abierto
        if (keepModalOpenOnSuccess) {
          // Mantener el modal abierto, solo limpiar los datos acumulados de serie
          setAccumulatedScanData((prev: any) => {
            const { serie, ...rest } = prev
            return rest
          })
        } else {
          // Cerrar el modal completamente
          setScanResult(null)
          setPendingScanData(null)
          setAccumulatedScanData({})
          // Devolver focus al scanner sin mover el scroll
          scannerRef.current?.focus()
        }
      } else {
        if (result.requiresInput) {
          if (result.requiresInput.type === 'CONFIRM_SOBRANTE') {
            // Requiere autorización para sobrante
            authorization.requestAuthorization(
              'Registrar sobrante',
              async (authorizedBy) => {
                try {
                  await processScanWithSobrante(
                    orderId,
                    actualLabelId,
                    session.user.userId,
                    authorizedBy,
                    result.requiresInput!.data
                  )
                  toast.success('Sobrante registrado con autorización')
                  // Recargar etiquetas y header en paralelo
                  await Promise.all([loadLabels(), loadOrderHeader()])
                  setScanResult(null)
                  setAccumulatedScanData({})
                } catch (error) {
                  console.error('Error procesando sobrante:', error)
                  toast.error('Error al procesar sobrante')
                }
              },
              () => {
                setScanResult(null)
                setAccumulatedScanData({})
                toast('Escaneo cancelado')
              }
            )
          } else {
            // Requiere input adicional
            setScanResult(result)
            setPendingScanData({ input, labelId: actualLabelId })
            // Establecer SKU activo para highlight
            if (result.requiresInput.data?.skuId) {
              setActiveSkuId(result.requiresInput.data.skuId)
            }
          }
        } else {
          // Feedback visual de error
          setFlashFeedback('error')
          playError()
          toast.error(result.message)
          setAccumulatedScanData({})
          setActiveSkuId('')
        }
      }
    } catch (error) {
      console.error('Error procesando scan:', error)
      setFlashFeedback('error')
      playError()
      toast.error('Error al procesar escaneo')
      setAccumulatedScanData({})
      setActiveSkuId('')
    }
  }

  const handleScanContinue = (data: any, shouldCloseModal: boolean = true) => {
    if (pendingScanData) {
      // Acumular los datos adicionales con los anteriores
      const mergedData = { ...accumulatedScanData, ...data }
      setAccumulatedScanData(mergedData)
      const keepModalOpen = !shouldCloseModal
      handleScan(pendingScanData.input, pendingScanData.labelId, mergedData, keepModalOpen)
    }
  }

  const handleReportFaltante = (lineId: string) => {
    const line = order?.lines.find((l) => l.lineId === lineId)
    if (line) {
      setLineForFaltante(line)
      setFaltanteModalOpen(true)
    }
  }

  const handleConfirmFaltante = async (lineId: string, comentario?: string) => {
    if (!orderId || !session) return

    try {
      await reportFaltante(orderId, lineId, session.user.userId, comentario)
      toast.success('Faltante reportado')
      setFaltanteModalOpen(false)
      setLineForFaltante(null)
      // Solo recargar header (actualiza progreso y líneas)
      await loadOrderHeader()
    } catch (error: any) {
      console.error('Error reportando faltante:', error)
      toast.error(error.message || 'Error al reportar faltante')
    }
  }

  const handleCloseOrder = async () => {
    if (!orderId || !session) return

    // Verificar si hay etiquetas abiertas
    const openLabels = labels.filter((l) => l.status === 'OPEN')

    // De las etiquetas abiertas, identificar cuáles están vacías
    const emptyOpenLabels = openLabels.filter((l) => l.itemCount === 0 || l.scans.length === 0)

    // Si hay etiquetas vacías, mostrar modal y no permitir cerrar
    if (emptyOpenLabels.length > 0) {
      setEmptyLabels(emptyOpenLabels)
      setEmptyLabelsModalOpen(true)
      return
    }

    // Confirmar cierre de pedido
    const confirmed = await confirm({
      title: 'Cerrar Pedido',
      message: `¿Está seguro de cerrar este pedido?\n\nSe cerrarán automáticamente todas las etiquetas abiertas (${openLabels.length}).`,
      confirmText: 'Sí, cerrar pedido',
      cancelText: 'Cancelar',
      variant: 'warning',
    })

    if (!confirmed) return

    try {
      // Primero cerrar todas las etiquetas abiertas
      if (openLabels.length > 0) {
        toast.loading(`Cerrando ${openLabels.length} etiqueta(s)...`, { id: 'closing-labels' })

        for (const label of openLabels) {
          await closeLabel(label.labelId, session.user.userId)
        }

        toast.success(`${openLabels.length} etiqueta(s) cerrada(s)`, { id: 'closing-labels' })
      }

      // Luego cerrar el pedido
      await closeOrder(orderId, session.user.userId)
      toast.success('Pedido cerrado correctamente')

      // Recargar etiquetas (se congela SEQ/TOTAL) y header (cambia estado)
      await Promise.all([loadLabels(), loadOrderHeader()])
    } catch (error) {
      console.error('Error cerrando pedido:', error)
      toast.error('Error al cerrar pedido')
    }
  }

  const handleDeleteEmptyLabels = async () => {
    if (!session) return

    try {
      toast.loading(`Eliminando ${emptyLabels.length} etiqueta(s) vacía(s)...`, { id: 'deleting-empty' })

      for (const label of emptyLabels) {
        await deleteLabel(label.labelId)
      }

      toast.success(`${emptyLabels.length} etiqueta(s) eliminada(s)`, { id: 'deleting-empty' })

      // Cerrar modal y recargar etiquetas
      setEmptyLabelsModalOpen(false)
      setEmptyLabels([])
      await loadLabels()

      // Informar al usuario que ahora puede cerrar el pedido
      toast.success('Ahora puede cerrar el pedido', { icon: '✅' })
    } catch (error) {
      console.error('Error eliminando etiquetas:', error)
      toast.error('Error al eliminar etiquetas vacías')
    }
  }

  const handleReopenOrder = () => {
    if (!orderId || !session) return

    if (session.user.role === 'OPERARIO') {
      toast.error('No tiene permisos para reabrir pedidos')
      return
    }

    authorization.requestAuthorization(
      'Reabrir pedido',
      async (_authorizedBy) => {
        try {
          await reopenOrder(orderId, session.user.userId)
          toast.success('Pedido reabierto')
          // Recargar etiquetas (se descongela SEQ/TOTAL) y header (cambia estado)
          await Promise.all([loadLabels(), loadOrderHeader()])
        } catch (error) {
          console.error('Error reabriendo pedido:', error)
          toast.error('Error al reabrir pedido')
        }
      }
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Pedido no encontrado</p>
      </div>
    )
  }

  const orderClosed = order.status === 'CONFIRMADO WMS'

  return (
    <div className="space-y-3 relative">
      {/* Feedback Flash Visual */}
      {flashFeedback && (
        <div
          className={`fixed inset-0 pointer-events-none z-50 ${
            flashFeedback === 'success'
              ? 'bg-green-500 opacity-20'
              : 'bg-red-500 opacity-20'
          } animate-pulse`}
        />
      )}
      {/* Header */}
      <div className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/outbound')}>
              ← Volver
            </Button>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl md:text-2xl font-bold text-accuracy-navy font-outfit">Pedido {order.orderId}</h2>
              <Chip
                variant={
                  order.status === 'RECEP'
                    ? 'info'
                    : order.status === 'CHK'
                    ? 'warning'
                    : 'success'
                }
              >
                {order.status}
              </Chip>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Toggle Modo Focus */}
            {!orderClosed && (
              <label className="flex items-center justify-center cursor-pointer select-none bg-accuracy-light/20 rounded-lg px-3 py-2 hover:bg-accuracy-light/30 transition">
                <input
                  type="checkbox"
                  checked={focusMode}
                  onChange={(e) => setFocusMode(e.target.checked)}
                  className="w-4 h-4 text-accuracy-medium rounded focus:ring-2 focus:ring-accuracy-medium"
                />
                <span className="ml-2 text-sm font-medium text-accuracy-navy font-outfit whitespace-nowrap">
                  🎯 Modo Focus
                </span>
              </label>
            )}

            <PrintLabelsButton order={order} labels={labels} />
            {!orderClosed && (
              <Button
                onClick={handleCloseOrder}
                variant="success"
                className="w-full sm:w-auto !px-3"
                title="Cerrar Pedido"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Button>
            )}
            {orderClosed && session?.user.role !== 'OPERARIO' && (
              <Button
                onClick={handleReopenOrder}
                variant="warning"
                className="w-full sm:w-auto !px-3"
                title="Reabrir Pedido"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
            )}
          </div>
        </div>

        {/* Progreso de Chequeo */}
        <div className="mt-6 bg-gradient-to-r from-accuracy-light/20 to-accuracy-medium-light/20 rounded-xl p-4 border-2 border-accuracy-medium/30 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-accuracy-navy uppercase tracking-wide font-outfit">
              📊 Progreso de Chequeo
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-accuracy-navy font-outfit">
                {order.totalChecked} / {order.totalPicked} unidades
              </span>
            </div>
          </div>

          {/* Info del Pedido - Compacta */}
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-accuracy-gray font-outfit uppercase tracking-wide">Cliente:</span>
              <span className="font-semibold text-accuracy-navy font-outfit">{order.client.clientName}</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-accuracy-medium/20"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-accuracy-gray font-outfit uppercase tracking-wide">Sociedad:</span>
              <span className="font-semibold text-accuracy-navy font-outfit">{order.sociedad}</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-accuracy-medium/20"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-accuracy-gray font-outfit uppercase tracking-wide">Fecha:</span>
              <span className="font-semibold text-accuracy-navy font-outfit">{formatearFecha(order.fechaCreacion)}</span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="relative h-12 bg-white rounded-lg overflow-hidden border-2 border-accuracy-medium/30 shadow-sm">
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                order.progressPercent === 100
                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                  : order.progressPercent >= 50
                  ? 'bg-gradient-to-r from-accuracy-medium to-accuracy-navy'
                  : 'bg-gradient-to-r from-accuracy-light to-accuracy-medium-light'
              }`}
              style={{ width: `${order.progressPercent}%` }}
            >
              {order.progressPercent > 15 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-xl drop-shadow-md font-outfit">
                    {order.progressPercent.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            {order.progressPercent <= 15 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-accuracy-navy font-bold text-xl font-outfit">
                  {order.progressPercent.toFixed(0)}%
                </span>
              </div>
            )}
          </div>

          {/* Indicadores de estado */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-accuracy-navy font-outfit">Completado</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-accuracy-gray/40"></div>
                <span className="text-accuracy-navy font-outfit">Pendiente: {order.totalPicked - order.totalChecked}</span>
              </div>
            </div>
            {order.progressPercent === 100 && (
              <span className="text-green-600 font-bold animate-pulse font-outfit">✓ Listo para cerrar</span>
            )}
          </div>

          {/* Stats + Últimos Scans lado a lado */}
          {!orderClosed && (
            <div className="mt-4 pt-4 border-t border-accuracy-medium/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                {/* Stats Inline Compactos */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⏱️</span>
                    <div>
                      <p className="text-sm md:text-base font-bold text-accuracy-navy font-outfit leading-none">
                        {(() => {
                          const elapsed = currentTime - sessionStartTime
                          const totalSeconds = Math.floor(elapsed / 1000)
                          const minutes = Math.floor(totalSeconds / 60)
                          const seconds = totalSeconds % 60
                          return `${minutes}:${seconds.toString().padStart(2, '0')}`
                        })()}
                      </p>
                      <p className="text-xs text-accuracy-gray font-outfit">Tiempo</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-8 bg-accuracy-medium/20"></div>

                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📦</span>
                    <div>
                      <p className="text-sm md:text-base font-bold text-accuracy-navy font-outfit leading-none">
                        {totalSessionScans}
                      </p>
                      <p className="text-xs text-accuracy-gray font-outfit">Scans</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-8 bg-accuracy-medium/20"></div>

                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="text-sm md:text-base font-bold text-accuracy-navy font-outfit leading-none">
                        {(() => {
                          const elapsed = currentTime - sessionStartTime
                          const avgSpeed = elapsed > 0 ? (totalSessionScans / (elapsed / 1000 / 60)).toFixed(1) : '0.0'
                          return avgSpeed
                        })()}
                      </p>
                      <p className="text-xs text-accuracy-gray font-outfit">items/min</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-8 bg-accuracy-medium/20"></div>

                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="text-sm md:text-base font-bold text-accuracy-navy font-outfit leading-none">
                        {order.lines.filter((l) => l.checkedQty >= l.pickedQty).length}/{order.lines.length}
                      </p>
                      <p className="text-xs text-accuracy-gray font-outfit">Líneas OK</p>
                    </div>
                  </div>
                </div>

                {/* Últimos Scans - Compacto al lado */}
                <div className="lg:pl-4 lg:border-l lg:border-accuracy-medium/20">
                  <RecentScans orderId={orderId!} refreshTrigger={scansRefreshTrigger} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STICKY PROGRESS BAR COMPACTA - Solo Desktop cuando hay scroll */}
      {!orderClosed && isProgressSticky && (
        <div className="hidden lg:block fixed top-0 left-0 right-0 z-30 transition-all duration-300 ease-out">
          <div className="bg-white/95 backdrop-blur-md border-b-2 border-accuracy-medium/30 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
              <div className="flex items-center justify-between gap-4">

                {/* Progreso compacto */}
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        order.progressPercent === 100
                          ? 'bg-green-500'
                          : 'bg-gradient-to-r from-accuracy-medium to-accuracy-navy'
                      }`}
                      style={{ width: `${order.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-accuracy-navy font-outfit">
                    {order.progressPercent.toFixed(0)}%
                  </span>
                </div>

                <div className="w-px h-6 bg-accuracy-medium/20"></div>

                {/* Stats inline ultra compactos */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-lg">⏱️</span>
                    <span className="text-sm font-bold text-accuracy-navy font-outfit">
                      {(() => {
                        const elapsed = currentTime - sessionStartTime
                        const totalSeconds = Math.floor(elapsed / 1000)
                        const minutes = Math.floor(totalSeconds / 60)
                        const seconds = totalSeconds % 60
                        return `${minutes}:${seconds.toString().padStart(2, '0')}`
                      })()}
                    </span>
                  </div>

                  <div className="w-px h-4 bg-accuracy-medium/20"></div>

                  <div className="flex items-center gap-1">
                    <span className="text-lg">📦</span>
                    <span className="text-sm font-bold text-accuracy-navy font-outfit">
                      {totalSessionScans}
                    </span>
                  </div>

                  <div className="w-px h-4 bg-accuracy-medium/20"></div>

                  <div className="flex items-center gap-1">
                    <span className="text-lg">⚡</span>
                    <span className="text-sm font-bold text-accuracy-navy font-outfit">
                      {(() => {
                        const elapsed = currentTime - sessionStartTime
                        const avgSpeed = elapsed > 0 ? (totalSessionScans / (elapsed / 1000 / 60)).toFixed(1) : '0.0'
                        return avgSpeed
                      })()}
                    </span>
                  </div>

                  <div className="w-px h-4 bg-accuracy-medium/20"></div>

                  <div className="flex items-center gap-1">
                    <span className="text-lg">🎯</span>
                    <span className="text-sm font-bold text-accuracy-navy font-outfit">
                      {order.lines.filter((l) => l.checkedQty >= l.pickedQty).length}/{order.lines.length}
                    </span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2">
                  {/* Botón Descargar PDF */}
                  <PrintLabelsButton order={order} labels={labels} />

                  {/* Botón Cerrar Pedido */}
                  <Button
                    onClick={handleCloseOrder}
                    variant="success"
                    size="sm"
                    className="!px-3"
                    title="Cerrar Pedido"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </Button>
                </div>

                <div className="w-px h-6 bg-accuracy-medium/20"></div>

                {/* Último Scan - Display directo */}
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-accuracy-light/20 to-accuracy-medium-light/20 border border-accuracy-medium/30">
                  {(() => {
                    // Obtener el último scan del pedido
                    const allScans = labels.flatMap((l) => l.scans)
                    const lastScan = allScans.length > 0
                      ? allScans.sort((a, b) =>
                          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                        )[0]
                      : null

                    if (!lastScan) {
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">📋</span>
                          <span className="text-xs text-accuracy-navy/70 font-outfit">
                            Sin scans aún
                          </span>
                        </div>
                      )
                    }

                    // Obtener info de la etiqueta
                    const label = labels.find((l) => l.labelId === lastScan.labelId)
                    const labelSeq = label?.seq

                    return (
                      <>
                        <span className="text-sm">📋</span>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-accuracy-navy font-outfit">
                                {lastScan.skuId}
                              </span>
                              {labelSeq !== undefined && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accuracy-navy/20 text-accuracy-navy font-outfit">
                                  #{labelSeq.toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-accuracy-navy/60 font-outfit">
                              Último scan
                            </span>
                          </div>
                          <div className="w-px h-6 bg-accuracy-medium/30"></div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-accuracy-medium font-outfit">
                              {lastScan.qty > 0 ? '+' : ''}{lastScan.qty} {lastScan.uom}
                            </p>
                            {lastScan.serie && (
                              <p className="text-[9px] font-mono text-accuracy-gray font-outfit">
                                #{lastScan.serie}
                              </p>
                            )}
                            {lastScan.lote && !lastScan.serie && (
                              <p className="text-[9px] font-mono text-accuracy-gray font-outfit">
                                Lote: {lastScan.lote}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAYOUT VERTICAL FULL WIDTH */}
      {/* Wrapper para las secciones */}
      <div className="space-y-4">

        {/* Mobile/Tablet: Resumen Sticky - Solo visible en pantallas < 1024px */}
        {!focusMode && (
          <div className="lg:hidden sticky top-0 z-10">
            <LinesSummary
              lines={order.lines}
              totalPicked={order.totalPicked}
              totalChecked={order.totalChecked}
              onToggleDetail={() => setShowLinesDetail(!showLinesDetail)}
              showDetailButton={true}
              activeSkuId={activeSkuId}
            />
          </div>
        )}

        {/* Scanner - Full Width - Sticky cuando hay scroll */}
        {!orderClosed && (
          <div className={`sticky transition-all duration-300 ${
            isProgressSticky ? 'top-20' : 'top-0'
          } z-20`}>
            <ScannerInput
              ref={scannerRef}
              labels={labels}
              selectedLabelId={selectedLabelId}
              onLabelChange={setSelectedLabelId}
              onScan={(input, labelId) => {
                setAccumulatedScanData({})
                handleScan(input, labelId)
              }}
              disabled={false}
              quickMode={quickMode}
              onQuickModeChange={setQuickMode}
              soundEnabled={soundEnabled}
              onSoundEnabledChange={setSoundEnabled}
              lastScannedCode={lastScannedCode}
              onCloseLabel={handleCloseLabel}
              onViewScans={handleViewScans}
            />
          </div>
        )}

        {/* Etiquetas - Full Width */}
        {!focusMode && (
            <LabelsList
              labels={labels}
              orderClosed={orderClosed}
              onCreateLabel={handleCreateLabel}
              onCloseLabel={handleCloseLabel}
              onReopenLabel={handleReopenLabel}
              onDeleteLabel={handleDeleteLabel}
              onViewScans={handleViewScans}
              isExpanded={showLabelsSection}
              onToggleExpand={() => setShowLabelsSection(!showLabelsSection)}
            />
        )}

        {/* Líneas del Pedido - Full Width */}
        {!focusMode && (
          <>
            {/* Desktop: Siempre visible */}
            <div className="hidden lg:block">
              <OrderLines
                lines={order.lines}
                onReportFaltante={handleReportFaltante}
                activeSkuId={activeSkuId}
              />
            </div>
            {/* Mobile: Solo visible cuando se expande */}
            {showLinesDetail && (
              <div className="lg:hidden">
                <OrderLines
                  lines={order.lines}
                  onReportFaltante={handleReportFaltante}
                  activeSkuId={activeSkuId}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      {closeLabelModalOpen && labelToClose && (
        <CloseLabelModal
          isOpen={closeLabelModalOpen}
          labelId={labelToClose.labelId}
          theoreticalWeight={labelToClose.theoreticalWeight}
          onClose={handleConfirmCloseLabel}
          onCancel={() => {
            setCloseLabelModalOpen(false)
            setLabelToClose(null)
          }}
        />
      )}

      {faltanteModalOpen && lineForFaltante && (
        <ReportFaltanteModal
          isOpen={faltanteModalOpen}
          line={lineForFaltante}
          onReport={handleConfirmFaltante}
          onCancel={() => {
            setFaltanteModalOpen(false)
            setLineForFaltante(null)
          }}
        />
      )}

      {scanResult && scanResult.requiresInput && scanResult.requiresInput.type !== 'LINE_SELECTION' && (
        <ScanProcessModal
          scanResult={scanResult}
          onContinue={handleScanContinue}
          onCancel={() => {
            setScanResult(null)
            setPendingScanData(null)
            setAccumulatedScanData({})
          }}
          lineProgress={
            scanResult.requiresInput.type === 'SERIE' && scanResult.requiresInput.data?.lineId
              ? (() => {
                  const line = order?.lines.find(
                    (l) => l.lineId === scanResult.requiresInput!.data.lineId
                  )
                  return line
                    ? { checkedQty: line.checkedQty, pickedQty: line.pickedQty }
                    : undefined
                })()
              : undefined
          }
          labelInfo={
            selectedLabelId
              ? (() => {
                  const selectedLabel = labels.find((l) => l.labelId === selectedLabelId)
                  return selectedLabel
                    ? { seq: selectedLabel.seq, labelId: selectedLabel.labelId }
                    : null
                })()
              : null
          }
        />
      )}

      {scanResult && scanResult.requiresInput?.type === 'LINE_SELECTION' && scanResult.requiresInput.data && (
        <SelectLineForScanModal
          isOpen={true}
          skuId={scanResult.requiresInput.data.skuId}
          description={scanResult.requiresInput.data.description}
          lines={scanResult.requiresInput.data.lines}
          onSelect={(lineId) => {
            // Continuar el escaneo con la línea seleccionada
            const mergedData = {
              ...accumulatedScanData,
              lineId,
              skuId: scanResult.requiresInput!.data.skuId,
              eanUom: scanResult.requiresInput!.data.eanUom,
            }
            setAccumulatedScanData(mergedData)
            if (pendingScanData) {
              handleScan(pendingScanData.input, pendingScanData.labelId, mergedData, false)
            }
            setScanResult(null)
          }}
          onCancel={() => {
            setScanResult(null)
            setPendingScanData(null)
            setAccumulatedScanData({})
          }}
        />
      )}

      {authorization.isModalOpen && authorization.pendingAction && (
        <AuthorizationModal
          isOpen={authorization.isModalOpen}
          action={authorization.pendingAction.action}
          onValidate={authorization.validatePassword}
          onConfirm={authorization.confirmAuthorization}
          onCancel={authorization.cancelAuthorization}
        />
      )}

      {viewScansModalOpen && labelForViewScans && (
        <ViewScansModal
          isOpen={viewScansModalOpen}
          labelId={labelForViewScans.labelId}
          labelStatus={labelForViewScans.status}
          onClose={() => {
            setViewScansModalOpen(false)
            setLabelForViewScans(null)
          }}
          onDeleteScan={handleDeleteScan}
          onDeleteAllScans={handleDeleteAllScans}
        />
      )}

      {selectLabelModalOpen && (
        <SelectLabelModal
          isOpen={selectLabelModalOpen}
          labels={labels}
          onSelect={handleSelectLabel}
          onCancel={() => {
            setSelectLabelModalOpen(false)
            setPendingScanForLabelSelection(null)
            toast('Escaneo cancelado')
          }}
        />
      )}

      <EmptyLabelsModal
        isOpen={emptyLabelsModalOpen}
        onClose={() => setEmptyLabelsModalOpen(false)}
        emptyLabels={emptyLabels}
        onDeleteEmptyLabels={handleDeleteEmptyLabels}
      />

      <LinesDetailModal
        isOpen={showLinesDetail}
        onClose={() => setShowLinesDetail(false)}
        lines={order.lines}
        onReportFaltante={handleReportFaltante}
        activeSkuId={activeSkuId}
      />

      {/* Diálogo de confirmación */}
      {ConfirmDialogComponent}
    </div>
  )
}
