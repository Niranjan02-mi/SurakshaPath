#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <SoftwareSerial.h>
#include <TinyGPS++.h>

// --- HARDWARE WIRING ---
// GPS TX pin to ESP8266 D1 (GPIO 5)
// GPS RX pin to ESP8266 D2 (GPIO 4)
#define GPS_TX_PIN 5
#define GPS_RX_PIN 4

// SOS Button to D3 (GPIO 0) (Pulled HIGH internally, connects to GND when pressed)
#define SOS_PIN 0

SoftwareSerial gpsSerial(GPS_TX_PIN, GPS_RX_PIN);
TinyGPSPlus gps;

// --- CONFIGURATION ---
const char* WIFI_SSID = "VivoT2";
const char* WIFI_PASS = "12345678";

// REPLACE THIS WITH YOUR EXACT TOURIST ID (Generated from your website)
String MY_TOURIST_ID = "SP-2026-DEMO";

// Replace with your laptop's Local IP Address where the Node.js server is running
const char* BACKEND_URL = "http://10.23.50.230:5000/api/tracking/ping";

unsigned long lastTransmitTime = 0;
const int transmitInterval = 10000; // Send data every 10 seconds

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600);
  pinMode(SOS_PIN, INPUT_PULLUP);
  
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
  Serial.println("Single Node Ready. Waiting for GPS fix...");
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

void loop() {
  // 1. Constantly read GPS data
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // 2. Transmit every 10 seconds
  if (millis() - lastTransmitTime > transmitInterval) {
    lastTransmitTime = millis();

    // Read SOS Button (LOW means pressed)
    bool isSosPressed = (digitalRead(SOS_PIN) == LOW);
    
    float currentLat = 19.5393; // Fallback dummy location (Arthur Lake)
    float currentLng = 73.7749;

    // Read GPS
    if (gps.location.isValid()) {
      currentLat = gps.location.lat();
      currentLng = gps.location.lng();
      Serial.print("GPS Fix: "); Serial.print(currentLat, 6); Serial.print(", "); Serial.println(currentLng, 6);
    } else {
      Serial.println("Waiting for GPS satellite fix... (using fallback dummy data)");
    }

    // Send directly to backend over WiFi
    Serial.println("Sending data to backend...");
    sendToBackend(MY_TOURIST_ID, currentLat, currentLng, isSosPressed);
  }
}
