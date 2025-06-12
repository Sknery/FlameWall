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
    // --- ДОБАВЛЕНО: Прямой доступ к логгеру для удобства ---
    private final Logger logger;

    public PlayerConnectionListener(BridgePlugin plugin) {
        this.plugin = plugin;
        this.logger = plugin.getLogger(); // --- ДОБАВЛЕНО ---

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

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onPlayerCommand(PlayerCommandPreprocessEvent event) {
        Player sender = event.getPlayer();
        String fullCommand = event.getMessage().substring(1);
        String commandLabel = fullCommand.split(" ")[0].toLowerCase();

        List<Map<?, ?>> rules = plugin.getInterceptRules();
        if (rules == null) return;

        for (Map<?, ?> rule : rules) {
            List<String> aliases = (List<String>) rule.get("command-aliases");
            if (aliases == null || !aliases.contains(commandLabel)) {
                continue;
            }

            String type = (String) rule.get("type");
            String regex = (String) rule.get("pattern");
            if (regex == null) continue;

            Pattern pattern = Pattern.compile(regex);
            Matcher matcher = pattern.matcher(fullCommand);

            if (matcher.matches()) {
                String message = getMatcherGroup(matcher, "message");
                if (message == null) continue;

                String recipientName = null;
                Player recipientPlayerForReply = null; // Нужен для обновления /r

                if ("direct".equals(type)) {
                    recipientName = getMatcherGroup(matcher, "recipient");
                    // --- ИЗМЕНЕНИЕ: Мы больше не ищем игрока онлайн здесь, просто берем имя ---
                    recipientPlayerForReply = Bukkit.getPlayer(recipientName);
                } else if ("reply".equals(type)) {
                    UUID recipientUuid = plugin.getMessageManager().getReplyTarget(sender);
                    if (recipientUuid != null) {
                        recipientPlayerForReply = Bukkit.getPlayer(recipientUuid);
                        if (recipientPlayerForReply != null) {
                            recipientName = recipientPlayerForReply.getName();
                        }
                    }
                }

                // --- ИЗМЕНЕНИЕ: Отправляем на бэкенд, даже если имя получателя не найдено онлайн ---
                if (recipientName != null) {
                    // Если получатель онлайн, обновляем "память" для /r
                    if(recipientPlayerForReply != null && recipientPlayerForReply.isOnline()) {
                        plugin.getMessageManager().setLastPartner(sender, recipientPlayerForReply);
                    }
                    sendMessageToBackend(sender, recipientName, message, commandLabel);
                }

                break;
            }
        }
    }

    // --- ИЗМЕНЕНИЕ: Метод теперь принимает имя получателя (String), а не объект Player ---
    private void sendMessageToBackend(Player sender, String recipientName, String content, String commandLabel) {
        logger.info("Intercepted PM (" + commandLabel + ") from " + sender.getName() + " to " + recipientName);
        try {
            JSONObject payload = new JSONObject();
            payload.put("senderUuid", sender.getUniqueId().toString());
            payload.put("recipientUsername", recipientName); // Используем имя как строку
            payload.put("content", content);
            plugin.sendJsonPayload("inGamePrivateMessage", payload);
        } catch (Exception e) {
            logger.severe("Could not send intercepted PM to backend.");
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