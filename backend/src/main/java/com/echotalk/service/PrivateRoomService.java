package com.echotalk.service;

import com.echotalk.entity.PrivateRoom;
import com.echotalk.repository.PrivateRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrivateRoomService {
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();
    private final PrivateRoomRepository privateRoomRepository;

    @Transactional
    public PrivateRoom create(String hostId) {
        String code;
        do {
            code = random.ints(6, 0, ALPHABET.length())
                    .mapToObj(ALPHABET::charAt)
                    .collect(StringBuilder::new, StringBuilder::append, StringBuilder::append)
                    .toString();
        } while (privateRoomRepository.findByCode(code).isPresent());
        return privateRoomRepository.save(PrivateRoom.builder()
                .code(code)
                .hostId(UUID.fromString(hostId))
                .expiresAt(Instant.now().plus(2, ChronoUnit.HOURS))
                .build());
    }

    @Transactional
    public PrivateRoom join(String code, String userId) {
        PrivateRoom room = requireActive(code);
        UUID user = UUID.fromString(userId);
        if (!room.getHostId().equals(user)) room.setGuestId(user);
        return privateRoomRepository.save(room);
    }

    public boolean canJoin(String code, String userId) {
        PrivateRoom room = requireActive(code);
        UUID user = UUID.fromString(userId);
        return room.getHostId().equals(user) || user.equals(room.getGuestId());
    }

    private PrivateRoom requireActive(String code) {
        PrivateRoom room = privateRoomRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Private room not found"));
        if (room.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Private room expired");
        }
        return room;
    }
}
