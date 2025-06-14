package com.flamewall.bridge;

import io.socket.client.IO;
import io.socket.client.Socket;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.json.JSONException;
import org.json.JSONObject;

import java.net.URI;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import net.md_5.bungee.api.chat.ClickEvent;
import net.md_5.bungee.api.chat.HoverEvent;
import net.md_5.bungee.api.chat.TextComponent;
import net.md_5.bungee.api.chat.hover.content.Text;

public final class BridgePlugin extends JavaPlugin {

    private Socket socket;
    private PrivateMessageManager messageManager;
    // Теперь храним полный список правил
    private List<Map<?, ?>> interceptRules;
    private ApiClient apiClient; // <-- ДОБАВЛЕНО

    @Override
    public void onEnable() {
        getLogger().info("FlameWallBridge is enabling...");
        this.saveDefaultConfig();
        this.reloadConfig();

        this.messageManager = new PrivateMessageManager();
        this.apiClient = new ApiClient(this); // <-- ДОБАВЛЕНО

        // --- РЕГИСТРИРУЕМ НАШ НОВЫЙ ЕДИНЫЙ ОБРАБОТЧИК ---
        FlameCommand flameCommand = new FlameCommand(this);
        getCommand("flame").setExecutor(flameCommand);
        getCommand("flame").setTabCompleter(flameCommand); // Регистрируем автодополнение

        // Регистрируем остальные команды и слушатели
        getCommand("link").setExecutor(new LinkCommand(this));
        // ... (если есть fwb_syncfriends, он остается здесь) ...

        Bukkit.getPluginManager().registerEvents(new PlayerConnectionListener(this), this);
        connectToWebSocket();
    }

    public ApiClient getApiClient() { return apiClient; } // <-- ДОБАВЛЕНО
    public PrivateMessageManager getMessageManager() { return messageManager; }
    public List<Map<?, ?>> getInterceptRules() { return interceptRules; }

    @Override
    public void onDisable() {
        if (socket != null) {
            socket.disconnect();
        }
        getLogger().info("FlameWallBridge has been disabled.");
    }

    public void sendJsonPayload(String eventName, JSONObject payload) {
        if (socket != null && socket.connected()) {
            socket.emit(eventName, payload);
        } else {
            getLogger().warning("WebSocket is not connected. Cannot send data.");
        }
    }

    private void connectToWebSocket() {
        try {
            URI serverUri = URI.create("http://localhost:3000");

            // --- ИСПРАВЛЕНИЕ: Создаем заголовки правильного типа Map<String, List<String>> ---
            Map<String, List<String>> headers = new HashMap<>();
            headers.put("x-api-key", Collections.singletonList("your_super_secret_and_long_string_12345"));

            IO.Options options = IO.Options.builder()
                    .setExtraHeaders(headers)
                    .build();

            socket = IO.socket(serverUri, options);

            socket.on(Socket.EVENT_CONNECT, args -> {
                getLogger().info("Successfully connected to the website backend!");
            });

            socket.on(Socket.EVENT_DISCONNECT, args -> {
                String reason = args.length > 0 ? args[0].toString() : "No reason given";
                getLogger().warning("Disconnected from website backend. Reason: " + reason);
            });

            socket.on(Socket.EVENT_CONNECT_ERROR, args -> {
                String error = args.length > 0 ? args[0].toString() : "Unknown error";
                getLogger().severe("Connection error: " + error);
            });

            socket.on("linkStatus", args -> {
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    handleBackendMessage((JSONObject) args[0]);
                }
            });

            socket.on("webPrivateMessage", args -> {
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    handleWebMessage((JSONObject) args[0]);
                }
            });

            socket.connect();

            socket.connect();
            getLogger().info("Attempting to connect to website backend...");

        } catch (Exception e) {
            getLogger().severe("Failed to initialize WebSocket connection!");
            e.printStackTrace();
        }
    }

    private void handleWebMessage(JSONObject data) {
        Bukkit.getScheduler().runTask(this, () -> {
            // Проверяем настройку в конфиге перед отправкой сообщения
            if (!getConfig().getBoolean("display-web-messages-in-game", true)) {
                return;
            }

            try {
                String recipientUuid = data.getString("recipientUuid");
                String senderUsername = data.getString("senderUsername");
                String content = data.getString("content");

                Player recipientPlayer = Bukkit.getPlayer(UUID.fromString(recipientUuid));
                if (recipientPlayer != null && recipientPlayer.isOnline()) {

                    // --- НАЧАЛО НОВОЙ ЛОГИКИ ---

                    // 1. Создаем основной текст сообщения
                    TextComponent messageComponent = new TextComponent(
                            ChatColor.GRAY + "[WEB] " + senderUsername + " » " + content
                    );

                    // 2. Создаем действие при клике: подставить команду в чат
                    messageComponent.setClickEvent(new ClickEvent(
                            ClickEvent.Action.SUGGEST_COMMAND,
                            "/flame msg " + senderUsername + " " // Используем /flame msg
                    ));

                    // 3. Создаем подсказку при наведении
                    messageComponent.setHoverEvent(new HoverEvent(
                            HoverEvent.Action.SHOW_TEXT,
                            new Text(ChatColor.AQUA + "Нажмите, чтобы ответить игроку " + senderUsername)
                    ));

                    // 4. Отправляем интерактивное сообщение игроку
                    recipientPlayer.spigot().sendMessage(messageComponent);

                    // --- КОНЕЦ НОВОЙ ЛОГИКИ ---
                }
            } catch (Exception e) {
                getLogger().warning("Could not parse webPrivateMessage from backend: " + data.toString());
            }
        });
    }

    private void handleBackendMessage(JSONObject data) {
        Bukkit.getScheduler().runTask(this, () -> {
            try {
                boolean success = data.getBoolean("success");
                String minecraftUuid = data.getString("minecraftUuid");

                Player player = Bukkit.getPlayer(UUID.fromString(minecraftUuid));
                if (player != null && player.isOnline()) {
                    if (success) {
                        String websiteUsername = data.getString("websiteUsername");
                        player.sendMessage(ChatColor.GREEN + "Success! Your account is now linked to the website profile: " + websiteUsername);
                    } else {
                        String error = data.getString("error");
                        player.sendMessage(ChatColor.RED + "Linking failed: " + error);
                    }
                }
            } catch (JSONException e) {
                getLogger().warning("Could not parse linkStatus message from backend: " + data.toString());
            }
        });
    }
}