// ประเภทข้อมูลหลักของระบบ

export interface Employee {
  id: string;
  name: string;
  employeeCode: string;
  department: string;
  position: string;
  pin: string; // รหัสยืนยันของพนักงาน
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm
  checkOutTime?: string; // HH:mm
  checkInPhoto: string; // base64
  checkOutPhoto?: string; // base64
  status: 'pending' | 'approved' | 'rejected';
  reviewerNote?: string;
  lateMinutes: number;
  latePenalty: number; // นาทีละ 2 บาท
  createdAt: Date;
}

export interface TimeSliderValue {
  hours: number;
  minutes: number;
}
