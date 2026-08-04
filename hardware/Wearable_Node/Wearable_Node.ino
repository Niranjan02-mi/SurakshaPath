#include <ESP8266WiFi.h>
#include <espnow.h>
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
// REPLACE THIS WITH YOUR EXACT TOURIST ID (Generated from your website)
String MY_TOURIST_ID = "SP-2026-DEMO";

// REPLACE WITH THE MAC ADDRESS OF YOUR GATEWAY ESP8266
// You can find this by running a simple WiFi.macAddress() script on the Gateway board
uint8_t gatewayAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

// --- ESP-NOW DATA STRUCTURE ---
typedef struct struct_message {
  char touristId[32];
  float lat;
  float lng;
  bool sosStatus;
} struct_message;

struct_message myData;
unsigned long lastTransmitTime = 0;
const int transmitInterval = 10000; // Send data every 10 seconds

void OnDataSent(uint8_t *mac_addr, uint8_t sendStatus) {
  Serial.print("Last Packet Send Status: ");
  if (sendStatus == 0){
    Serial.println("Delivery Success (Gateway Received It)");
  } else{
    Serial.println("Delivery Fail (Out of Range)");
  }
}

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600);
  pinMode(SOS_PIN, INPUT_PULLUP);
  
  // Set device as a Wi-Fi Station
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(); // Disconnect from any networks, we only use offline ESP-NOW

  // Init ESP-NOW
  if (esp_now_init() != 0) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  esp_now_set_self_role(ESP_NOW_ROLE_CONTROLLER);
  esp_now_register_send_cb(OnDataSent);
  
  // Register peer (The Gateway)
  esp_now_add_peer(gatewayAddress, ESP_NOW_ROLE_SLAVE, 1, NULL, 0);

  // Copy tourist ID to struct
  MY_TOURIST_ID.toCharArray(myData.touristId, 32);
  Serial.println("Wearable Node Ready. Waiting for GPS fix...");
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
    myData.sosStatus = isSosPressed;

    // Read GPS
    if (gps.location.isValid()) {
      myData.lat = gps.location.lat();
      myData.lng = gps.location.lng();
      Serial.print("GPS Fix: "); Serial.print(myData.lat, 6); Serial.print(", "); Serial.println(myData.lng, 6);
    } else {
      Serial.println("Waiting for GPS satellite fix... (ensure you are near a window or outside)");
      // Dummy data for testing if no GPS fix
      myData.lat = 19.5393; // Near Arthur Lake
      myData.lng = 73.7749; 
    }

    // Send via Offline ESP-NOW
    Serial.println("Broadcasting to Gateway via ESP-NOW...");
    esp_now_send(gatewayAddress, (uint8_t *) &myData, sizeof(myData));
  }
}
