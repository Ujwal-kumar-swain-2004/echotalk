package com.echotalk.controller;

import com.echotalk.entity.Friendship;
import com.echotalk.entity.PrivateRoom;
import com.echotalk.service.FriendService;
import com.echotalk.service.PrivateRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {
    private final FriendService friendService;
    private final PrivateRoomService privateRoomService;

    @GetMapping("/friends")
    public List<Friendship> friends(Authentication auth) {
        return friendService.list(auth.getPrincipal().toString());
    }

    @PostMapping("/friends/{userId}")
    public Friendship requestFriend(@PathVariable String userId, Authentication auth) {
        return friendService.request(auth.getPrincipal().toString(), userId);
    }

    @PostMapping("/friends/requests/{requestId}")
    public Friendship respond(@PathVariable String requestId, @RequestParam boolean accept, Authentication auth) {
        return friendService.respond(requestId, auth.getPrincipal().toString(), accept);
    }

    @PostMapping("/rooms")
    public PrivateRoom createRoom(Authentication auth) {
        return privateRoomService.create(auth.getPrincipal().toString());
    }

    @PostMapping("/rooms/{code}/join")
    public PrivateRoom joinRoom(@PathVariable String code, Authentication auth) {
        return privateRoomService.join(code, auth.getPrincipal().toString());
    }
}
