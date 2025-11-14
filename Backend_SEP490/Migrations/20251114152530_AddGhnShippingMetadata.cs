using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend_SEP490.Migrations
{
    /// <inheritdoc />
    public partial class AddGhnShippingMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactName",
                table: "Addresses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                table: "Addresses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GhnDistrictId",
                table: "Addresses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GhnProvinceId",
                table: "Addresses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GhnWardCode",
                table: "Addresses",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProductShippingProfiles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ProductId = table.Column<string>(type: "text", nullable: false),
                    WeightGram = table.Column<int>(type: "integer", nullable: true),
                    LengthCm = table.Column<int>(type: "integer", nullable: true),
                    WidthCm = table.Column<int>(type: "integer", nullable: true),
                    HeightCm = table.Column<int>(type: "integer", nullable: true),
                    AllowCod = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductShippingProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductShippingProfiles_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductShippingProfiles_ProductId",
                table: "ProductShippingProfiles",
                column: "ProductId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductShippingProfiles");

            migrationBuilder.DropColumn(
                name: "ContactName",
                table: "Addresses");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                table: "Addresses");

            migrationBuilder.DropColumn(
                name: "GhnDistrictId",
                table: "Addresses");

            migrationBuilder.DropColumn(
                name: "GhnProvinceId",
                table: "Addresses");

            migrationBuilder.DropColumn(
                name: "GhnWardCode",
                table: "Addresses");
        }
    }
}
