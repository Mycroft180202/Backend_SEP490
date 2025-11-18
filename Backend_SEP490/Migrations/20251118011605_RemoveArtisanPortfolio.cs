using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend_SEP490.Migrations
{
    /// <inheritdoc />
    public partial class RemoveArtisanPortfolio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PortfolioUrl",
                table: "ArtisanApplications");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PortfolioUrl",
                table: "ArtisanApplications",
                type: "text",
                nullable: true);
        }
    }
}
