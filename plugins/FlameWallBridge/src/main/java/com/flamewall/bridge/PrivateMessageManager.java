package com.flamewall.bridge;

import org.bukkit.entity.Player;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class PrivateMessageManager {
    // Хранит пару "ключ-значение", где:
    // Ключ - UUID игрока, который получил сообщение
    // Значение - UUID игрока, который отправил это сообщение
    private final Map<UUID, UUID> lastMessagePartners = new HashMap<>();

    public void setLastPartner(Player player1, Player player2) {
        lastMessagePartners.put(player1.getUniqueId(), player2.getUniqueId());
        lastMessagePartners.put(player2.getUniqueId(), player1.getUniqueId());
    }

    public UUID getReplyTarget(Player sender) {
        return lastMessagePartners.get(sender.getUniqueId());
    }
}