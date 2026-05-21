package com.echotalk.config;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.Transport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SocketIOConfig {

    @Value("${app.socketio.host}")
    private String host;

    @Value("${app.socketio.port}")
    private int port;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setOrigin(String.join(",", allowedOrigins.split(",")));
        config.setTransports(Transport.WEBSOCKET, Transport.POLLING);
        config.setPingTimeout(60000);
        config.setPingInterval(25000);
        config.setMaxFramePayloadLength(1048576);
        config.setMaxHttpContentLength(1048576);
        return new SocketIOServer(config);
    }
}
