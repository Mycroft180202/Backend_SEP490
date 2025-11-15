using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend_SEP490.Migrations
{
    /// <inheritdoc />
    public partial class AddShipmentHistoryAndSellerProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SellerShippingProfiles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SellerId = table.Column<string>(type: "text", nullable: false),
                    PickupContactName = table.Column<string>(type: "text", nullable: true),
                    PickupContactPhone = table.Column<string>(type: "text", nullable: true),
                    PickupAddressLine = table.Column<string>(type: "text", nullable: true),
                    PickupProvinceName = table.Column<string>(type: "text", nullable: true),
                    PickupDistrictId = table.Column<int>(type: "integer", nullable: true),
                    PickupWardCode = table.Column<string>(type: "text", nullable: true),
                    GhnToken = table.Column<string>(type: "text", nullable: true),
                    GhnShopId = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SellerShippingProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SellerShippingProfiles_Users_SellerId",
                        column: x => x.SellerId,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShipmentHistories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ShipmentId = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShipmentHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShipmentHistories_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SellerShippingProfiles_SellerId",
                table: "SellerShippingProfiles",
                column: "SellerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShipmentHistories_ShipmentId",
                table: "ShipmentHistories",
                column: "ShipmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SellerShippingProfiles");

            migrationBuilder.DropTable(
                name: "ShipmentHistories");
        }
    }
}
