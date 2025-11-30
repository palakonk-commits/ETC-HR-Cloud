import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock, Filter, Image, UserPlus, Trash2 } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import type { AttendanceRecord } from '../types';

const POSITION_OPTIONS = ['พนักงานประจำ', 'หัวหน้าแผนก', 'ผู้จัดการ', 'เด็กฝึกงาน', 'พาร์ทไทม์'];

export function AdminPage() {
  const { records, updateRecord, employees, updateEmployeePin, addEmployee, removeEmployee } = useAttendance();
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState('');
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    department: '',
    position: POSITION_OPTIONS[0],
    employeeCode: '',
    pin: '',
  });
  const [employeeFormError, setEmployeeFormError] = useState('');
  const [employeeFormSuccess, setEmployeeFormSuccess] = useState('');

  const [pinEdits, setPinEdits] = useState<Record<string, string>>({});
  const [pinMessages, setPinMessages] = useState<Record<string, { type: 'success' | 'error'; text: string } | null>>({});

  useEffect(() => {
    const initialPins = employees.reduce<Record<string, string>>((acc, emp) => {
      acc[emp.id] = emp.pin;
      return acc;
    }, {});
    setPinEdits(initialPins);
  }, [employees]);

  const filteredRecords = records.filter((record) => {
    if (filterStatus !== 'all' && record.status !== filterStatus) return false;
    if (filterDate && record.date !== filterDate) return false;
    return true;
  });

  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const approvedCount = records.filter((r) => r.status === 'approved').length;
  const rejectedCount = records.filter((r) => r.status === 'rejected').length;
  const totalPenalty = records.reduce((sum, r) => sum + r.latePenalty, 0);

  const setPinMessage = (id: string, message: string, type: 'success' | 'error') => {
    setPinMessages((prev) => ({ ...prev, [id]: { text: message, type } }));
    setTimeout(() => {
      setPinMessages((prev) => ({ ...prev, [id]: null }));
    }, 2500);
  };

  const handlePinInputChange = (id: string, value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    setPinEdits((prev) => ({ ...prev, [id]: sanitized }));
  };

  const handleGeneratePin = (id: string) => {
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setPinEdits((prev) => ({ ...prev, [id]: generated }));
    setPinMessage(id, 'สุ่มรหัสใหม่แล้ว', 'success');
  };

  const handleSavePin = (id: string) => {
    const pin = pinEdits[id]?.trim() || '';
    if (!/^\d{6}$/.test(pin)) {
      setPinMessage(id, 'กรุณากรอกตัวเลข 6 หลัก', 'error');
      return;
    }
    updateEmployeePin(id, pin);
    setPinMessage(id, 'บันทึกรหัสสำเร็จ', 'success');
  };

  const handleEmployeeFormChange = (field: string, value: string) => {
    setEmployeeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateEmployeePin = () => {
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setEmployeeForm((prev) => ({ ...prev, pin: generated }));
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeFormError('');
    setEmployeeFormSuccess('');

    if (!employeeForm.name.trim()) {
      setEmployeeFormError('กรุณากรอกชื่อพนักงาน');
      return;
    }

    if (!employeeForm.department.trim()) {
      setEmployeeFormError('กรุณาระบุแผนก');
      return;
    }

    if (!employeeForm.employeeCode.trim()) {
      setEmployeeFormError('กรุณากรอกรหัสพนักงาน');
      return;
    }

    if (!/^\d{6}$/.test(employeeForm.pin)) {
      setEmployeeFormError('PIN ต้องเป็นตัวเลข 6 หลัก');
      return;
    }

    addEmployee({
      name: employeeForm.name.trim(),
      department: employeeForm.department.trim(),
      position: employeeForm.position,
      employeeCode: employeeForm.employeeCode.trim().toUpperCase(),
      pin: employeeForm.pin,
    });

    setEmployeeForm({
      name: '',
      department: '',
      position: POSITION_OPTIONS[0],
      employeeCode: '',
      pin: '',
    });
    setEmployeeFormSuccess('เพิ่มพนักงานเรียบร้อย');
  };

  const handleRemoveEmployee = (id: string) => {
    const employee = employees.find((emp) => emp.id === id);
    if (!employee) return;
    const confirmed = window.confirm(`ยืนยันลบ ${employee.name} ออกจากระบบหรือไม่?`);
    if (confirmed) {
      removeEmployee(id);
    }
  };

  const handleApprove = (record: AttendanceRecord) => {
    updateRecord(record.id, {
      status: 'approved',
      reviewerNote: reviewNote || 'อนุมัติ',
    });
    setSelectedRecord(null);
    setReviewNote('');
  };

  const handleReject = (record: AttendanceRecord) => {
    if (!reviewNote) {
      alert('กรุณาระบุเหตุผลในช่องหมายเหตุ');
      return;
    }
    updateRecord(record.id, {
      status: 'rejected',
      reviewerNote: reviewNote,
    });
    setSelectedRecord(null);
    setReviewNote('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-pending">รอตรวจสอบ</span>;
      case 'approved':
        return <span className="badge badge-approved">อนุมัติแล้ว</span>;
      case 'rejected':
        return <span className="badge badge-rejected">ไม่อนุมัติ</span>;
      default:
        return null;
    }
  };

  const viewPhoto = (photo: string) => {
    setViewingPhoto(photo);
    setShowPhotoModal(true);
  };

  return (
    <div className="admin-dashboard">
      <section className="admin-hero">
        <div>
          <p className="hero-eyebrow">ศูนย์ควบคุมผู้ตรวจสอบ</p>
          <h1>Admin Panel</h1>
          <p>ตรวจสอบและจัดการระบบลงเวลาได้จากหน้าจอเดียว</p>
        </div>
        <div className="hero-stat-grid">
          <div className="hero-stat-card">
            <span>รอตรวจสอบ</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="hero-stat-card">
            <span>อนุมัติแล้ว</span>
            <strong>{approvedCount}</strong>
          </div>
          <div className="hero-stat-card">
            <span>ค่าปรับสะสม</span>
            <strong>{totalPenalty} ฿</strong>
          </div>
        </div>
      </section>

      <section className="admin-panel pin-panel">
        <div className="panel-header">
          <div>
            <h2>จัดการรหัสพนักงาน (PIN)</h2>
            <p>กำหนดรหัส 6 หลักสำหรับแต่ละคนเหมือนรหัสธนาคาร</p>
          </div>
        </div>
        <div className="pin-list">
          {employees.map((emp) => (
            <div key={emp.id} className="pin-row">
              <div className="pin-info">
                <strong>{emp.name}</strong>
                <span>{emp.employeeCode} • {emp.department}</span>
              </div>
              <div className="pin-controls">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pinEdits[emp.id] ?? ''}
                  onChange={(e) => handlePinInputChange(emp.id, e.target.value)}
                  className="pin-control-input"
                />
                <button type="button" className="pin-btn ghost" onClick={() => handleGeneratePin(emp.id)}>
                  สุ่มรหัส
                </button>
                <button type="button" className="pin-btn primary" onClick={() => handleSavePin(emp.id)}>
                  บันทึก
                </button>
              </div>
              {pinMessages[emp.id] && (
                <span className={`pin-message ${pinMessages[emp.id]?.type}`}>
                  {pinMessages[emp.id]?.text}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel employee-panel">
        <div className="panel-header">
          <div>
            <h2>เพิ่ม / ลบพนักงาน</h2>
            <p>จัดการรายชื่อพนักงาน พร้อมตำแหน่ง เช่น เด็กฝึกงาน</p>
          </div>
        </div>

        <form className="employee-form" onSubmit={handleAddEmployee}>
          <div className="employee-form-grid">
            <label>
              ชื่อพนักงาน
              <input
                type="text"
                value={employeeForm.name}
                onChange={(e) => handleEmployeeFormChange('name', e.target.value)}
                placeholder="เช่น สมหมาย ใจดี"
                required
              />
            </label>
            <label>
              แผนก
              <input
                type="text"
                value={employeeForm.department}
                onChange={(e) => handleEmployeeFormChange('department', e.target.value)}
                placeholder="ฝ่ายบัญชี, ฝ่ายขาย"
                required
              />
            </label>
            <label>
              ตำแหน่ง
              <select
                value={employeeForm.position}
                onChange={(e) => handleEmployeeFormChange('position', e.target.value)}
              >
                {POSITION_OPTIONS.map((position) => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </label>
            <label>
              รหัสพนักงาน
              <input
                type="text"
                value={employeeForm.employeeCode}
                onChange={(e) => handleEmployeeFormChange('employeeCode', e.target.value)}
                placeholder="EMP010"
                required
              />
            </label>
            <label>
              PIN (6 หลัก)
              <div className="pin-input-inline">
                <input
                  type="text"
                  value={employeeForm.pin}
                  onChange={(e) => handleEmployeeFormChange('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                />
                <button type="button" className="pin-btn ghost" onClick={handleGenerateEmployeePin}>
                  สุ่ม PIN
                </button>
              </div>
            </label>
          </div>
          {employeeFormError && <div className="pin-message error">{employeeFormError}</div>}
          {employeeFormSuccess && <div className="pin-message success">{employeeFormSuccess}</div>}
          <button type="submit" className="add-employee-btn">
            <UserPlus size={18} /> เพิ่มพนักงาน
          </button>
        </form>

        <div className="employee-manage-list">
          {employees.map((emp) => (
            <div key={emp.id} className="employee-manage-row">
              <div>
                <strong>{emp.name}</strong>
                <p>{emp.department} • {emp.position} • {emp.employeeCode}</p>
              </div>
              <div className="employee-row-actions">
                <span className="employee-pin">PIN: {emp.pin}</span>
                <button type="button" className="pin-btn danger" onClick={() => handleRemoveEmployee(emp.id)}>
                  <Trash2 size={16} /> ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page admin-page">
        <div className="page-header">
          <h1>
            <Clock size={28} />
            ตรวจสอบเวลาทำงาน
          </h1>
          <p className="subtitle">ตรวจสอบและอนุมัติการลงเวลาของพนักงาน</p>
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <Filter size={18} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ไม่อนุมัติ</option>
            </select>
          </div>
          <div className="filter-group">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="filter-date"
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="btn-clear">
                ล้าง
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="stats-row">
          <div className="stat-card pending">
            <span className="stat-number">{pendingCount}</span>
            <span className="stat-label">รอตรวจสอบ</span>
          </div>
          <div className="stat-card approved">
            <span className="stat-number">{approvedCount}</span>
            <span className="stat-label">อนุมัติแล้ว</span>
          </div>
          <div className="stat-card rejected">
            <span className="stat-number">{rejectedCount}</span>
            <span className="stat-label">ไม่อนุมัติ</span>
          </div>
          <div className="stat-card total-penalty">
            <span className="stat-number">{totalPenalty}</span>
            <span className="stat-label">ค่าปรับรวม (บาท)</span>
          </div>
        </div>

        {/* Records Table */}
        <div className="records-table-container">
          <table className="records-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>พนักงาน</th>
                <th>เข้างาน</th>
                <th>ออกงาน</th>
                <th>สาย (นาที)</th>
                <th>ค่าปรับ</th>
                <th>รูปถ่าย</th>
                <th>สถานะ</th>
                <th>หมายเหตุ</th>
                <th>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-row">ไม่พบข้อมูล</td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className={`row-${record.status}`}>
                    <td>{format(new Date(record.date), 'd MMM yy', { locale: th })}</td>
                    <td>{record.employeeName}</td>
                    <td className="time-cell">{record.checkInTime}</td>
                    <td className="time-cell">{record.checkOutTime || '-'}</td>
                    <td className={record.lateMinutes > 0 ? 'late' : ''}>
                      {record.lateMinutes > 0 ? record.lateMinutes : '-'}
                    </td>
                    <td className={record.latePenalty > 0 ? 'penalty' : ''}>
                      {record.latePenalty > 0 ? `${record.latePenalty} ฿` : '-'}
                    </td>
                    <td>
                      <div className="photo-buttons">
                        {record.checkInPhoto && (
                          <button 
                            onClick={() => viewPhoto(record.checkInPhoto)}
                            className="btn-photo"
                            title="ดูรูปเข้างาน"
                          >
                            <Image size={16} /> เข้า
                          </button>
                        )}
                        {record.checkOutPhoto && (
                          <button 
                            onClick={() => viewPhoto(record.checkOutPhoto!)}
                            className="btn-photo"
                            title="ดูรูปออกงาน"
                          >
                            <Image size={16} /> ออก
                          </button>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(record.status)}</td>
                    <td className="note-cell">{record.reviewerNote || '-'}</td>
                    <td>
                      {record.status === 'pending' && (
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="btn btn-review"
                        >
                          ตรวจสอบ
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Review Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>ตรวจสอบการลงเวลา</h2>
            
            <div className="modal-content">
              <div className="review-info">
                <p><strong>พนักงาน:</strong> {selectedRecord.employeeName}</p>
                <p><strong>วันที่:</strong> {format(new Date(selectedRecord.date), 'd MMMM yyyy', { locale: th })}</p>
                <p><strong>เวลาเข้า:</strong> {selectedRecord.checkInTime}</p>
                <p><strong>เวลาออก:</strong> {selectedRecord.checkOutTime || 'ยังไม่ลงเวลาออก'}</p>
                <p><strong>มาสาย:</strong> {selectedRecord.lateMinutes} นาที</p>
                <p><strong>ค่าปรับ:</strong> {selectedRecord.latePenalty} บาท</p>
              </div>

              {selectedRecord.checkInPhoto && (
                <div className="review-photo">
                  <p><strong>รูปถ่ายเข้างาน:</strong></p>
                  <img src={selectedRecord.checkInPhoto} alt="รูปเข้างาน" />
                </div>
              )}

              <div className="form-group">
                <label>หมายเหตุ</label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="ระบุหมายเหตุ (จำเป็นสำหรับการไม่อนุมัติ)"
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => handleApprove(selectedRecord)}
                  className="btn btn-approve"
                >
                  <CheckCircle size={20} />
                  อนุมัติ (ถูก)
                </button>
                <button
                  onClick={() => handleReject(selectedRecord)}
                  className="btn btn-reject"
                >
                  <XCircle size={20} />
                  ไม่อนุมัติ (ผิด)
                </button>
                <button
                  onClick={() => {
                    setSelectedRecord(null);
                    setReviewNote('');
                  }}
                  className="btn btn-secondary"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal photo-modal" onClick={(e) => e.stopPropagation()}>
            <img src={viewingPhoto} alt="รูปถ่าย" />
            <button onClick={() => setShowPhotoModal(false)} className="btn btn-secondary">
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
