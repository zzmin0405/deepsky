// 한국 표준시(KST, UTC+9) 기준 날짜·시간 도우미입니다.
// Docker·ECS 컨테이너는 기본 시간대가 UTC라서 new Date().getHours() 같은 값을 그대로 쓰면
// "오늘"과 기상청 발표 시각이 9시간 어긋납니다. 한국은 일광 절약 시간을 쓰지 않으므로 고정 오프셋으로 계산합니다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 주어진 시각을 한국 시간 기준의 연·월·일·시·분으로 나눠 돌려줍니다.
 * @param {Date} [now]
 */
export function kstParts(now = new Date()) {
	const shifted = new Date(now.getTime() + KST_OFFSET_MS);
	return {
		year: shifted.getUTCFullYear(),
		month: shifted.getUTCMonth() + 1,
		day: shifted.getUTCDate(),
		hour: shifted.getUTCHours(),
		minute: shifted.getUTCMinutes()
	};
}

/**
 * 한국 기준 오늘 날짜를 로컬 자정 Date로 돌려줍니다.
 * date-fns의 addDays/format에 넘기면 서버 시간대와 상관없이 한국 날짜가 나옵니다.
 * @param {Date} [now]
 */
export function kstToday(now = new Date()) {
	const { year, month, day } = kstParts(now);
	return new Date(year, month - 1, day);
}

/**
 * 한국 현재 시각을 로컬 필드로 갖는 Date를 돌려줍니다. 화면 표시용입니다.
 * @param {Date} [now]
 */
export function kstNow(now = new Date()) {
	const { year, month, day, hour, minute } = kstParts(now);
	return new Date(year, month - 1, day, hour, minute);
}
