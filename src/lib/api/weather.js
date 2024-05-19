// src/lib/api/weather.js
import axios from 'axios';
import { format } from 'date-fns';

const API_KEY = 'UVW4wG79WCklkQiInTEfdiSZ9QrsV1j3HoYYdoVYzjRPkZkjPYnskKpBVdBHAH5xiyeacby4Zce%2FVv2HqgIUOA%3D%3D';
const API_URL = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';

export async function getWeather(latitude, longitude) {
  const today = format(new Date(), 'yyyyMMdd');
  const url = `${API_URL}?serviceKey=${API_KEY}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${today}&base_time=0200&nx=${Math.floor(latitude)}&ny=${Math.floor(longitude)}`;

  const response = await axios.get(url);
  return response.data.response.body.items.item;
}