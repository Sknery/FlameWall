package com.flamewall.bridge;

import okhttp3.*;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

public class ApiClient {

    private final BridgePlugin plugin;
    private final OkHttpClient httpClient;
    private final String baseUrl;
    private final String apiKey;

    public ApiClient(BridgePlugin plugin) {
        this.plugin = plugin;
        this.httpClient = new OkHttpClient();
        this.baseUrl = plugin.getConfig().getString("api-base-url", "http://localhost:3000");
        this.apiKey = plugin.getConfig().getString("plugin-secret-key");
    }

    public void sendFriendRequest(Player sender, String receiverName) {
        try {
            JSONObject jsonBody = new JSONObject();
            jsonBody.put("requesterUuid", sender.getUniqueId().toString());
            jsonBody.put("receiverName", receiverName);
            RequestBody body = RequestBody.create(jsonBody.toString(), MediaType.get("application/json; charset=utf-8"));
            Request request = new Request.Builder()
                    .url(baseUrl + "/api/friendships/from-plugin/add")
                    .header("x-api-key", apiKey)
                    .post(body)
                    .build();
            httpClient.newCall(request).enqueue(new HttpCallback(sender, "Friend request sent to " + receiverName + "!"));
        } catch (JSONException e) {
            handlePluginError(sender, "Could not create JSON body for friend request", e);
        }
    }

    public void removeFriend(Player sender, String friendToRemoveName) {
        try {
            JSONObject jsonBody = new JSONObject();
            jsonBody.put("removerUuid", sender.getUniqueId().toString());
            jsonBody.put("friendToRemoveName", friendToRemoveName);
            RequestBody body = RequestBody.create(jsonBody.toString(), MediaType.get("application/json; charset=utf-8"));
            Request request = new Request.Builder()
                    .url(baseUrl + "/api/friendships/from-plugin/remove")
                    .header("x-api-key", apiKey)
                    .delete(body)
                    .build();
            httpClient.newCall(request).enqueue(new HttpCallback(sender, friendToRemoveName + " has been removed from your friends list."));
        } catch (JSONException e) {
            handlePluginError(sender, "Could not create JSON body for friend removal", e);
        }
    }

    public void getFriendsList(Player sender) {
        Request request = new Request.Builder()
                .url(baseUrl + "/api/friendships/from-plugin/list/" + sender.getUniqueId().toString())
                .header("x-api-key", apiKey)
                .get()
                .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                handleApiFailure(sender, e);
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) {
                if (!response.isSuccessful()) {
                    handleApiError(sender, response);
                    return;
                }
                try (ResponseBody responseBody = response.body()) {
                    String responseString = responseBody.string();
                    JSONArray friendsArray = new JSONArray(responseString);
                    runOnMainThread(() -> {
                        sender.sendMessage(ChatColor.GOLD + "--- Your Friends (" + friendsArray.length() + ") ---");
                        if (friendsArray.length() == 0) {
                            sender.sendMessage(ChatColor.GRAY + "Your friends list is empty. Use /flame friend add <player>");
                        } else {
                            for (int i = 0; i < friendsArray.length(); i++) {
                                // --- ИСПРАВЛЕНИЕ ЗДЕСЬ: Оборачиваем getString в try-catch ---
                                try {
                                    sender.sendMessage(ChatColor.AQUA + "- " + friendsArray.getString(i));
                                } catch (JSONException e) {
                                    plugin.getLogger().warning("Could not get friend name at index " + i + ": " + e.getMessage());
                                }
                            }
                        }
                    });
                } catch (IOException | JSONException e) {
                    plugin.getLogger().severe("Failed to parse friends list JSON from API: " + e.getMessage());
                    runOnMainThread(() -> sender.sendMessage(ChatColor.RED + "Error: Could not read response from the website."));
                } finally {
                    response.close();
                }
            }
        });
    }

    private void runOnMainThread(Runnable task) {
        Bukkit.getScheduler().runTask(plugin, task);
    }

    private void handlePluginError(Player sender, String logMessage, Exception e) {
        plugin.getLogger().severe(logMessage + ": " + e.getMessage());
        runOnMainThread(() -> sender.sendMessage(ChatColor.RED + "An internal plugin error occurred."));
    }

    private void handleApiFailure(Player player, IOException e) {
        plugin.getLogger().severe("Failed to send API request: " + e.getMessage());
        runOnMainThread(() -> player.sendMessage(ChatColor.RED + "Error: Could not connect to the website API."));
    }

    private void handleApiError(Player player, Response response) {
        try (ResponseBody responseBody = response.body()) {
            String errorBody = responseBody.string();
            JSONObject errorJson = new JSONObject(errorBody);
            String message = errorJson.optString("message", "An unknown error occurred (" + response.code() + ")");
            runOnMainThread(() -> player.sendMessage(ChatColor.RED + "Error: " + message));
        } catch (IOException | JSONException e) {
            plugin.getLogger().warning("Could not parse error response from API. Body was not valid JSON or network error occurred.");
            runOnMainThread(() -> player.sendMessage(ChatColor.RED + "An unknown error occurred while processing the server response."));
        } finally {
            if (response != null) response.close();
        }
    }

    private class HttpCallback implements Callback {
        private final Player sender;
        private final String successMessage;

        public HttpCallback(Player sender, String successMessage) {
            this.sender = sender;
            this.successMessage = successMessage;
        }

        @Override
        public void onFailure(@NotNull Call call, @NotNull IOException e) {
            handleApiFailure(sender, e);
        }

        @Override
        public void onResponse(@NotNull Call call, @NotNull Response response) {
            if (response.isSuccessful()) {
                runOnMainThread(() -> sender.sendMessage(ChatColor.GREEN + successMessage));
            } else {
                handleApiError(sender, response);
            }
        }
    }
}