#include <ESP8266WiFi.h>
#include <espnow.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// --- CONFIGURATION ---
const char* WIFI_SSID = "YOUR_HOTSPOT_NAME";
const char* WIFI_PASS = "YOUR_HOTSPOT_PASSWORD";

// Replace with your laptop's Local IP Address where the Node.js server is running
const char* BACKEND_URL = "http://192.168.x.x:5000/api/tracking/ping";

// --- ESP-NOW DATA STRUCTURE ---
// MUST match the structure on the Wearable Node
typedef struct struct_message {
  char touristId[32];
  float lat;
  float lng;
  bool sosStatus;
} struct_message;

struct_message incomingData;

// --- CALLBACK FOR RECEIVING ESP-NOW DATA ---
void OnDataRecv(uint8_t * mac, uint8_t *incomingDataRaw, uint8_t len) {
  memcpy(&incomingData, incomingDataRaw, sizeof(incomingData));
  
  Serial.print("Received Data from Tourist: ");
  Serial.println(incomingData.touristId);
  Serial.print("Lat: "); Serial.println(incomingData.lat, 6);
  Serial.print("Lng: "); Serial.println(incomingData.lng, 6);
  Serial.print("SOS: "); Serial.println(incomingData.sosStatus ? "ACTIVE!" : "Normal");

  // Send to Backend
  sendToBackend(incomingData.touristId, incomingData.lat, incomingData.lng, incomingData.sosStatus);
}

void sendToBackend(String id, float lat, float lng, bool sos) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    
    http.begin(client, BACKEND_URL);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"touristId\":\"" + id + "\", \"lat\":\"" + String(lat, 6) + "\", \"lng\":\"" + String(lng, 6) + "\", \"sosStatus\":" + (sos ? "true" : "false") + "}";
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      Serial.print("Backend HTTP Response: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error sending to Backend: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected. Cannot send to backend.");
  }
}

void setup() {
  Serial.begin(115200);
  
  // Set device as a Wi-Fi Station
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP Address: ");
  Serial.println(WiFi.localIP());

  // Init ESP-NOW
  if (esp_now_init() != 0) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  
  // Set ESP-NOW Role
  esp_now_set_self_role(ESP_NOW_ROLE_SLAVE);
  
  // Register receive callback
  esp_now_register_recv_cb(OnDataRecv);
  
  Serial.println("Gateway Ready. Listening for Tourist Wearables...");
}

void loop() {
  // Gateway doesn't need to do anything in the loop, ESP-NOW interrupts handle receiving
  delay(10000);
}
