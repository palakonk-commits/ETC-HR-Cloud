import { useState, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Webcam from 'react-webcam';
import { useAttendance } from '../context/AttendanceContext';
import { 
  Camera as CameraIcon, 
  ChevronRight,
  Fingerprint,
  CalendarDays,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Send,
  RotateCcw,
  Sparkles,
  ChevronLeft
} from 'lucide-react';

type CheckType = 'in' | 'out';
type Step = 1 | 2 | 3 | 4;

export function EmployeePage() {
  const { employees, addRecord, records, updateRecord, findEmployeeByPin } = useAttendance();
  const webcamRef = useRef<Webcam>(null);
  
  // Form states
  const [step, setStep] = useState<Step>(1);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [checkType, setCheckType] = useState<CheckType>('in');
  const today = format(new Date(), 'yyyy-MM-dd'); // ล็อควันที่เป็นวันนี้เท่านั้น
  const [hours, setHours] = useState(new Date().getHours());
  const [minutes, setMinutes] = useState(new Date().getMinutes());
  const [editingHours, setEditingHours] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const WORK_START_HOUR = 8;
  const WORK_START_MINUTE = 0;
  const LATE_PENALTY_PER_MINUTE = 2;

  const selectedEmp = employees.find(e => e.id === selectedEmployee);

  const calculateLatePenalty = (h: number, m: number) => {
    const checkInMinutes = h * 60 + m;
    const workStartMinutes = WORK_START_HOUR * 60 + WORK_START_MINUTE;
    
    if (checkInMinutes > workStartMinutes) {
      const lateMinutes = checkInMinutes - workStartMinutes;
      return { lateMinutes, penalty: lateMinutes * LATE_PENALTY_PER_MINUTE };
    }
    return { lateMinutes: 0, penalty: 0 };
  };

  const formatTime = (h: number, m: number) => 
    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedPhoto(imageSrc);
    }
  }, []);

  const handlePinChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    setPinInput(sanitized);

    if (sanitized.length === 6) {
      const employee = findEmployeeByPin(sanitized);
      if (employee) {
        setSelectedEmployee(employee.id);
        setPinError('');
        return;
      }
      setSelectedEmployee('');
      setPinError('รหัสไม่ถูกต้อง กรุณาลองใหม่');
    } else {
      setSelectedEmployee('');
      setPinError('');
    }
  };

  const clearPin = () => {
    setPinInput('');
    setPinError('');
    setSelectedEmployee('');
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !capturedPhoto) return;
    
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    const employee = employees.find((e) => e.id === selectedEmployee);
    if (!employee) return;

    const timeString = formatTime(hours, minutes);

    if (checkType === 'in') {
      const { lateMinutes, penalty } = calculateLatePenalty(hours, minutes);
      addRecord({
        employeeId: employee.id,
        employeeName: employee.name,
        date: today,
        checkInTime: timeString,
        checkInPhoto: capturedPhoto,
        status: 'pending',
        lateMinutes,
        latePenalty: penalty,
      });
    } else {
      const existingRecord = records.find(
        (r) => r.employeeId === selectedEmployee && r.date === today
      );
      
      if (existingRecord) {
        updateRecord(existingRecord.id, {
          checkOutTime: timeString,
          checkOutPhoto: capturedPhoto,
        });
      }
    }

    setIsSubmitting(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      setStep(1);
      setSelectedEmployee('');
      setCapturedPhoto('');
      setPinInput('');
      setPinError('');
    }, 2500);
  };

  const canProceed = () => {
    switch(step) {
      case 1: return !!selectedEmployee;
      case 2: return true;
      case 3: return !!capturedPhoto;
      default: return false;
    }
  };

  const { lateMinutes, penalty } = calculateLatePenalty(hours, minutes);

  // Success Screen
  if (showSuccess) {
    return (
      <div className="check-page">
        <div className="success-screen">
          <div className="success-icon-big">
            <CheckCircle2 size={80} />
          </div>
          <h1>บันทึกสำเร็จ!</h1>
          <p>ระบบได้บันทึกเวลา{checkType === 'in' ? 'เข้า' : 'ออก'}งานแล้ว</p>
          <div className="success-details">
            <span>{selectedEmp?.name}</span>
            <span>{formatTime(hours, minutes)} น.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="check-page">
      {/* Header */}
      <header className="check-header">
        <div className="header-top">
          <div className="header-icon-circle">
            <Fingerprint size={28} />
          </div>
          <div>
            <h1>ลงเวลา{checkType === 'in' ? 'เข้า' : 'ออก'}งาน</h1>
            <p>{format(new Date(), 'EEEE ที่ d MMMM yyyy', { locale: th })}</p>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="progress-wrapper">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
          <div className="steps-indicator">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`step-dot ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}>
                {s}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Step 1: Verify Employee PIN */}
      {step === 1 && (
        <section className="step-section">
          <div className="step-header">
            <span className="step-number">01</span>
            <div>
              <h2>ระบุรหัสพนักงาน (PIN)</h2>
              <p>กรอกรหัส 6 หลักที่ผู้ตรวจสอบมอบให้</p>
            </div>
          </div>

          <div className="pin-card">
            <label htmlFor="pin-input">รหัสพนักงาน (6 หลัก)</label>
            <input
              id="pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="••••••"
              className={`pin-input-field ${pinError ? 'error' : ''}`}
              value={pinInput}
              onChange={(e) => handlePinChange(e.target.value)}
              onBlur={() => {
                if (pinInput.length === 6 && !selectedEmployee) {
                  setPinError('รหัสไม่ถูกต้อง กรุณาลองใหม่');
                }
              }}
            />
            <div className="pin-actions-row">
              <span className="pin-hint">ป้อนตัวเลข 6 หลักเหมือนรหัส ATM</span>
              {pinInput && (
                <button type="button" className="clear-pin-btn" onClick={clearPin}>
                  ล้างรหัส
                </button>
              )}
            </div>
            {pinError && <div className="pin-error">{pinError}</div>}
          </div>

          {selectedEmp && (
            <div className="pin-preview-card">
              <div className="emp-avatar">
                {selectedEmp.name.charAt(0)}
              </div>
              <div className="emp-info">
                <strong>{selectedEmp.name}</strong>
                <span>{selectedEmp.department} • {selectedEmp.employeeCode}</span>
              </div>
              <button type="button" className="change-employee-btn" onClick={clearPin}>
                เปลี่ยนพนักงาน
              </button>
            </div>
          )}

          {/* Check Type Toggle */}
          <div className="type-toggle">
            <button 
              className={`toggle-btn ${checkType === 'in' ? 'active in' : ''}`}
              onClick={() => setCheckType('in')}
            >
              <span className="toggle-icon">→</span>
              เข้างาน
            </button>
            <button 
              className={`toggle-btn ${checkType === 'out' ? 'active out' : ''}`}
              onClick={() => setCheckType('out')}
            >
              <span className="toggle-icon">←</span>
              ออกงาน
            </button>
          </div>
        </section>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <section className="step-section">
          <div className="step-header">
            <span className="step-number">02</span>
            <div>
              <h2>เลือกวันที่และเวลา</h2>
              <p>ระบุเวลาที่ต้องการบันทึก</p>
            </div>
          </div>

          {/* Date Display - ล็อควันนี้ */}
          <div className="datetime-card">
            <div className="datetime-row">
              <CalendarDays size={24} />
              <div className="datetime-info">
                <label>วันที่</label>
                <span className="date-display">{format(new Date(today), 'd MMMM yyyy', { locale: th })}</span>
              </div>
            </div>
          </div>

          {/* Time Display - กดที่ตัวเลขเพื่อแก้ไข */}
          <div className="time-card">
            <div className="time-display-big">
              {editingHours ? (
                <input
                  type="number"
                  className="time-input"
                  value={hours}
                  min={0}
                  max={23}
                  autoFocus
                  onChange={(e) => setHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                  onBlur={() => setEditingHours(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingHours(false)}
                />
              ) : (
                <span className="time-num clickable" onClick={() => setEditingHours(true)}>
                  {hours.toString().padStart(2, '0')}
                </span>
              )}
              <span className="time-sep">:</span>
              {editingMinutes ? (
                <input
                  type="number"
                  className="time-input"
                  value={minutes}
                  min={0}
                  max={59}
                  autoFocus
                  onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  onBlur={() => setEditingMinutes(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingMinutes(false)}
                />
              ) : (
                <span className="time-num clickable" onClick={() => setEditingMinutes(true)}>
                  {minutes.toString().padStart(2, '0')}
                </span>
              )}
            </div>
            <p className="time-hint">💡 กดที่ตัวเลขเพื่อแก้ไข</p>
            
            <button className="now-btn" onClick={() => {
              setHours(new Date().getHours());
              setMinutes(new Date().getMinutes());
            }}>
              <Timer size={18} />
              ใช้เวลาปัจจุบัน
            </button>
          </div>

          {/* Penalty Warning */}
          {checkType === 'in' && (
            <div className={`penalty-card ${lateMinutes > 0 ? 'warning' : 'ok'}`}>
              {lateMinutes > 0 ? (
                <>
                  <AlertTriangle size={24} />
                  <div>
                    <strong>มาสาย {lateMinutes} นาที</strong>
                    <span>หักค่าสาย {penalty} บาท</span>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 size={24} />
                  <div>
                    <strong>ตรงเวลา</strong>
                    <span>เข้างานก่อน 08:00 น.</span>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* Step 3: Take Photo */}
      {step === 3 && (
        <section className="step-section">
          <div className="step-header">
            <span className="step-number">03</span>
            <div>
              <h2>ถ่ายรูปยืนยัน</h2>
              <p>ถ่ายรูปใบหน้าเพื่อยืนยันตัวตน</p>
            </div>
          </div>

          <div className="camera-section">
            {!capturedPhoto ? (
              <>
                <div className="camera-frame">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      width: 480,
                      height: 360,
                      facingMode: 'user',
                    }}
                    className="webcam-video"
                  />
                  <div className="face-guide" />
                </div>
                <button className="capture-btn" onClick={capture}>
                  <CameraIcon size={28} />
                  <span>ถ่ายรูป</span>
                </button>
              </>
            ) : (
              <div className="photo-preview">
                <img src={capturedPhoto} alt="Captured" />
                <div className="photo-verified">
                  <Sparkles size={20} />
                  ถ่ายรูปเรียบร้อย
                </div>
                <button className="retake-btn" onClick={() => setCapturedPhoto('')}>
                  <RotateCcw size={18} />
                  ถ่ายใหม่
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <section className="step-section">
          <div className="step-header">
            <span className="step-number">04</span>
            <div>
              <h2>ยืนยันข้อมูล</h2>
              <p>ตรวจสอบข้อมูลก่อนบันทึก</p>
            </div>
          </div>

          <div className="confirm-card">
            <div className="confirm-photo">
              <img src={capturedPhoto} alt="Photo" />
            </div>
            
            <div className="confirm-details">
              <div className="confirm-row">
                <span>พนักงาน</span>
                <strong>{selectedEmp?.name}</strong>
              </div>
              <div className="confirm-row">
                <span>ประเภท</span>
                <strong className={`type-${checkType}`}>{checkType === 'in' ? 'เข้างาน' : 'ออกงาน'}</strong>
              </div>
              <div className="confirm-row">
                <span>วันที่</span>
                <strong>{format(new Date(today), 'd MMM yyyy', { locale: th })}</strong>
              </div>
              <div className="confirm-row">
                <span>เวลา</span>
                <strong>{formatTime(hours, minutes)} น.</strong>
              </div>
              {checkType === 'in' && lateMinutes > 0 && (
                <div className="confirm-row penalty">
                  <span>หักค่าสาย</span>
                  <strong>-{penalty} บาท</strong>
                </div>
              )}
            </div>
          </div>

          <button 
            className="submit-btn-final" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Send size={20} />
                ยืนยันและบันทึก
              </>
            )}
          </button>
        </section>
      )}

      {/* Navigation */}
      <nav className="step-nav">
        {step > 1 && (
          <button className="nav-btn back" onClick={() => setStep((step - 1) as Step)}>
            <ChevronLeft size={20} />
            ย้อนกลับ
          </button>
        )}
        {step < 4 && (
          <button 
            className="nav-btn next" 
            onClick={() => setStep((step + 1) as Step)}
            disabled={!canProceed()}
          >
            ถัดไป <ChevronRight size={20} />
          </button>
        )}
      </nav>
    </div>
  );
}
