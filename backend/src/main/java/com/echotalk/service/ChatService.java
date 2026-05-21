package com.echotalk.service;

import com.echotalk.entity.ChatRoom;
import com.echotalk.entity.MatchHistory;
import com.echotalk.entity.Message;
import com.echotalk.repository.ChatRoomRepository;
import com.echotalk.repository.MatchHistoryRepository;
import com.echotalk.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final MessageRepository messageRepository;
    private final MatchHistoryRepository matchHistoryRepository;

    @Transactional
    public ChatRoom createChatRoom(String user1Id, String user2Id) {
        ChatRoom room = ChatRoom.builder()
                .user1Id(UUID.fromString(user1Id))
                .user2Id(UUID.fromString(user2Id))
                .status(ChatRoom.Status.ACTIVE)
                .build();
        room = chatRoomRepository.save(room);
        log.info("ChatRoom created: {} between {} and {}", room.getId(), user1Id, user2Id);
        return room;
    }

    @Transactional
    public Message saveMessage(String chatRoomId, String senderId, String content) {
        Message message = Message.builder()
                .chatRoomId(UUID.fromString(chatRoomId))
                .senderId(UUID.fromString(senderId))
                .content(content)
                .build();
        return messageRepository.save(message);
    }

    @Transactional
    public void endChatRoom(String chatRoomId) {
        chatRoomRepository.findById(UUID.fromString(chatRoomId)).ifPresent(room -> {
            room.setStatus(ChatRoom.Status.ENDED);
            room.setEndedAt(Instant.now());
            chatRoomRepository.save(room);

            // Save match history
            int duration = 0;
            if (room.getStartedAt() != null) {
                duration = (int) Duration.between(room.getStartedAt(), room.getEndedAt()).getSeconds();
            }
            MatchHistory history = MatchHistory.builder()
                    .user1Id(room.getUser1Id())
                    .user2Id(room.getUser2Id())
                    .durationSeconds(duration)
                    .build();
            matchHistoryRepository.save(history);

            log.info("ChatRoom {} ended. Duration: {}s", chatRoomId, duration);
        });
    }

    public long getActiveChatsCount() {
        return chatRoomRepository.countByStatus(ChatRoom.Status.ACTIVE);
    }
}
