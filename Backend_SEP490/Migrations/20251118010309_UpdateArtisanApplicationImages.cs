using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend_SEP490.Migrations
{
    /// <inheritdoc />
    public partial class UpdateArtisanApplicationImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ArtisanApplications' AND column_name = 'IdentityFrontImage'
    ) THEN
        ALTER TABLE ""ArtisanApplications"" RENAME COLUMN ""IdentityFrontImage"" TO ""IdentityFrontImageUrl"";
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ArtisanApplications' AND column_name = 'IdentityBackImage'
    ) THEN
        ALTER TABLE ""ArtisanApplications"" RENAME COLUMN ""IdentityBackImage"" TO ""IdentityBackImageUrl"";
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ArtisanApplications' AND column_name = 'IdentityBackImagePublicId'
    ) THEN
        ALTER TABLE ""ArtisanApplications"" ADD ""IdentityBackImagePublicId"" text;
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ArtisanApplications' AND column_name = 'IdentityFrontImagePublicId'
    ) THEN
        ALTER TABLE ""ArtisanApplications"" ADD ""IdentityFrontImagePublicId"" text;
    END IF;
END $$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ArtisanApplications' AND column_name = 'IdentityBackImagePublicId'
    ) THEN
        ALTER TABLE ""ArtisanApplications"" DROP COLUMN ""IdentityBackImagePublicId"";
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ArtisanApplications' AND column_name = 'IdentityFrontImagePublicId'
    ) THEN
        ALTER TABLE ""ArtisanApplications"" DROP COLUMN ""IdentityFrontImagePublicId"";
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ArtisanApplications' AND column_name = 'IdentityFrontImageUrl'
    ) THEN
        ALTER TABLE ""ArtisanApplications"" RENAME COLUMN ""IdentityFrontImageUrl"" TO ""IdentityFrontImage"";
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ArtisanApplications' AND column_name = 'IdentityBackImageUrl'
    ) THEN
        ALTER TABLE ""ArtisanApplications"" RENAME COLUMN ""IdentityBackImageUrl"" TO ""IdentityBackImage"";
    END IF;
END $$;
");
        }
    }
}
