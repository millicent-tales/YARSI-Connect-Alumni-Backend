-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_profileId_key`(`profileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profiles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `student_identification_number` VARCHAR(191) NOT NULL,
    `study_program_id` VARCHAR(191) NOT NULL,
    `year_graduated` DATETIME(3) NULL,
    `work` VARCHAR(191) NULL,
    `skills` VARCHAR(191) NULL,
    `entrepreneur` VARCHAR(191) NULL,
    `competencies` VARCHAR(191) NULL,
    `career` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `linkedin` VARCHAR(191) NULL,
    `is_alumni_leader` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `programs` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `programs_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SensitiveStudentData` (
    `id` VARCHAR(191) NOT NULL,
    `profile_id` VARCHAR(191) NOT NULL,
    `pt_code` VARCHAR(191) NOT NULL DEFAULT '031026',
    `place_of_birth` VARCHAR(191) NOT NULL,
    `date_of_birth` DATETIME(3) NOT NULL,
    `national_identity_number` VARCHAR(191) NOT NULL,
    `full_address` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(191) NOT NULL,
    `mobile_number` VARCHAR(191) NOT NULL,
    `total_credits` INTEGER NOT NULL,
    `graduation_date` DATETIME(3) NOT NULL,
    `yudisium_date` DATETIME(3) NOT NULL,
    `gpa` DOUBLE NOT NULL,
    `gender` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `SensitiveStudentData_profile_id_key`(`profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `News` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `NewsStatus` ENUM('Menunggu_Persetujuan', 'Diverifikasi_Oleh_Universitas', 'Ditolak') NOT NULL DEFAULT 'Menunggu_Persetujuan',
    `rejectionReason` TEXT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `adminUniversitasId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `News_title_key`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `EventStatus` ENUM('Menunggu_Persetujuan', 'Diverifikasi_Oleh_Universitas', 'Ditolak') NOT NULL DEFAULT 'Menunggu_Persetujuan',
    `rejectionReason` TEXT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `adminUniversitasId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Event_title_key`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `image` VARCHAR(191) NULL,
    `category` ENUM('Lowongan_Kerja', 'Reuni', 'Penggalangan_Dana', 'Sesi_Berbagi_Pengalaman') NOT NULL,
    `AlumniProgramStatus` ENUM('Menunggu_Persetujuan', 'Diverifikasi_Oleh_Prodi', 'Diverifikasi_Oleh_Universitas', 'Ditolak') NOT NULL DEFAULT 'Menunggu_Persetujuan',
    `rejectionReason` TEXT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `adminProdiId` VARCHAR(191) NULL,
    `adminUniversitasId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tracer_studies` (
    `id` VARCHAR(191) NOT NULL,
    `profile_id` VARCHAR(191) NOT NULL,
    `nimhsmsmh` VARCHAR(191) NULL,
    `tahun_lulus` VARCHAR(191) NULL,
    `nmmhsmsmh` VARCHAR(191) NULL,
    `emailmsmh` VARCHAR(191) NULL,
    `kdptimsmh` VARCHAR(191) NULL,
    `kdpstmsmh` VARCHAR(191) NULL,
    `telpomsmh` VARCHAR(191) NULL,
    `nik` VARCHAR(191) NULL,
    `npwp` VARCHAR(191) NULL,
    `f8` INTEGER NOT NULL,
    `f502` INTEGER NULL,
    `f505` INTEGER NULL,
    `f5a1` TEXT NULL,
    `f5a2` TEXT NULL,
    `f1101` INTEGER NULL,
    `f1102` TEXT NULL,
    `f5b` TEXT NULL,
    `f5c` TEXT NULL,
    `f5d` TEXT NULL,
    `f18a` TEXT NULL,
    `f18b` TEXT NULL,
    `f18c` TEXT NULL,
    `f18d` DATETIME(3) NULL,
    `f1201` INTEGER NOT NULL,
    `f1202` TEXT NULL,
    `f14` INTEGER NULL,
    `f15` INTEGER NULL,
    `f1761` INTEGER NOT NULL,
    `f1762` INTEGER NOT NULL,
    `f1763` INTEGER NOT NULL,
    `f1764` INTEGER NOT NULL,
    `f1765` INTEGER NOT NULL,
    `f1766` INTEGER NOT NULL,
    `f1767` INTEGER NOT NULL,
    `f1768` INTEGER NOT NULL,
    `f1769` INTEGER NOT NULL,
    `f1770` INTEGER NOT NULL,
    `f1771` INTEGER NOT NULL,
    `f1772` INTEGER NOT NULL,
    `f1773` INTEGER NOT NULL,
    `f1774` INTEGER NOT NULL,
    `f21` INTEGER NULL,
    `f22` INTEGER NULL,
    `f23` INTEGER NULL,
    `f24` INTEGER NULL,
    `f25` INTEGER NULL,
    `f26` INTEGER NULL,
    `f27` INTEGER NULL,
    `f301` INTEGER NULL,
    `f302` INTEGER NULL,
    `f303` INTEGER NULL,
    `f401` INTEGER NULL,
    `f402` INTEGER NULL,
    `f403` INTEGER NULL,
    `f404` INTEGER NULL,
    `f405` INTEGER NULL,
    `f406` INTEGER NULL,
    `f407` INTEGER NULL,
    `f408` INTEGER NULL,
    `f409` INTEGER NULL,
    `f410` INTEGER NULL,
    `f411` INTEGER NULL,
    `f412` INTEGER NULL,
    `f413` INTEGER NULL,
    `f414` INTEGER NULL,
    `f415` INTEGER NULL,
    `f416` TEXT NULL,
    `f6` INTEGER NULL,
    `f7` INTEGER NULL,
    `f7a` INTEGER NULL,
    `f1001` INTEGER NULL,
    `f1002` TEXT NULL,
    `f1601` INTEGER NULL,
    `f1602` INTEGER NULL,
    `f1603` INTEGER NULL,
    `f1604` INTEGER NULL,
    `f1605` INTEGER NULL,
    `f1606` INTEGER NULL,
    `f1607` INTEGER NULL,
    `f1608` INTEGER NULL,
    `f1609` INTEGER NULL,
    `f1610` INTEGER NULL,
    `f1611` INTEGER NULL,
    `f1612` INTEGER NULL,
    `f1613` INTEGER NULL,
    `f1614` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tracer_studies_profile_id_key`(`profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Products` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `countReview` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Products_id_key`(`id`),
    UNIQUE INDEX `Products_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_study_program_id_fkey` FOREIGN KEY (`study_program_id`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SensitiveStudentData` ADD CONSTRAINT `SensitiveStudentData_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `News` ADD CONSTRAINT `News_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `News` ADD CONSTRAINT `News_adminUniversitasId_fkey` FOREIGN KEY (`adminUniversitasId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_adminUniversitasId_fkey` FOREIGN KEY (`adminUniversitasId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_submissions` ADD CONSTRAINT `program_submissions_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_submissions` ADD CONSTRAINT `program_submissions_adminProdiId_fkey` FOREIGN KEY (`adminProdiId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_submissions` ADD CONSTRAINT `program_submissions_adminUniversitasId_fkey` FOREIGN KEY (`adminUniversitasId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tracer_studies` ADD CONSTRAINT `tracer_studies_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Products` ADD CONSTRAINT `Products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
