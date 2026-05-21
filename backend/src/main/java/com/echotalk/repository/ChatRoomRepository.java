package com.echotalk.repository;

import com.echotalk.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {
    List<ChatRoom> findByUser1IdOrUser2IdOrderByStartedAtDesc(UUID user1Id, UUID user2Id);
    long countByStatus(ChatRoom.Status status);
}
