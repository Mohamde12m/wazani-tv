-- DDL لإضافة 3 حقول بث مستقلة لكل مباراة في Turso
-- كل رابط له: URL + نوع + عنوان اختياري

-- البث الأول (الرئيسي)
ALTER TABLE "Match" ADD COLUMN "stream1Url" TEXT;
ALTER TABLE "Match" ADD COLUMN "stream1Type" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Match" ADD COLUMN "stream1Label" TEXT;

-- البث الثاني (احتياطي)
ALTER TABLE "Match" ADD COLUMN "stream2Url" TEXT;
ALTER TABLE "Match" ADD COLUMN "stream2Type" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Match" ADD COLUMN "stream2Label" TEXT;

-- البث الثالث (احتياطي إضافي)
ALTER TABLE "Match" ADD COLUMN "stream3Url" TEXT;
ALTER TABLE "Match" ADD COLUMN "stream3Type" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Match" ADD COLUMN "stream3Label" TEXT;
