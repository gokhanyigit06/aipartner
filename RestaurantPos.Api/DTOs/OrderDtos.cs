namespace RestaurantPos.Api.DTOs
{
    public class OrderCreateDto
    {
        // TenantId & Table info
        public Guid TenantId { get; set; }
        public string TableId { get; set; } // Changed to string
        public string TableName { get; set; } // Added TableName

        // We can generate OrderNumber backend side, or accept it if offline-first
        // public string OrderNumber { get; set; } 

        public List<OrderItemCreateDto> Items { get; set; } = new();
    }

    public class OrderItemCreateDto
    {
        public Guid ProductId { get; set; }
        public string ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public string? Notes { get; set; }

        public List<OrderItemModifierCreateDto> Modifiers { get; set; } = new();
    }

    public class OrderItemModifierCreateDto
    {
        public string ModifierName { get; set; }
        public decimal Price { get; set; }
    }

    public class OrderDto 
    {
        public Guid Id { get; set; }
        public string OrderNumber { get; set; }
        public string TableName { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
    }

    public class OrderItemDto
    {
        public string ProductName { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
        public List<OrderItemModifierDto> Modifiers { get; set; } = new();
    }

    public class OrderItemModifierDto
    {
        public string ModifierName { get; set; }
    }
}
