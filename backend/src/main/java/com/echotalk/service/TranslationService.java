package com.echotalk.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class TranslationService {
    private final RestClient restClient;
    private final String endpoint;

    public TranslationService(RestClient.Builder builder,
                              @Value("${app.translation.url:}") String endpoint) {
        this.restClient = builder.build();
        this.endpoint = endpoint;
    }

    public String translate(String text, String targetLanguage) {
        if (endpoint.isBlank() || targetLanguage == null || targetLanguage.equalsIgnoreCase("original")) {
            return text;
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post().uri(endpoint)
                    .body(Map.of("q", text, "source", "auto", "target", targetLanguage, "format", "text"))
                    .retrieve().body(Map.class);
            return response != null && response.get("translatedText") != null
                    ? response.get("translatedText").toString()
                    : text;
        } catch (Exception ignored) {
            return text;
        }
    }
}
