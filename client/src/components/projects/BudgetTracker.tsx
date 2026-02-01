interface BudgetTrackerProps {
  budgetCost: number | null
  actualCost: number
  contingencyAmount?: number
}

export default function BudgetTracker({
  budgetCost,
  actualCost,
  contingencyAmount = 0,
}: BudgetTrackerProps) {
  if (!budgetCost) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ No budget set for this project. <strong>Set a budget</strong> to track costs against estimates.
        </p>
      </div>
    )
  }

  const totalCost = actualCost + contingencyAmount
  const variance = budgetCost - totalCost
  const percentageUsed = (totalCost / budgetCost) * 100
  const isOverBudget = variance < 0

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 uppercase font-semibold">Budget</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            £{budgetCost.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 uppercase font-semibold">Actual Cost</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            £{totalCost.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div
          className={`rounded-lg p-4 ${isOverBudget ? 'bg-red-50' : 'bg-emerald-50'}`}
        >
          <p className="text-xs text-gray-600 uppercase font-semibold">Remaining</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              isOverBudget ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            £{Math.abs(variance).toLocaleString('en-GB', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-gray-700">Budget Usage</p>
          <p className="text-sm font-bold text-gray-600">{percentageUsed.toFixed(1)}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all ${
              percentageUsed > 100
                ? 'bg-red-500'
                : percentageUsed > 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Status Message */}
      <div
        className={`rounded-lg p-3 ${
          isOverBudget ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
        }`}
      >
        <p className={`text-sm font-medium ${isOverBudget ? 'text-red-800' : 'text-green-800'}`}>
          {isOverBudget ? (
            <>
              ⚠️ <strong>Over Budget:</strong> £{Math.abs(variance).toLocaleString('en-GB', {
                maximumFractionDigits: 2,
              })}{' '}
              over budget
            </>
          ) : (
            <>
              ✅ <strong>Within Budget:</strong> £{variance.toLocaleString('en-GB', {
                maximumFractionDigits: 2,
              })}{' '}
              remaining
            </>
          )}
        </p>
      </div>

      {/* Cost Breakdown */}
      {contingencyAmount > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Estimate Total:</span>
            <span className="font-semibold">
              £{actualCost.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Contingency ({((contingencyAmount / actualCost) * 100).toFixed(1)}%):</span>
            <span className="font-semibold">
              £{contingencyAmount.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
