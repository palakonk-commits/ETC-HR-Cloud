

interface TimeSliderProps {
  label: string;
  hours: number;
  minutes: number;
  onHoursChange: (hours: number) => void;
  onMinutesChange: (minutes: number) => void;
}

export function TimeSlider({ label, hours, minutes, onHoursChange, onMinutesChange }: TimeSliderProps) {
  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="time-slider-container">
      <label className="time-label">{label}</label>
      <div className="time-display">{formatTime(hours, minutes)}</div>
      
      <div className="slider-group">
        <div className="slider-item">
          <span className="slider-label">ชั่วโมง: {hours.toString().padStart(2, '0')}</span>
          <input
            type="range"
            min="0"
            max="23"
            value={hours}
            onChange={(e) => onHoursChange(parseInt(e.target.value))}
            className="slider"
          />
        </div>
        
        <div className="slider-item">
          <span className="slider-label">นาที: {minutes.toString().padStart(2, '0')}</span>
          <input
            type="range"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => onMinutesChange(parseInt(e.target.value))}
            className="slider"
          />
        </div>
      </div>

      {/* หรือพิมพ์เอง */}
      <div className="manual-input">
        <span>หรือพิมพ์เวลา:</span>
        <input
          type="time"
          value={formatTime(hours, minutes)}
          onChange={(e) => {
            const [h, m] = e.target.value.split(':').map(Number);
            onHoursChange(h);
            onMinutesChange(m);
          }}
          className="time-input"
        />
      </div>
    </div>
  );
}
