import Graphs from '@/components/Graphs';

export default function AnalyticsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Insights into your training patterns</p>
      </div>
      <Graphs />
    </div>
  );
}
