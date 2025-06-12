// src/main/java/com/flamewall/bridge/MessageCommand.java

package com.flamewall.bridge;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;
import org.json.JSONObject;

import java.util.Arrays;

public class MessageCommand implements CommandExecutor {

    private final BridgePlugin plugin;

    public MessageCommand(BridgePlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage("This command can only be run by a player.");
            return true;
        }

        if (args.length < 2) {
            sender.sendMessage(ChatColor.RED + "Usage: /m <player> <message>");
            return false;
        }

        Player senderPlayer = (Player) sender;
        String recipientName = args[0];
        String message = String.join(" ", Arrays.copyOfRange(args, 1, args.length));

        // Отправляем на бэкенд для сохранения в БД и пересылки на сайт
        try {
            JSONObject payload = new JSONObject();
            payload.put("senderUuid", senderPlayer.getUniqueId().toString());
            payload.put("recipientUsername", recipientName);
            payload.put("content", message);
            plugin.sendJsonPayload("inGamePrivateMessage", payload);

            // Отправляем подтверждение отправителю
            senderPlayer.sendMessage(ChatColor.GRAY + "To " + recipientName + ": " + message);

        } catch (Exception e) {
            senderPlayer.sendMessage(ChatColor.RED + "An error occurred while sending the message.");
            e.printStackTrace();
        }

        return true;
    }
}