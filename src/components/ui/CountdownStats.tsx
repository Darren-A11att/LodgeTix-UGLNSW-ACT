import React, { useState, useEffect } from 'react';

// --- Countdown Timer Logic & Component Definition ---
export const calculateTimeLeft = (targetDate: Date) => {
  const difference = +targetDate - +new Date();
  let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 }; 

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60), 
    };
  }
  return timeLeft;
};

const CountdownStats: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearTimeout(timer);
  });

  const stats = [
    { id: 1, name: 'Days', value: timeLeft.days },
    { id: 2, name: 'Hours', value: timeLeft.hours },
    { id: 3, name: 'Minutes', value: timeLeft.minutes },
    { id: 4, name: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    // Removed outer bg-white, padding will be handled by the section wrapper -> Restored background and padding
    <div className="bg-white py-24 sm:py-32">
      <div className="container-custom mx-auto px-6 lg:px-8">
        <h2 className="text-center text-3xl font-semibold mb-12">Time Until The Grand Proclamation</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-16 text-center md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.id} className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-base leading-7 text-gray-600">{stat.name}</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default CountdownStats; 