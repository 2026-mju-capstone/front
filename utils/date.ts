/**
 * 포맷팅 및 유효성 검사 등 순수 함수를 위한 유틸리티
 */

/**
 * ISO 날짜 문자열을 "N분 전", "N시간 전" 등의 상대적 시간으로 변환
 */
export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  return `${day}일 전`;
}

/**
 * ISO 날짜 문자열을 HH:MM 형식의 시간으로 변환
 */
export function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const h = d.getHours();
  const hh = String(h).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * ISO 날짜 문자열을 "M월 D일" 또는 "오늘" 형식으로 변환
 */
export function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
    return "오늘";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
