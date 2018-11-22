﻿using Kurnik.Models;
using Source.Data;
using System;

namespace Kurnik.Services
{
    public class LobbyService : ILobbyService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ILobbyInvitationSenderService _lobbyInvitationSenderService;

        private void ThrowLobbyNotFoundException(int lobbyId)
        {
            throw new ArgumentOutOfRangeException(string.Format("Lobby with id {0} not found", lobbyId));
        }

        private void ThrowUserNotFoundException(string userId)
        {
            throw new ArgumentOutOfRangeException(string.Format("User with id {0} not found", userId));
        }

        public LobbyService(ApplicationDbContext dbContext, ILobbyInvitationSenderService lobbyInvitationSenderService)
        {
            _dbContext = dbContext;
            _lobbyInvitationSenderService = lobbyInvitationSenderService;
        }

        public void EditLobby(int lobbyId, string name, bool isPrivate)
        {
            var lobby = _dbContext.Lobbies.Find(lobbyId);
            if (lobby == null)
            {
                ThrowLobbyNotFoundException(lobbyId);
            }
            lobby.Name = name;
            lobby.Private = isPrivate;
            _dbContext.SaveChanges();
        }

        public Lobby GetLobby(int id)
        {
            return _dbContext.Lobbies.Find(id);
        }

        public void AddUser(int lobbyId, string userId)
        {
            var lobby = _dbContext.Lobbies.Find(lobbyId);
            if (lobby == null)
            {
                ThrowLobbyNotFoundException(lobbyId);
            }
            var user = _dbContext.Users.Find(userId);
            if (user == null)
            {
                ThrowUserNotFoundException(userId);
            }
            var alreadyExistingParticipation = _dbContext.UserParticipationInLobbies.Find(new object[] { lobbyId, userId });
            if (alreadyExistingParticipation != null)
            {
                throw new InvalidOperationException("User is already in the lobby");
            }
            var participation = _dbContext.UserParticipationInLobbies.Add(
                new UserParticipationInLobby()
                {
                    LobbyID = lobbyId,
                    UserID = userId
                }).Entity;
            user.LobbyParticipations.Add(participation);
            lobby.UserParticipations.Add(participation);
            _dbContext.SaveChanges();
        }

        public bool IsUserOwnerOfTheLobby(int lobbyId, string userId)
        {
            var lobby = _dbContext.Lobbies.Find(lobbyId);
            if (lobby == null)
            {
                ThrowLobbyNotFoundException(lobbyId);
            }
            return lobby.OwnerId == userId;
        }

        public bool IsUserParticipatorOfTheLobby(int lobbyId, string userId)
        {
            return _dbContext.UserParticipationInLobbies.Find(new object[] { lobbyId, userId }) != null;
        }

        public void RemoveUser(int lobbyId, string userId)
        {
            var participation = _dbContext.UserParticipationInLobbies.Find(new object[] { lobbyId, userId });
            if (participation == null)
            {
                throw new InvalidOperationException(string.Format("User with id '{0} does not participate in the lobby", userId));
            }
            _dbContext.UserParticipationInLobbies.Remove(participation);
            _dbContext.SaveChanges();
        }

        public void InviteUser(int lobbyId, string invitedUserId)
        {
            var invitedUser = _dbContext.Users.Find(invitedUserId);
            if(invitedUser == null)
            {
                ThrowUserNotFoundException(invitedUserId);
            }
            var lobby = _dbContext.Lobbies.Find(lobbyId);
            if(lobby == null)
            {
                ThrowLobbyNotFoundException(lobbyId);
            }
            var invitingUser = _dbContext.Users.Find(lobby.OwnerId);
            if (IsUserParticipatorOfTheLobby(lobbyId, invitedUserId))
            {
                throw new InvalidOperationException("User is already in the lobby");
            }
            var invitation = new LobbyInvitationMessage()
            {
                InvitingUserName = invitingUser.UserName,
                LobbyId = lobbyId,
                LobbyName = lobby.Name
            };
            _lobbyInvitationSenderService.SendInvitationToLobby(invitedUserId, invitation);
        }
    }
}
