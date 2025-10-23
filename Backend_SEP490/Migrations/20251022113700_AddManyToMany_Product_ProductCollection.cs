using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend_SEP490.Migrations
{
    /// <inheritdoc />
    public partial class AddManyToMany_Product_ProductCollection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_ProductCollections_ProductCollectionId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_ProductCollectionId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ProductCollectionId",
                table: "Products");

            migrationBuilder.CreateTable(
                name: "ProductCollectionProduct",
                columns: table => new
                {
                    ProductCollectionId = table.Column<int>(type: "integer", nullable: false),
                    ProductId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductCollectionProduct", x => new { x.ProductCollectionId, x.ProductId });
                    table.ForeignKey(
                        name: "FK_ProductCollectionProduct_ProductCollections_ProductCollecti~",
                        column: x => x.ProductCollectionId,
                        principalTable: "ProductCollections",
                        principalColumn: "ProductCollectionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductCollectionProduct_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductCollectionProduct_ProductId",
                table: "ProductCollectionProduct",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductCollectionProduct");

            migrationBuilder.AddColumn<int>(
                name: "ProductCollectionId",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_ProductCollectionId",
                table: "Products",
                column: "ProductCollectionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_ProductCollections_ProductCollectionId",
                table: "Products",
                column: "ProductCollectionId",
                principalTable: "ProductCollections",
                principalColumn: "ProductCollectionId");
        }
    }
}
