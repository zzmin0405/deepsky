import { writable, derived } from 'svelte/store';
import { locations } from '$lib/constants/locations';

const province = writable('');
const city = writable('');

export const locationStore = derived(
  [province, city],
  ([$province, $city]) => {
    if (!$province || !$city) {
      return {
        locations: locations,
        selectedLocation: null,
      };
    }

    const filteredLocations = locations.filter(
      loc =>
        loc.province === $province &&
        loc.city === $city
    );

    return {
      locations: locations,
      selectedLocation: filteredLocations[0] || null,
    };
  }
);

export { province, city };