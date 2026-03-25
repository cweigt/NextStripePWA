'use client';

interface StarRatingProps {
  value: number; // 0-10
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, readonly }: StarRatingProps) {
  const stars = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="flex gap-1 flex-wrap">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
            star <= value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          } disabled:cursor-default`}
        >
          {star}
        </button>
      ))}
    </div>
  );
}
