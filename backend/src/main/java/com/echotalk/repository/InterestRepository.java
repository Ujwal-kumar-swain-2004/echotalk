package com.echotalk.repository;

import com.echotalk.entity.Interest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface InterestRepository extends JpaRepository<Interest, UUID> {
    Optional<Interest> findByName(String name);
}
