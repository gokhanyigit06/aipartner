using Microsoft.AspNetCore.SignalR;

namespace RestaurantPos.Api.Hubs
{
    public class KitchenHub : Hub
    {
        // We can add specific methods here if the client needs to invoke them,
        // but for now, we just need the Hub class to exist so we can inject IHubContext.
        
        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
    }
}
