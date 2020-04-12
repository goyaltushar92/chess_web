using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace chess_sync_api.hubs
{
    public class PositionOnBoard 
    {
        [JsonProperty(PropertyName = "rowIndex")]
        public int RowIndex { get; set; }
        [JsonProperty(PropertyName = "columnIndex")]
        public int ColumnIndex { get; set; }
    }
    public class SyncHub : Hub
    {
        static List<string> QueuedConnections = new List<string>();
        static Dictionary<string, string> ConnectionIdToGroupMap = new Dictionary<string, string>();
        public async Task SearchPartner()
        {
            var group = await RemoveFromGroup(Context.ConnectionId);
            if (group != null)
            {
                await AbortGame(group);
            }
            string queueConnsectionId = null;
            lock (QueuedConnections) {
                if (QueuedConnections.Count > 0)
                {
                    queueConnsectionId = QueuedConnections[0];
                }
            }
            if (queueConnsectionId != null && queueConnsectionId != Context.ConnectionId)
            {
                QueuedConnections.RemoveAt(0);
                // var args = new List<object>();
                var groupName = Guid.NewGuid().ToString();
                await AddToGroup(Context.ConnectionId, groupName);
                await AddToGroup(queueConnsectionId, groupName);

                var randomizer = new Random();
                var randomNumber = randomizer.Next(0, 1);
                var onTopUser1 = randomNumber == 0 ? "white" : "black";
                var onTopUser2 = randomNumber == 0 ? "black" : "white";
                await Clients.Caller.SendAsync("initBoard", onTopUser1);
                await Clients.GroupExcept(groupName, Context.ConnectionId).SendAsync("initBoard", onTopUser2);
                return;
            }
            else
            { 
                if (queueConnsectionId == null)
                {
                    lock (QueuedConnections)
                    {
                        QueuedConnections.Add(Context.ConnectionId);
                    }
                }
            }
            
        }
        public async Task Move(PositionOnBoard from, PositionOnBoard to, string type = null)
        {
            from.RowIndex = 7 - from.RowIndex;
            from.ColumnIndex = 7 - from.ColumnIndex;

            to.RowIndex = 7 - to.RowIndex;
            to.ColumnIndex = 7 - to.ColumnIndex;

            await Clients.OthersInGroup(ConnectionIdToGroupMap[Context.ConnectionId]).SendAsync("move", from, to, type);
        }
        public async Task GameEnded() {
            var group = await RemoveFromGroup(Context.ConnectionId);
            if (group != null) 
            {
                ConnectionIdToGroupMap.Where(a => a.Value == group).Select(a => a.Key).ToList().ForEach(
                    async a => await RemoveFromGroup(a)
                    );
            }
        }
        private async Task AddToGroup(string connectionId, string group)
        {
            await Groups.AddToGroupAsync(connectionId, group);
            lock (ConnectionIdToGroupMap)
            {
                ConnectionIdToGroupMap[connectionId] = group;
            }
        }
        private async Task<string> RemoveFromGroup(string connectionId)
        {
            if (ConnectionIdToGroupMap.ContainsKey(connectionId))
            {
                
                var group = ConnectionIdToGroupMap[connectionId];
                await Groups.RemoveFromGroupAsync(connectionId, group);
                lock (ConnectionIdToGroupMap)
                {
                    ConnectionIdToGroupMap.Remove(connectionId);
                }
                return group;
            }
            return null;
        }
        private async Task AbortGame(string groupId)
        {
            await Clients.Groups(groupId).SendAsync("abort");
            await GameEnded();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var group = await RemoveFromGroup(Context.ConnectionId);
            if (group != null)
            {
                await AbortGame(group);
            }
            lock (QueuedConnections) 
            {
                var index = QueuedConnections.IndexOf(Context.ConnectionId);
                if (index> -1)  {
                    QueuedConnections.RemoveAt(index);
                } 
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}
