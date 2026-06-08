package com.echotalk.repository;

import com.echotalk.entity.PrivateRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PrivateRoomRepository extends JpaRepository<PrivateRoom, UUID> {
    Optional<PrivateRoom> findByCode(String code);
}
