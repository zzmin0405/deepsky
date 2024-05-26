
export async function getMoonRiseSet(latitude, longitude, date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const API_KEY = 'UVW4wG79WCklkQiInTEfdiSZ9QrsV1j3HoYYdoVYzjRPkZkjPYnskKpBVdBHAH5xiyeacby4Zce%2FVv2HqgIUOA%3D%3D';
  const response = await fetch(
    `http://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getLCRiseSetInfo?serviceKey=${API_KEY}&locdate=${year}${month}${day}&latitude=${latitude}&longitude=${longitude}&dnYn=Y`
  );

  const xmlText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const moonInfo = xmlDoc.getElementsByTagName('item')[0];

  if (!moonInfo) {
    throw new Error('Moon data not found in the XML response');
  }

  return {
    moonrise: formatTime(moonInfo.getElementsByTagName('moonrise')[0]?.textContent),
    moonset: formatTime(moonInfo.getElementsByTagName('moonset')[0]?.textContent),
  };
}

function formatTime(timeString) {
  if (!timeString) return '-';
  
  const hours = timeString.slice(0, 2);
  const minutes = timeString.slice(2, 4);
  
  return `${hours}:${minutes}`;
}