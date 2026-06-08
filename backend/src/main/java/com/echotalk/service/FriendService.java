package com.echotalk.service;

import com.echotalk.entity.Friendship;
import com.echotalk.repository.FriendshipRepository;
import com.echotalk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FriendService {
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    @Transactional
    public Friendship request(String requesterId, String addresseeId) {
        UUID requester = UUID.fromString(requesterId);
        UUID addressee = UUID.fromString(addresseeId);
        if (requester.equals(addressee) || !userRepository.existsById(addressee)) {
            throw new IllegalArgumentException("Invalid friend request");
        }
        return friendshipRepository.findByRequesterIdAndAddresseeId(requester, addressee)
                .orElseGet(() -> friendshipRepository.save(Friendship.builder()
                        .requesterId(requester).addresseeId(addressee).build()));
    }

    @Transactional
    public Friendship respond(String friendshipId, String userId, boolean accept) {
        Friendship friendship = friendshipRepository.findById(UUID.fromString(friendshipId))
                .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));
        if (!friendship.getAddresseeId().equals(UUID.fromString(userId))) {
            throw new IllegalArgumentException("You cannot respond to this request");
        }
        friendship.setStatus(accept ? Friendship.Status.ACCEPTED : Friendship.Status.DECLINED);
        return friendshipRepository.save(friendship);
    }

    public List<Friendship> list(String userId) {
        UUID id = UUID.fromString(userId);
        return friendshipRepository.findByRequesterIdOrAddresseeIdOrderByCreatedAtDesc(id, id);
    }
}
