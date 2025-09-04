import React from "react";

interface TimelineEvent {
  id: string;
  title: string;
  timestamp: Date;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const getDaysFromToday = (timestamp: Date) => {
    const today = new Date();
    const eventDate = new Date(timestamp);
    const diffTime = today.getTime() - eventDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1d ago';
    return `${diffDays}d ago`;
  };

  return (
    <div className="px-4">
      {events.map((event, index) => (
        <div key={event.id}>
          <div className="flex items-center gap-x-3 relative">
            {/* Circle */}
            <div className="w-2 h-2 bg-midWhite rounded-full flex-shrink-0 relative z-10"></div>

            {/* Content */}
            <span className="text-xs text-white/80">
              {event.title} | {getDaysFromToday(event.timestamp)}
            </span>
          </div>
          {index < events.length - 1 && <div className="w-[2px] rounded-md ml-[3px] h-3 bg-faintWhite"></div>}
        </div>
      ))}
    </div>
  );
};

export default Timeline;
