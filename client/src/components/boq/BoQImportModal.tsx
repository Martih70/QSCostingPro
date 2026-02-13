import Modal from '../ui/Modal'
import BoQImportForm from './BoQImportForm'

interface BoQImportModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: number
  onImportSuccess?: () => void
}

export default function BoQImportModal({
  isOpen,
  onClose,
  projectId,
  onImportSuccess
}: BoQImportModalProps) {
  const handleImportSuccess = () => {
    onImportSuccess?.()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Bill of Quantities (BoQ)"
      size="lg"
    >
      <BoQImportForm
        projectId={projectId}
        onImportSuccess={handleImportSuccess}
      />
    </Modal>
  )
}
