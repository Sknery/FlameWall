package com.flamewall.bridge;

import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;
import org.json.JSONException;
import org.json.JSONObject;

public class LinkCommand implements CommandExecutor {

    private final BridgePlugin plugin;

    public LinkCommand(BridgePlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage("This command can only be run by a player.");
            return true;
        }

        if (args.length != 1) {
            sender.sendMessage(ChatColor.RED + "Usage: /link <code>");
            return false;
        }

        Player player = (Player) sender;
        String code = args[0];

        try {
            // --- ИСПРАВЛЕНИЕ: Оборачиваем создание JSON в try-catch ---
            JSONObject payload = new JSONObject();
            payload.put("code", code);
            payload.put("minecraftUuid", player.getUniqueId().toString());
            payload.put("minecraftUsername", player.getName());

            // --- ИСПРАВЛЕНИЕ: Передаем два аргумента, как и требует метод ---
            plugin.sendJsonPayload("linkAccount", payload);

            player.sendMessage(ChatColor.YELLOW + "Sent link request to the website. Please check the website for confirmation.");

        } catch (JSONException e) {
            player.sendMessage(ChatColor.RED + "An internal error occurred while creating the request.");
            e.printStackTrace();
        }

        return true;
    }
}