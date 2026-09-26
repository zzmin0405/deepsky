import { db } from '../src/lib/server/db.js';
import { FALLBACK_OBSERVING_PLACES } from '../src/lib/server/observingPlaces.js';

function toDatabasePlace(place) {
	return {
		name: place.name,
		province: place.province,
		city: place.city,
		latitude: place.latitude,
		longitude: place.longitude,
		siteScore: place.siteScore,
		elevationM: place.elevationM,
		lightPollutionScore: place.lightPollutionScore,
		bortleClass: place.bortleClass,
		sqmMagArcsec2: place.sqmMagArcsec2,
		lightPollutionYear: place.lightPollutionYear,
		opennessScore: place.opennessScore,
		accessScore: place.accessScore,
		description: place.description,
		document: place.document,
		tags: place.tags,
		isActive: true
	};
}

async function main() {
	for (const place of FALLBACK_OBSERVING_PLACES) {
		const data = toDatabasePlace(place);
		await db.observingPlace.upsert({
			where: { name: place.name },
			create: data,
			update: data
		});
	}

	console.log(`관측지 ${FALLBACK_OBSERVING_PLACES.length}개를 MySQL에 반영했습니다.`);
}

main()
	.catch((error) => {
		console.error('MySQL seed 실패:', error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
