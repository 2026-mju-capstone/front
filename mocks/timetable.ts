export interface MockCourse {
  id: string;
  subject: string;
  professor: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

export const allAvailableClasses: MockCourse[] = [
  { id: 'c1', subject: '데이터구조', professor: '김철수', day: '월', startTime: '09:00', endTime: '10:30', room: '공학관 301' },
  { id: 'c2', subject: '운영체제', professor: '이영희', day: '화', startTime: '13:00', endTime: '14:30', room: '공학관 201' },
  { id: 'c3', subject: '알고리즘', professor: '박민준', day: '수', startTime: '10:30', endTime: '12:00', room: '정보관 101' },
  { id: 'c4', subject: '데이터베이스', professor: '최수진', day: '목', startTime: '09:00', endTime: '10:30', room: '공학관 401' },
  { id: 'c5', subject: '캡스톤', professor: '정태영', day: '금', startTime: '13:00', endTime: '16:00', room: '공학관 501' },
  { id: 'c6', subject: '영어회화', professor: 'John Smith', day: '월', startTime: '15:00', endTime: '16:30', room: '인문관 201' },
  { id: 'c7', subject: '소프트웨어공학', professor: '한지은', day: '화', startTime: '09:00', endTime: '10:30', room: '공학관 301' },
  { id: 'c8', subject: '머신러닝', professor: '이준혁', day: '수', startTime: '13:00', endTime: '14:30', room: '정보관 201' },
  { id: 'c9', subject: '웹프로그래밍', professor: '강민서', day: '목', startTime: '13:00', endTime: '14:30', room: '공학관 201' },
  { id: 'c10', subject: '네트워크', professor: '윤서준', day: '금', startTime: '09:00', endTime: '10:30', room: '공학관 102' },
  { id: 'c11', subject: '컴퓨터그래픽스', professor: '임지현', day: '월', startTime: '10:30', endTime: '12:00', room: '디자인관 301' },
  { id: 'c12', subject: '프로그래밍언어론', professor: '오현우', day: '화', startTime: '15:00', endTime: '16:30', room: '공학관 402' },
];

export const initialSemesters = ['2025년 1학기', '2024년 2학기'];

export const semesterTimetableData: Record<string, MockCourse[]> = {
  '2025년 1학기': [
    { id: 'c1', subject: '데이터구조', professor: '김철수', day: '월', startTime: '09:00', endTime: '10:30', room: '공학관 301' },
    { id: 'c2', subject: '운영체제', professor: '이영희', day: '화', startTime: '13:00', endTime: '14:30', room: '공학관 201' },
    { id: 'c3', subject: '알고리즘', professor: '박민준', day: '수', startTime: '10:30', endTime: '12:00', room: '정보관 101' },
    { id: 'c4', subject: '데이터베이스', professor: '최수진', day: '목', startTime: '09:00', endTime: '10:30', room: '공학관 401' },
    { id: 'c5', subject: '캡스톤', professor: '정태영', day: '금', startTime: '13:00', endTime: '16:00', room: '공학관 501' },
  ],
  '2024년 2학기': [
    { id: 'c6', subject: '영어회화', professor: 'John Smith', day: '월', startTime: '15:00', endTime: '16:30', room: '인문관 201' },
    { id: 'c7', subject: '소프트웨어공학', professor: '한지은', day: '화', startTime: '09:00', endTime: '10:30', room: '공학관 301' },
  ],
};
