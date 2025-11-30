import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AttendanceRecord, Employee } from '../types';

interface AttendanceContextType {
  records: AttendanceRecord[];
  employees: Employee[];
  addRecord: (record: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void;
  updateRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  updateEmployeePin: (employeeId: string, newPin: string) => void;
  findEmployeeByPin: (pin: string) => Employee | undefined;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  removeEmployee: (employeeId: string) => void;
  getRecordsByEmployee: (employeeId: string) => AttendanceRecord[];
  getRecordsByDate: (date: string) => AttendanceRecord[];
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// ข้อมูลพนักงานตัวอย่าง
const sampleEmployees: Employee[] = [
  { id: '1', name: 'สมชาย ใจดี', employeeCode: 'EMP001', department: 'ฝ่ายผลิต', position: 'พนักงาน', pin: '112233' },
  { id: '2', name: 'สมหญิง รักงาน', employeeCode: 'EMP002', department: 'ฝ่ายบัญชี', position: 'พนักงาน', pin: '445566' },
  { id: '3', name: 'วิชัย เก่งกาจ', employeeCode: 'EMP003', department: 'ฝ่ายขาย', position: 'หัวหน้า', pin: '778899' },
];

// ข้อมูลลงเวลาตัวอย่าง
const sampleRecords: AttendanceRecord[] = [
  {
    id: '1',
    employeeId: '1',
    employeeName: 'สมชาย ใจดี',
    date: '2025-11-29',
    checkInTime: '08:15',
    checkOutTime: '17:30',
    checkInPhoto: '',
    checkOutPhoto: '',
    status: 'pending',
    lateMinutes: 15,
    latePenalty: 30,
    createdAt: new Date(),
  },
  {
    id: '2',
    employeeId: '2',
    employeeName: 'สมหญิง รักงาน',
    date: '2025-11-29',
    checkInTime: '08:00',
    checkOutTime: '17:00',
    checkInPhoto: '',
    status: 'approved',
    lateMinutes: 0,
    latePenalty: 0,
    createdAt: new Date(),
  },
  {
    id: '3',
    employeeId: '3',
    employeeName: 'วิชัย เก่งกาจ',
    date: '2025-11-30',
    checkInTime: '08:45',
    checkInPhoto: '',
    status: 'pending',
    lateMinutes: 45,
    latePenalty: 90,
    createdAt: new Date(),
  },
];

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<AttendanceRecord[]>(sampleRecords);
  const [employees, setEmployees] = useState<Employee[]>(sampleEmployees);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return Date.now().toString();
  };

  const addRecord = (record: Omit<AttendanceRecord, 'id' | 'createdAt'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setRecords((prev) => [...prev, newRecord]);
  };

  const updateRecord = (id: string, updates: Partial<AttendanceRecord>) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === id ? { ...record, ...updates } : record
      )
    );
  };

  const updateEmployeePin = (employeeId: string, newPin: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId ? { ...emp, pin: newPin } : emp
      )
    );
  };

  const findEmployeeByPin = (pin: string) => {
    return employees.find((emp) => emp.pin === pin.trim());
  };

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const employeeCode = employee.employeeCode || `EMP${(employees.length + 1).toString().padStart(3, '0')}`;
    const pin = employee.pin || Math.floor(100000 + Math.random() * 900000).toString();
    setEmployees((prev) => [...prev, { ...employee, employeeCode, pin, id: generateId() }]);
  };

  const removeEmployee = (employeeId: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    setRecords((prev) => prev.filter((rec) => rec.employeeId !== employeeId));
  };

  const getRecordsByEmployee = (employeeId: string) => {
    return records.filter((r) => r.employeeId === employeeId);
  };

  const getRecordsByDate = (date: string) => {
    return records.filter((r) => r.date === date);
  };

  return (
    <AttendanceContext.Provider
      value={{
        records,
        employees,
        addRecord,
        updateRecord,
        updateEmployeePin,
        findEmployeeByPin,
        addEmployee,
        removeEmployee,
        getRecordsByEmployee,
        getRecordsByDate,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within AttendanceProvider');
  }
  return context;
}
