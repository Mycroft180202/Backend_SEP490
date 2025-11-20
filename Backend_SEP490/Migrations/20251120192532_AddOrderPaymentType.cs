using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend_SEP490.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderPaymentType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
        migrationBuilder.AddColumn<string>(
            name: "PaymentType",
            table: "Orders",
            type: "character varying(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "COD");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentType",
                table: "Orders");
        }
    }
}
