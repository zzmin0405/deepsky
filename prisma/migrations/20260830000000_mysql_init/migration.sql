-- CreateTable
CREATE TABLE `posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL,
    `content` TEXT NOT NULL,
    `author` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `posts_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weather_cache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `location_name` VARCHAR(100) NOT NULL,
    `province` VARCHAR(50) NOT NULL,
    `city` VARCHAR(50) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `forecast_date` CHAR(8) NOT NULL,
    `forecast_time` CHAR(4) NOT NULL,
    `temperature` DOUBLE NULL,
    `humidity` DOUBLE NULL,
    `sky` INTEGER NULL,
    `sky_text` VARCHAR(30) NULL,
    `precipitation_type` INTEGER NULL,
    `precipitation_text` VARCHAR(30) NULL,
    `precipitation_probability` DOUBLE NULL,
    `precipitation_amount` VARCHAR(50) NULL,
    `snowfall` VARCHAR(50) NULL,
    `is_observable` BOOLEAN NULL,
    `source` VARCHAR(50) NOT NULL DEFAULT 'kma_vilage_fcst',
    `fetched_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `weather_cache_forecast_date_forecast_time_idx`(`forecast_date`, `forecast_time`),
    INDEX `weather_cache_fetched_at_idx`(`fetched_at`),
    UNIQUE INDEX `weather_cache_location_name_forecast_date_forecast_time_key`(`location_name`, `forecast_date`, `forecast_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `observing_places` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `province` VARCHAR(50) NOT NULL,
    `city` VARCHAR(50) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `site_score` DOUBLE NOT NULL DEFAULT 0,
    `elevation_m` INTEGER NULL,
    `light_pollution_score` DOUBLE NULL,
    `bortle_class` DOUBLE NULL,
    `sqm_mag_arcsec2` DOUBLE NULL,
    `light_pollution_year` INTEGER NULL,
    `light_pollution_source` VARCHAR(255) NULL,
    `openness_score` DOUBLE NULL,
    `access_score` DOUBLE NULL,
    `description` TEXT NOT NULL,
    `document` TEXT NOT NULL,
    `tags` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `observing_places_name_key`(`name`),
    INDEX `observing_places_is_active_site_score_idx`(`is_active`, `site_score`),
    INDEX `observing_places_province_city_idx`(`province`, `city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
