// src/main/java/com/flamewall/bridge/PlayerConnectionListener.java

package com.flamewall.bridge;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerCommandPreprocessEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.json.JSONObject;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PlayerConnectionListener implements Listener {

    private final BridgePlugin plugin;

    public PlayerConnectionListener(BridgePlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        plugin.getLogger().info("Player " + player.getName() + " has joined. Sending status update.");
        sendStatusUpdate(player, true);
    }

    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        plugin.getLogger().info("Player " + player.getName() + " has quit. Sending status update.");
        sendStatusUpdate(player, false);
    }

    private void sendStatusUpdate(Player player, boolean isOnline) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("minecraftUuid", player.getUniqueId().toString());
            payload.put("isOnline", isOnline);
            plugin.sendJsonPayload("minecraftPlayerStatus", payload);
        } catch (Exception e) {
            plugin.getLogger().severe("Could not send player status update for " + player.getName());
            e.printStackTrace();
        }
    }

    // --- ИЗМЕНЕНИЕ: Метод теперь принимает имя получателя (String), а не объект Player ---
    private void sendMessageToBackend(Player sender, String recipientName, String content, String commandLabel) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("senderUuid", sender.getUniqueId().toString());
            payload.put("recipientUsername", recipientName); // Используем имя как строку
            payload.put("content", content);
            plugin.sendJsonPayload("inGamePrivateMessage", payload);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String getMatcherGroup(Matcher matcher, String groupName) {
        try {
            return matcher.group(groupName);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}