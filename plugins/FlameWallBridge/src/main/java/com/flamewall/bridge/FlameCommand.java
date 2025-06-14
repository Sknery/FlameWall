package com.flamewall.bridge;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class FlameCommand implements CommandExecutor, TabCompleter {

    private final BridgePlugin plugin;

    public FlameCommand(BridgePlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage("This command can only be used by a player.");
            return true;
        }
        Player player = (Player) sender;

        if (args.length == 0) {
            sendHelpMessage(player);
            return true;
        }

        String subCommand = args[0].toLowerCase();
        String[] subArgs = Arrays.copyOfRange(args, 1, args.length);

        switch (subCommand) {
            case "msg":
                handleMessageCommand(player, subArgs);
                break;
            case "r":
            case "reply":
                handleReplyCommand(player, subArgs);
                break;
            case "friend":
                handleFriendCommand(player, subArgs);
                break;
            default:
                sendHelpMessage(player);
                break;
        }
        return true;
    }

    private void handleMessageCommand(Player sender, String[] args) {
        if (args.length < 2) {
            sender.sendMessage(ChatColor.RED + "Usage: /flame msg <player> <message>");
            return;
        }
        String recipientName = args[0];
        String message = String.join(" ", Arrays.copyOfRange(args, 1, args.length));

        if (sender.getName().equalsIgnoreCase(recipientName)) {
            sender.sendMessage(ChatColor.RED + "You cannot send a message to yourself.");
            return;
        }
        sendMessage(sender, recipientName, message);
    }

    private void handleReplyCommand(Player sender, String[] args) {
        if (args.length < 1) {
            sender.sendMessage(ChatColor.RED + "Usage: /flame reply <message>");
            return;
        }
        UUID recipientUuid = plugin.getMessageManager().getReplyTarget(sender);
        if (recipientUuid == null) {
            sender.sendMessage(ChatColor.RED + "There is no one to reply to.");
            return;
        }
        Player recipientPlayer = Bukkit.getPlayer(recipientUuid);
        if (recipientPlayer == null || !recipientPlayer.isOnline()) {
            sender.sendMessage(ChatColor.RED + "The player you are replying to has gone offline.");
            return;
        }
        String message = String.join(" ", args);
        sendMessage(sender, recipientPlayer.getName(), message);
    }

    private void handleFriendCommand(Player player, String[] args) {
        if (args.length == 0) {
            player.sendMessage(ChatColor.RED + "Usage: /flame friend <add|remove|list>");
            return;
        }
        String action = args[0].toLowerCase();
        String[] actionArgs = Arrays.copyOfRange(args, 1, args.length);

        switch(action) {
            case "add":
                if (actionArgs.length < 1) {
                    player.sendMessage(ChatColor.RED + "Usage: /flame friend add <player>");
                    return;
                }
                String targetName = actionArgs[0];
                if (player.getName().equalsIgnoreCase(targetName)) {
                    player.sendMessage(ChatColor.RED + "You cannot add yourself as a friend.");
                    return;
                }
                plugin.getApiClient().sendFriendRequest(player, targetName);
                break;

            case "remove":
                if (actionArgs.length < 1) {
                    player.sendMessage(ChatColor.RED + "Usage: /flame friend remove <player>");
                    return;
                }
                plugin.getApiClient().removeFriend(player, actionArgs[0]);
                break;

            case "list":
                plugin.getApiClient().getFriendsList(player);
                break;

            // TODO: В будущем добавить accept, deny
            default:
                player.sendMessage(ChatColor.RED + "Unknown friend command. Use: add, remove, list.");
                break;
        }
    }

    private void sendMessage(Player sender, String recipientName, String content) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("senderUuid", sender.getUniqueId().toString());
            payload.put("recipientUsername", recipientName);
            payload.put("content", content);
            plugin.sendJsonPayload("inGamePrivateMessage", payload);
            sender.sendMessage(ChatColor.GRAY + "To " + recipientName + ": " + ChatColor.WHITE + content);

            Player recipientPlayer = Bukkit.getPlayer(recipientName);
            if (recipientPlayer != null) {
                plugin.getMessageManager().setLastPartner(sender, recipientPlayer);
            }
        } catch (Exception e) {
            sender.sendMessage(ChatColor.RED + "An error occurred while sending the message.");
            plugin.getLogger().severe("Could not send PM to backend for " + sender.getName());
            e.printStackTrace();
        }
    }

    private void sendHelpMessage(Player player) {
        player.sendMessage(ChatColor.GOLD + "--- FlameWall Bridge Help ---");
        player.sendMessage(ChatColor.AQUA + "/flame msg <player> <message>" + ChatColor.WHITE + " - Send a private message");
        player.sendMessage(ChatColor.AQUA + "/flame reply <message>" + ChatColor.WHITE + " - Reply to the last message");
        player.sendMessage(ChatColor.AQUA + "/flame friend <add|remove|list>" + ChatColor.WHITE + " - Manage your friends");
    }

    @Override
    public @Nullable List<String> onTabComplete(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (args.length == 1) {
            return List.of("msg", "reply", "friend").stream()
                    .filter(s -> s.startsWith(args[0].toLowerCase()))
                    .collect(Collectors.toList());
        }
        if (args.length == 2) {
            String subCommand = args[0].toLowerCase();
            if (subCommand.equals("msg")) {
                return null; // Автодополнение ников игроков
            }
            if (subCommand.equals("friend")) {
                return List.of("add", "remove", "list").stream()
                        .filter(s -> s.startsWith(args[1].toLowerCase()))
                        .collect(Collectors.toList());
            }
        }
        if (args.length == 3 && args[0].equalsIgnoreCase("friend") &&
                (args[1].equalsIgnoreCase("add") || args[1].equalsIgnoreCase("remove"))) {
            return null; // Автодополнение ников игроков
        }
        return new ArrayList<>();
    }
}