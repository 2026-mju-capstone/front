/**
 * 카카오맵 CustomOverlay에 주입할 HTML 문자열을 생성하는 유틸리티
 */
export function getBuildingMarkerHtml(
  buildingId: number,
  name: string,
  itemCount: number,
  thumbnailUrl: string | null
): string {
  const pinColor = itemCount > 0 ? '#6366f1' : '#ccc';

  // 분실물이 없는 경우: 기본 점 형태의 마커
  if (itemCount === 0) {
    return `
      <div class="pin-wrap" id="pin-${buildingId}">
        <div class="pin-label" id="label-${buildingId}">${name}</div>
        <div class="pin-circle" style="background:${pinColor}"></div>
      </div>
    `.trim();
  }

  // 분실물이 있는 경우: 썸네일 + 개수 뱃지 형태의 커스텀 마커
  const thumbnailContent = thumbnailUrl
    ? `<div class="marker-thumb" style="background-image: url('${thumbnailUrl}')"></div>`
    : `<div class="marker-thumb-empty">
         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
           <path d="M21 8V21H3V8"></path>
           <path d="M1 3H23V8H1V3Z"></path>
           <path d="M10 12H14"></path>
         </svg>
       </div>`;

  return `
    <div class="pin-wrap" id="pin-${buildingId}">
      <div class="pin-label" id="label-${buildingId}">${name}</div>
      <div class="marker-container">
        ${thumbnailContent}
        <div class="marker-badge">${itemCount}</div>
        <div class="marker-arrow"></div>
      </div>
    </div>
  `.trim();
}
