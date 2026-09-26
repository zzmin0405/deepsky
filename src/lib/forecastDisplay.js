// 예보 행을 화면에 보여줄 때 쓰는 표시용 함수입니다. 서버·브라우저 어디서나 쓸 수 있습니다.

export const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));

export const VERDICT_LABELS = {
	good: '관측 유리',
	mixed: '일부 시간 유리',
	bad: '관측 불리'
};

// 별 관측 판정은 밤·새벽 시간(19시~05시)에만 의미가 있습니다. 낮에 맑은 것은 관측과 무관합니다.
export function isNightTime(time) {
	const hour = Number(String(time).slice(0, 2));
	return hour >= 19 || hour < 6;
}

// "2100"이나 "21" 같은 값을 "21시"로 보여줍니다.
export function formatHour(time) {
	return `${String(time).slice(0, 2)}시`;
}

export function formatValue(value, suffix = '') {
	return value === null || value === undefined || value === '' ? '-' : `${value}${suffix}`;
}

// 밤·새벽 시간대 중 관측에 유리한 시간만 골라냅니다.
export function favorableNightTimes(rows) {
	return rows.filter((row) => row.observable && isNightTime(row.time)).map((row) => row.time);
}

const PRECIPITATION_ICONS = { 1: '🌧️', 2: '🌨️', 3: '❄️', 4: '🌦️' };
const SKY_ICONS = {
	1: { day: '☀️', night: '🌙' },
	2: { day: '🌤️', night: '🌙' },
	3: { day: '⛅', night: '☁️' },
	4: { day: '☁️', night: '☁️' }
};

// 강수 형태가 있으면 강수 아이콘을, 없으면 하늘 상태와 낮·밤에 맞는 아이콘을 고릅니다.
export function weatherIcon(row, time) {
	if (!row) return '';

	const precipitationIcon = PRECIPITATION_ICONS[row.precipitationType];
	if (precipitationIcon) return precipitationIcon;

	const icons = SKY_ICONS[row.sky];
	if (!icons) return '';
	return isNightTime(time) ? icons.night : icons.day;
}
