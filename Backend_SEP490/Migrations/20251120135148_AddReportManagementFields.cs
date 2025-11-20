using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend_SEP490.Migrations
{
    /// <inheritdoc />
    public partial class AddReportManagementFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdminNotes",
                table: "Reports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AppealReason",
                table: "Reports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AppealStatus",
                table: "Reports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AppealedAt",
                table: "Reports",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssignedAdminId",
                table: "Reports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AssignedAt",
                table: "Reports",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResolvedAt",
                table: "Reports",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetUserId",
                table: "Reports",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reports_AssignedAdminId",
                table: "Reports",
                column: "AssignedAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_TargetUserId",
                table: "Reports",
                column: "TargetUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Users_AssignedAdminId",
                table: "Reports",
                column: "AssignedAdminId",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Users_TargetUserId",
                table: "Reports",
                column: "TargetUserId",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Users_AssignedAdminId",
                table: "Reports");

            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Users_TargetUserId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_AssignedAdminId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_TargetUserId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "AdminNotes",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "AppealReason",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "AppealStatus",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "AppealedAt",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "AssignedAdminId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "AssignedAt",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "ResolvedAt",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "TargetUserId",
                table: "Reports");
        }
    }
}
