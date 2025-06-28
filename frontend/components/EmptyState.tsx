interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}

export default function EmptyState({ 
  icon = '📝', 
  title, 
  description, 
  actionButton 
}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-gray-400 text-3xl">{icon}</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="btn-primary px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          {actionButton.text}
        </button>
      )}
    </div>
  );
}
