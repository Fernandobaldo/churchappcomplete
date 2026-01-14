import { PlanFeature } from '../types'

interface FeatureToggleProps {
  feature: PlanFeature
  checked: boolean
  onChange: (checked: boolean) => void
}

export function FeatureToggle({ feature, checked, onChange }: FeatureToggleProps) {
  return (
    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 text-admin border-gray-300 rounded focus:ring-admin focus:ring-2"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{feature.label}</span>
          {feature.requiresEnforcement && (
            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
              Protegido
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 mt-1">{feature.description}</div>
      </div>
    </label>
  )
}









