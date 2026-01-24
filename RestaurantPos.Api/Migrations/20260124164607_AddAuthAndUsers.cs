using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RestaurantPos.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthAndUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "PasswordHash", "Role", "TenantId", "Username" },
                values: new object[,]
                {
                    { new Guid("35a86233-06da-462b-8959-c9bef98cb82e"), "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", 1, new Guid("3fa85f64-5717-4562-b3fc-2c963f66afa6"), "garson" },
                    { new Guid("48e0e794-51e2-44e3-8f19-f89506ec1796"), "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", 3, new Guid("3fa85f64-5717-4562-b3fc-2c963f66afa6"), "kasa" },
                    { new Guid("862bb22f-06df-4370-8c03-09096436bd49"), "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", 2, new Guid("3fa85f64-5717-4562-b3fc-2c963f66afa6"), "mutfak" },
                    { new Guid("9a42bd1f-8365-43ad-a493-84571ebe4f5c"), "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", 0, new Guid("3fa85f64-5717-4562-b3fc-2c963f66afa6"), "admin" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
