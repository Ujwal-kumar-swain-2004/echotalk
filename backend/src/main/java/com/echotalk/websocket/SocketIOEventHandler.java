package com.echotalk.websocket;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import com.echotalk.entity.ChatRoom;
import com.echotalk.service.ChatService;
import com.echotalk.service.MatchmakingService;
import com.echotalk.service.ModerationService;
import com.echotalk.service.OnlineUserService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class SocketIOEventHandler {

    private final SocketIOServer server;
    private final MatchmakingService matchmakingService;
    private final ChatService chatService;
    private final ModerationService moderationService;
    private final OnlineUserService onlineUserService;

    // Map: sessionId -> userId
    private final Map<UUID, String> sessionUserMap = new ConcurrentHashMap<>();
    // Map: userId -> sessionId
    private final Map<String, UUID> userSessionMap = new ConcurrentHashMap<>();
    // Map: userId -> chatRoomId
    private final Map<String, String> userChatRoomMap = new ConcurrentHashMap<>();

    @PostConstruct
    public void start() {
        server.addConnectListener(onConnect());
        server.addDisconnectListener(onDisconnect());

        server.addEventListener("joinQueue", JoinQueueData.class, onJoinQueue());
        server.addEventListener("offer", SignalData.class, onOffer());
        server.addEventListener("answer", SignalData.class, onAnswer());
        server.addEventListener("iceCandidate", SignalData.class, onIceCandidate());
        server.addEventListener("nextUser", Object.class, onNextUser());
        server.addEventListener("endChat", Object.class, onEndChat());
        server.addEventListener("typing", Object.class, onTyping());
        server.addEventListener("message", MessageData.class, onMessage());
        server.addEventListener("reportUser", ReportData.class, onReportUser());

        server.start();
        log.info("Socket.IO server started on port {}", server.getConfiguration().getPort());
    }

    @PreDestroy
    public void stop() {
        server.stop();
    }

    private ConnectListener onConnect() {
        return client -> {
            String userId = getQueryParam(client, "userId");
            if (userId != null) {
                sessionUserMap.put(client.getSessionId(), userId);
                userSessionMap.put(userId, client.getSessionId());
                onlineUserService.addOnlineUser(userId);
                log.info("Client connected: {} (user: {})", client.getSessionId(), userId);

                // Send online count to all
                broadcastOnlineCount();
            } else {
                log.warn("Client connected without userId, disconnecting");
                client.disconnect();
            }
        };
    }

    private DisconnectListener onDisconnect() {
        return client -> {
            String userId = sessionUserMap.remove(client.getSessionId());
            if (userId != null) {
                userSessionMap.remove(userId);
                onlineUserService.removeOnlineUser(userId);

                // Clean up any active match
                String partnerId = matchmakingService.getActiveMatch(userId);
                if (partnerId != null) {
                    matchmakingService.clearActiveMatch(userId);
                    // End chat room
                    String chatRoomId = userChatRoomMap.remove(userId);
                    if (chatRoomId != null) {
                        chatService.endChatRoom(chatRoomId);
                        userChatRoomMap.remove(partnerId);
                    }
                    // Notify partner
                    sendToUser(partnerId, "peerDisconnected", Map.of("reason", "Partner disconnected"));
                }

                // Remove from queue
                matchmakingService.removeFromAllQueues(userId);

                broadcastOnlineCount();
                log.info("Client disconnected: {} (user: {})", client.getSessionId(), userId);
            }
        };
    }

    private DataListener<JoinQueueData> onJoinQueue() {
        return (client, data, ackSender) -> {
            String userId = sessionUserMap.get(client.getSessionId());
            if (userId == null) return;

            // Check if banned
            if (moderationService.isUserBanned(userId)) {
                client.sendEvent("error", Map.of("message", "You are banned"));
                return;
            }

            log.info("User {} joining queue (gender: {}, preferred: {})", userId, data.getGender(), data.getPreferredGender());

            // Add to queue
            matchmakingService.addToQueue(userId, data.getGender(), data.getPreferredGender(), data.getInterests());

            // Try immediate match
            String matchedUserId = matchmakingService.findMatch(userId, data.getPreferredGender());
            if (matchedUserId != null) {
                // Create chat room
                ChatRoom room = chatService.createChatRoom(userId, matchedUserId);
                String roomId = room.getId().toString();
                userChatRoomMap.put(userId, roomId);
                userChatRoomMap.put(matchedUserId, roomId);

                // Notify both users
                Map<String, Object> matchData = new HashMap<>();
                matchData.put("roomId", roomId);
                matchData.put("isInitiator", true);
                sendToUser(userId, "matchFound", matchData);

                Map<String, Object> matchData2 = new HashMap<>();
                matchData2.put("roomId", roomId);
                matchData2.put("isInitiator", false);
                sendToUser(matchedUserId, "matchFound", matchData2);

                log.info("Match found immediately: {} <-> {} in room {}", userId, matchedUserId, roomId);
            } else {
                client.sendEvent("waitingForMatch", Map.of("position", matchmakingService.getQueueSize()));
            }
        };
    }

    private DataListener<SignalData> onOffer() {
        return (client, data, ackSender) -> {
            String userId = sessionUserMap.get(client.getSessionId());
            if (userId == null) return;
            String partnerId = matchmakingService.getActiveMatch(userId);
            if (partnerId != null) {
                sendToUser(partnerId, "offer", Map.of("sdp", data.getSdp(), "roomId", data.getRoomId()));
            }
        };
    }

    private DataListener<SignalData> onAnswer() {
        return (client, data, ackSender) -> {
            String userId = sessionUserMap.get(client.getSessionId());
            if (userId == null) return;
            String partnerId = matchmakingService.getActiveMatch(userId);
            if (partnerId != null) {
                sendToUser(partnerId, "answer", Map.of("sdp", data.getSdp(), "roomId", data.getRoomId()));
            }
        };
    }

    private DataListener<SignalData> onIceCandidate() {
        return (client, data, ackSender) -> {
            String userId = sessionUserMap.get(client.getSessionId());
            if (userId == null) return;
            String partnerId = matchmakingService.getActiveMatch(userId);
            if (partnerId != null) {
                sendToUser(partnerId, "iceCandidate", Map.of("candidate", data.getCandidate(), "roomId", data.getRoomId()));
            }
        };
    }

    private DataListener<Object> onNextUser() {
        return (client, data, ackSender) -> {
            String userId = sessionUserMap.get(client.getSessionId());
            if (userId == null) return;

            // End current match
            String partnerId = matchmakingService.getActiveMatch(userId);
            if (partnerId != null) {
                matchmakingService.clearActiveMatch(userId);
                String chatRoomId = userChatRoomMap.remove(userId);
                if (chatRoomId != null) {
                    chatService.endChatRoom(chatRoomId);
                    userChatRoomMap.remove(partnerId);
                }
                sendToUser(partnerId, "peerDisconnected", Map.of("reason", "Partner skipped"));
            }

            client.sendEvent("readyForNext", Map.of());
            log.info("User {} skipped to next", userId);
        };
    }

    private DataListener<Object> onEndChat() {
        return (client, data, ackSender) -> {
            String userId = sessionUserMap.get(client.getSessionId());
            if (userId == null) return;

            String partnerId = matchmakingService.getActiveMatch(userId);
            if (partnerId != null) {
                matchmakingService.clearActiveMatch(userId);
                String chatRoomId = userChatRoomMap.remove(userId);
                if (chatRoomId != null) {
                    chatService.endChatRoom(chatRoomId);
                    userChatRoomMap.remove(partnerId);
                }
                sendToUser(partnerId, "chatEnded", Map.of("reason", "Partner ended chat"));
            }

            client.sendEvent("chatEnded", Map.of("reason", "You ended the chat"));
            log.info("User {} ended chat", userId);
        };
    }

    private DataListener<Object> onTyping() {
        return (client, data, ackSender) -> {
            String userId = sessionUserMap.get(client.getSessionId());
            if (userId == null) return;
            String partnerId = matchmakingService.getActiveMatch(userId);
            if (partnerId != null) {
                sendToUser(partnerId, "typing", Map.of("userId", userId));
            }
        };
    }

    private DataListener<MessageData> onMessage() {
        return (client, data, ackSender) -> {
            String userId = sessionUserMap.get(client.getSessionId());
            if (userId == null) return;

            String partnerId = matchmakingService.getActiveMatch(userId);
            String chatRoomId = userChatRoomMap.get(userId);

            if (partnerId != null && chatRoomId != null) {
                // Save message
                chatService.saveMessage(chatRoomId, userId, data.getContent());

                // Relay to partner
                Map<String, Object> msgData = new HashMap<>();
                msgData.put("content", data.getContent());
                msgData.put("senderId", userId);
                msgData.put("timestamp", System.currentTimeMillis());
                sendToUser(partnerId, "message", msgData);
            }
        };
    }

    private DataListener<ReportData> onReportUser() {
        return (client, data, ackSender) -> {
            String userId = sessionUserMap.get(client.getSessionId());
            if (userId == null) return;

            String partnerId = matchmakingService.getActiveMatch(userId);
            String chatRoomId = userChatRoomMap.get(userId);

            if (partnerId != null) {
                moderationService.createReport(userId, partnerId, chatRoomId, data.getReason());
                client.sendEvent("reportSubmitted", Map.of("message", "Report submitted successfully"));
            }
        };
    }

    // --- Helper methods ---

    private void sendToUser(String userId, String event, Object data) {
        UUID sessionId = userSessionMap.get(userId);
        if (sessionId != null) {
            SocketIOClient client = server.getClient(sessionId);
            if (client != null) {
                client.sendEvent(event, data);
            }
        }
    }

    private void broadcastOnlineCount() {
        long count = onlineUserService.getOnlineCount();
        server.getBroadcastOperations().sendEvent("onlineCount", Map.of("count", count));
    }

    private String getQueryParam(SocketIOClient client, String key) {
        var params = client.getHandshakeData().getUrlParams();
        if (params.containsKey(key) && !params.get(key).isEmpty()) {
            return params.get(key).get(0);
        }
        return null;
    }

    // --- Data classes for events ---

    @Data
    public static class JoinQueueData {
        private String gender;
        private String preferredGender;
        private List<String> interests;
    }

    @Data
    public static class SignalData {
        private String roomId;
        private Object sdp;
        private Object candidate;
    }

    @Data
    public static class MessageData {
        private String content;
    }

    @Data
    public static class ReportData {
        private String reason;
    }
}
