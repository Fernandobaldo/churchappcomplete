interface PlanFeature {
  id: string
  label: string
  description: string
}

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
        <div className="font-medium text-gray-900">{feature.label}</div>
        <div className="text-sm text-gray-600 mt-1">{feature.description}</div>
      </div>
    </label>
  )
}




