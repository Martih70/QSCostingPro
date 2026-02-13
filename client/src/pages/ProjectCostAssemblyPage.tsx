import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, ErrorAlert } from '../components/ui'
import BackButton from '../components/ui/BackButton'
import { useProjectsStore } from '../stores/projectsStore'
import { CostAssemblyLineItem, CostAssembly, InternalRate, RateCategory } from '../types/rates'
import { Project } from '../types/project'

export default function ProjectCostAssemblyPage() {
  const navigate = useNavigate()
  const { projects, isLoading: projectsLoading, fetchProjects } = useProjectsStore()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const [internalRates, setInternalRates] = useState<InternalRate[]>([])
  const [importedRates, setImportedRates] = useState<InternalRate[]>([])
  const [categories, setCategories] = useState<RateCategory[]>([])

  const [lineItems, setLineItems] = useState<CostAssemblyLineItem[]>([])
  const [globalMarkupPercentage, setGlobalMarkupPercentage] = useState(0)
  const [applyGlobalMarkup, setApplyGlobalMarkup] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showRateBrowser, setShowRateBrowser] = useState(false)
  const [showCustomLineItem, setShowCustomLineItem] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [customLineItem, setCustomLineItem] = useState({
    description: '',
    category: '',
    labour: 0,
    materials: 0,
    plant: 0,
    ohp: 0,
    uom: '',
    quantity: 1,
    markupPercentage: 0,
  })

  // Load data on mount
  useEffect(() => {
    fetchProjects()
    loadRates()
    loadCategories()
  }, [fetchProjects])

  const loadRates = () => {
    const internal = JSON.parse(localStorage.getItem('internalRates') || '[]')
    const imported = JSON.parse(localStorage.getItem('personalCostDatabase') || '[]')
    setInternalRates(internal)
    setImportedRates(imported)
  }

  const loadCategories = () => {
    const stored = localStorage.getItem('rateCategories')
    if (stored) {
      setCategories(JSON.parse(stored))
    }
  }

  const handleProjectSelect = (projectId: number) => {
    setSelectedProjectId(projectId)
    const project = projects.find(p => p.id === projectId)
    setSelectedProject(project || null)
    setLineItems([])
    setSuccessMessage(`Project "${project?.name}" selected`)
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  const allAvailableRates = [...internalRates, ...importedRates]

  const filteredRates = allAvailableRates.filter(rate => {
    const matchesCategory = selectedCategory === 'all' || rate.category === selectedCategory
    const matchesSearch = rate.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const groupedRatesByCategory = filteredRates.reduce((acc, rate) => {
    if (!acc[rate.category]) {
      acc[rate.category] = []
    }
    acc[rate.category].push(rate)
    return acc
  }, {} as { [key: string]: InternalRate[] })

  const handleAddRateAsLineItem = (rate: InternalRate) => {
    if (!selectedProject) {
      setError('Please select a project first')
      return
    }

    const newLineItem: CostAssemblyLineItem = {
      id: `line-${Date.now()}`,
      description: rate.description,
      source: internalRates.some(r => r.id === rate.id) ? 'internal' : 'imported',
      labour: rate.labour,
      materials: rate.materials,
      plant: rate.plant,
      ohp: rate.ohp,
      uom: rate.uom,
      quantity: 1,
      markupPercentage: 0,
      category: rate.category,
    }
    setLineItems([...lineItems, newLineItem])
    setSuccessMessage('Rate added to assembly')
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  const handleAddCustomLineItem = () => {
    if (!selectedProject) {
      setError('Please select a project first')
      return
    }

    if (!customLineItem.description || !customLineItem.category || !customLineItem.uom) {
      setError('Description, category, and UOM are required')
      return
    }

    if (customLineItem.labour + customLineItem.materials + customLineItem.plant + customLineItem.ohp === 0) {
      setError('At least one cost component is required')
      return
    }

    const newLineItem: CostAssemblyLineItem = {
      id: `line-${Date.now()}`,
      description: customLineItem.description,
      source: 'custom',
      labour: customLineItem.labour,
      materials: customLineItem.materials,
      plant: customLineItem.plant,
      ohp: customLineItem.ohp,
      uom: customLineItem.uom,
      quantity: customLineItem.quantity,
      markupPercentage: customLineItem.markupPercentage,
      category: customLineItem.category,
    }
    setLineItems([...lineItems, newLineItem])
    setCustomLineItem({
      description: '',
      category: '',
      labour: 0,
      materials: 0,
      plant: 0,
      ohp: 0,
      uom: '',
      quantity: 1,
      markupPercentage: 0,
    })
    setShowCustomLineItem(false)
    setSuccessMessage('Custom line item added')
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  const handleUpdateLineItem = (id: string, field: string, value: any) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleDeleteLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const calculateLineItemTotal = (item: CostAssemblyLineItem) => {
    const baseTotal = (item.labour + item.materials + item.plant + item.ohp) * item.quantity
    const markup = applyGlobalMarkup ? globalMarkupPercentage : item.markupPercentage
    return baseTotal * (1 + markup / 100)
  }

  const calculateCategoryTotals = () => {
    const totals: { [key: string]: number } = {}
    lineItems.forEach(item => {
      if (!totals[item.category]) {
        totals[item.category] = 0
      }
      totals[item.category] += calculateLineItemTotal(item)
    })
    return totals
  }

  const categoryTotals = calculateCategoryTotals()
  const grandTotal = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const handleExportPDF = () => {
    if (!selectedProject || lineItems.length === 0) {
      setError('Select a project and add line items before exporting')
      return
    }

    // Create simple HTML for PDF
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #003366; }
            .header { margin-bottom: 20px; }
            .section { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #003366; color: white; }
            .total { font-weight: bold; background-color: #f0f0f0; }
            .grand-total { font-weight: bold; font-size: 16px; background-color: #e0e0e0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${selectedProject.name}</h1>
            <p><strong>Project ID:</strong> ${selectedProject.id}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          ${Object.entries(categoryTotals).map(([category, total]) => `
            <div class="section">
              <h2>${category}</h2>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>UOM</th>
                    <th>Labour</th>
                    <th>Materials</th>
                    <th>Plant</th>
                    <th>OHP</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItems.filter(item => item.category === category).map(item => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.quantity}</td>
                      <td>${item.uom}</td>
                      <td>${formatCurrency(item.labour * item.quantity)}</td>
                      <td>${formatCurrency(item.materials * item.quantity)}</td>
                      <td>${formatCurrency(item.plant * item.quantity)}</td>
                      <td>${formatCurrency(item.ohp * item.quantity)}</td>
                      <td>${formatCurrency(calculateLineItemTotal(item))}</td>
                    </tr>
                  `).join('')}
                  <tr class="total">
                    <td colspan="7">Category Total</td>
                    <td>${formatCurrency(total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `).join('')}
          <div class="section">
            <table>
              <tr class="grand-total">
                <td colspan="7">GRAND TOTAL</td>
                <td>${formatCurrency(grandTotal)}</td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `

    const blob = new Blob([html], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedProject.name}-estimate-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    setSuccessMessage('Estimate exported')
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  const handleExportCSV = () => {
    if (!selectedProject || lineItems.length === 0) {
      setError('Select a project and add line items before exporting')
      return
    }

    let csv = 'Project Name,Project ID,Date\n'
    csv += `"${selectedProject.name}",${selectedProject.id},"${new Date().toLocaleDateString()}"\n\n`
    csv += 'Category,Description,Qty,UOM,Labour,Materials,Plant,OHP,Total\n'

    lineItems.forEach(item => {
      const total = calculateLineItemTotal(item)
      csv += `"${item.category}","${item.description}",${item.quantity},"${item.uom}",${item.labour},${item.materials},${item.plant},${item.ohp},${total}\n`
    })

    csv += '\nCategory Totals\n'
    Object.entries(categoryTotals).forEach(([category, total]) => {
      csv += `"${category}",,,,,,,,${total}\n`
    })

    csv += `\nGRAND TOTAL,,,,,,,,,${grandTotal}\n`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedProject.name}-estimate-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    setSuccessMessage('Estimate exported')
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-khc-primary">Project Cost Assembly</h1>
        <p className="text-gray-600 mt-2">Build cost estimates from rates or custom line items</p>
        {selectedProjectId && <p className="text-xs text-gray-500 mt-1">Project ID: {selectedProjectId}</p>}
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <p className="font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Project Selection */}
      {!selectedProject ? (
        <Card title="Select a Project">
          {projectsLoading ? (
            <p className="text-center text-gray-500">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-center text-gray-500">
              No projects found. <span onClick={() => navigate('/projects/new')} className="text-khc-primary cursor-pointer hover:underline">Create one first</span>
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className="text-left p-4 border border-gray-300 rounded-lg hover:border-khc-primary hover:bg-blue-50 transition"
                >
                  <p className="font-semibold text-gray-900">{project.name}</p>
                  <p className="text-sm text-gray-600">ID: {project.id}</p>
                  <p className="text-xs text-gray-500">{new Date(project.start_date).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <>
          {/* Selected Project Info */}
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Selected Project</p>
                <h2 className="text-2xl font-bold text-khc-primary">{selectedProject.name}</h2>
                <p className="text-sm text-gray-600">ID: {selectedProject.id}</p>
              </div>
              <Button variant="secondary" onClick={() => setSelectedProject(null)}>Change Project</Button>
            </div>
          </Card>

          {/* Add Line Items Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="primary" onClick={() => setShowRateBrowser(!showRateBrowser)} fullWidth>
              {showRateBrowser ? '✕ Close Rate Browser' : '+ Add Rate'}
            </Button>
            <Button variant="secondary" onClick={() => setShowCustomLineItem(!showCustomLineItem)} fullWidth>
              {showCustomLineItem ? '✕ Cancel Custom' : '+ Custom Line Item'}
            </Button>
          </div>

          {/* Rate Browser */}
          {showRateBrowser && (
            <Card title="Available Rates">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search rates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>

                {Object.entries(groupedRatesByCategory).map(([category, rates]) => (
                  <div key={category} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
                    <div className="space-y-2">
                      {rates.map(rate => (
                        <div key={rate.id} className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{rate.description}</p>
                            <p className="text-xs text-gray-600">{formatCurrency(rate.labour + rate.materials + rate.plant + rate.ohp)} / {rate.uom}</p>
                          </div>
                          <button
                            onClick={() => handleAddRateAsLineItem(rate)}
                            className="px-3 py-1 bg-khc-primary text-white rounded text-sm hover:bg-khc-secondary"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Custom Line Item Form */}
          {showCustomLineItem && (
            <Card title="Add Custom Line Item">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Description*</label>
                    <input
                      type="text"
                      value={customLineItem.description}
                      onChange={(e) => setCustomLineItem({ ...customLineItem, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category*</label>
                    <select
                      value={customLineItem.category}
                      onChange={(e) => setCustomLineItem({ ...customLineItem, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      value={customLineItem.quantity}
                      onChange={(e) => setCustomLineItem({ ...customLineItem, quantity: parseFloat(e.target.value) || 1 })}
                      min="0.01"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">UOM*</label>
                    <input
                      type="text"
                      value={customLineItem.uom}
                      onChange={(e) => setCustomLineItem({ ...customLineItem, uom: e.target.value })}
                      placeholder="m2, m3, etc"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Labour (£)</label>
                    <input
                      type="number"
                      value={customLineItem.labour || ''}
                      onChange={(e) => setCustomLineItem({ ...customLineItem, labour: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Materials (£)</label>
                    <input
                      type="number"
                      value={customLineItem.materials || ''}
                      onChange={(e) => setCustomLineItem({ ...customLineItem, materials: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Plant (£)</label>
                    <input
                      type="number"
                      value={customLineItem.plant || ''}
                      onChange={(e) => setCustomLineItem({ ...customLineItem, plant: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">OHP (£)</label>
                    <input
                      type="number"
                      value={customLineItem.ohp || ''}
                      onChange={(e) => setCustomLineItem({ ...customLineItem, ohp: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Markup %</label>
                    <input
                      type="number"
                      value={customLineItem.markupPercentage || ''}
                      onChange={(e) => setCustomLineItem({ ...customLineItem, markupPercentage: parseFloat(e.target.value) || 0 })}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={handleAddCustomLineItem}>Add Line Item</Button>
                  <Button variant="secondary" onClick={() => setShowCustomLineItem(false)}>Cancel</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Markup Settings */}
          <Card title="Markup Settings">
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={applyGlobalMarkup}
                  onChange={(e) => setApplyGlobalMarkup(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Apply global markup percentage</span>
              </label>
              {applyGlobalMarkup && (
                <div>
                  <label className="block text-sm font-medium mb-1">Global Markup %</label>
                  <input
                    type="number"
                    value={globalMarkupPercentage || ''}
                    onChange={(e) => setGlobalMarkupPercentage(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Line Items Display */}
          {lineItems.length > 0 && (
            <>
              {Object.entries(categoryTotals).map(([category, total]) => (
                <Card key={category} title={category}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-3 py-2 text-left">Description</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Labour</th>
                          <th className="px-3 py-2 text-right">Materials</th>
                          <th className="px-3 py-2 text-right">Plant</th>
                          <th className="px-3 py-2 text-right">OHP</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.filter(item => item.category === category).map(item => (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="px-3 py-2">{item.description}</td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                                step="0.01"
                                min="0.01"
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.labour * item.quantity)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.materials * item.quantity)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.plant * item.quantity)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.ohp * item.quantity)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{formatCurrency(calculateLineItemTotal(item))}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleDeleteLineItem(item.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-100 font-semibold">
                          <td colSpan={6} className="px-3 py-2 text-right">Category Total:</td>
                          <td className="px-3 py-2 text-right text-khc-primary">{formatCurrency(total)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))}

              {/* Grand Total */}
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 mb-2">GRAND TOTAL</p>
                    <p className="text-4xl font-bold text-khc-primary">{formatCurrency(grandTotal)}</p>
                  </div>
                  <div className="flex flex-col justify-end gap-2">
                    <Button variant="primary" onClick={handleExportPDF} fullWidth>
                      📄 Export as HTML/PDF
                    </Button>
                    <Button variant="secondary" onClick={handleExportCSV} fullWidth>
                      📊 Export as CSV
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
