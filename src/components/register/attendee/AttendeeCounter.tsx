import React from 'react';
import { User, Users } from 'lucide-react';

interface AttendeeCounterProps {
  label: string;
  count: number;
  icon: string;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
}

const AttendeeCounter: React.FC<AttendeeCounterProps> = ({
  label,
  count,
  icon,
  onIncrement,
  onDecrement,
  min = 0,
  max = 10
}) => {
  return (
    <div>
      <h3 className="font-bold mb-4">{label}</h3>
      <div className="flex items-center">
        <button
          type="button"
          className="w-12 h-12 bg-slate-200 text-slate-700 rounded-l-md flex items-center justify-center text-2xl"
          onClick={onDecrement}
          disabled={count <= min}
        >
          −
        </button>
        <div className="w-20 h-12 bg-white border-t border-b border-slate-300 flex items-center justify-center text-xl font-medium">
          {count}
        </div>
        <button
          type="button"
          className="w-12 h-12 bg-slate-200 text-slate-700 rounded-r-md flex items-center justify-center text-2xl"
          onClick={onIncrement}
          disabled={count >= max}
        >
          +
        </button>
        <div className="flex items-center ml-4">
          {icon.includes('Masons') ? (
            <Users className="w-5 h-5 text-primary mr-2" />
          ) : (
            <User className="w-5 h-5 text-primary mr-2" />
          )}
          <span className="text-gray-700">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default AttendeeCounter;