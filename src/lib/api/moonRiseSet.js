export async function getMoonRiseSet(latitude, longitude, date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
  
    const currentDate = new Date();
    // const year = currentDate.getFullYear();
    // const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    // const day = String(currentDate.getDate()).padStart(2, '0');
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
    moonrise: moonInfo.getElementsByTagName('moonrise')[0]?.textContent || 'N/A',
    moonset: moonInfo.getElementsByTagName('moonset')[0]?.textContent || 'N/A',
    astronomicalTwilightBegin: moonInfo.getElementsByTagName('astronomical_twilight_begin')[0]?.textContent || 'N/A',
    astronomicalTwilightEnd: moonInfo.getElementsByTagName('astronomical_twilight_end')[0]?.textContent || 'N/A',
  };

  }