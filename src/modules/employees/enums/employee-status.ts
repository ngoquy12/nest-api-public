export enum EmployeeStatus {
  WORKING = 'WORKING', // Đang làm việc
  TEMPORARILY_INACTIVE = 'TEMPORARILY_INACTIVE', // Đang tạm nghỉ (ví dụ: nghỉ phép, nghỉ ốm) và không thể nhận nhiệm vụ trong thời gian này
  RESIGNED = 'RESIGNED', // Đã nghỉ việc
  NOTWORKING = 'NOTWORKING', // Chưa làm việc
}
