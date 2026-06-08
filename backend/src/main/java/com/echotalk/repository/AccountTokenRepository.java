package com.echotalk.repository;

import com.echotalk.entity.AccountToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AccountTokenRepository extends JpaRepository<AccountToken, UUID> {
    Optional<AccountToken> findByTokenAndType(String token, AccountToken.Type type);
    void deleteByUserIdAndType(UUID userId, AccountToken.Type type);
}
