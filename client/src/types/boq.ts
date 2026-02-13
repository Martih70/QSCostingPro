export interface BoQItem {
  itemNumber: string
  description: string
  unit: string
  quantity: number
  rate: number
  amount: number
  notes?: string
  sectionNumber?: number
}

export interface BoQSection {
  sectionId?: number
  sectionNumber: number | string
  sectionTitle?: string
  items?: BoQItem[]
  sectionTotal: number
  itemCount?: number
  pages?: any[]
}

export interface BoQImportResponse {
  success: boolean
  data?: {
    preview?: {
      totalSections: number
      totalItems: number
      grandTotal: number
      sections: Array<{
        sectionId: number
        sectionNumber: string
        sectionTitle: string
        itemCount: number
        sectionTotal: number
      }>
    }
    imported_items?: BoQItem[]
    sections?: BoQSection[]
    total_amount?: number
  }
  error?: string
}

export interface BoQImportState {
  items: BoQItem[]
  sections: BoQSection[]
  totalAmount: number
}
