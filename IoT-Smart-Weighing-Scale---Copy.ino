#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// Firebase credentials
#define API_KEY "YOUR_FIREBASE_API_KEY"
#define FIREBASE_PROJECT_ID "scaleup-a4b46"
#define USER_EMAIL "YOUR_EMAIL"
#define USER_PASSWORD "YOUR_PASSWORD"

// Backend server URL
const char* backend_url = "http://your-backend-server.com/api/storedata";

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

const char* AP_SSID = "ESP32-Health-Setup";
IPAddress local_ip(192,168,4,1), gateway(192,168,4,1), subnet(255,255,255,0);

WebServer server(80);

// Wi-Fi & User Credentials
String wifi_ssid = "", wifi_password = "";
String user_uid = "", user_email = "";
String connection_status = "idle";
bool wifi_credentials_received = false;

// Function to initialize Firebase
void initFirebase() {
  config.api_key = API_KEY;
  config.database_url = "https://" + String(FIREBASE_PROJECT_ID) + ".firebaseio.com";
  
  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

// Function to send dummy data to Firestore
void sendDummyDataToFirestore() {
  if (!Firebase.ready() || user_uid == "") {
    Serial.println("Firebase not ready or no user UID");
    return;
  }

  FirebaseJson content;
  content.set("fields/heart_rate/integerValue", "75");
  content.set("fields/spo2/integerValue", "98");
  content.set("fields/temperature/doubleValue", 36.5);
  content.set("fields/weight/doubleValue", 70.0);
  content.set("fields/timestamp/timestampValue", Firebase.getCurrentTimestamp());

  String documentPath = "users/" + user_uid + "/records/" + String(millis());

  if (Firebase.Firestore.createDocument(&fbdo, FIREBASE_PROJECT_ID, "", documentPath.c_str(), content.raw())) {
    Serial.println("Data sent to Firestore successfully");
    Serial.println("Document path: " + documentPath);
  } else {
    Serial.println("Failed to send data to Firestore");
    Serial.println("Error: " + fbdo.errorReason());
  }
}

void setCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleOptions() { 
  setCors(); 
  server.send(200, "text/plain", ""); 
}

void handleRoot() {
  setCors();
  server.send(200, "text/html",
    "<html><body><h1>ESP32 Wi-Fi Setup</h1><p>Use the app to configure Wi-Fi settings.</p></body></html>");
}

void handleStatus() {
  setCors();
  DynamicJsonDocument doc(512);
  doc["status"] = connection_status;
  if (connection_status == "connected") {
    doc["ip"] = WiFi.localIP().toString();
    doc["ssid"] = wifi_ssid;
    doc["rssi"] = WiFi.RSSI();
    doc["uid"] = user_uid;
    doc["email"] = user_email;
  }
  String res; 
  serializeJson(doc, res);
  server.send(200, "application/json", res);
}

void handleScan() {
  setCors();
  int n = WiFi.scanNetworks();
  DynamicJsonDocument doc(2048);
  JsonArray arr = doc.createNestedArray("networks");
  for (int i = 0; i < n; i++) {
    JsonObject net = arr.createNestedObject();
    net["ssid"] = WiFi.SSID(i);
    net["rssi"] = WiFi.RSSI(i);
    net["encryption"] = WiFi.encryptionType(i) != WIFI_AUTH_OPEN;
  }
  String res; 
  serializeJson(doc, res);
  server.send(200, "application/json", res);
  WiFi.scanDelete();
}

void handleConnect() {
  setCors();
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"No data\"}");
    return;
  }

  DynamicJsonDocument doc(512);
  if (deserializeJson(doc, server.arg("plain"))) {
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Invalid JSON\"}");
    return;
  }

  wifi_ssid = doc["ssid"] | "";
  wifi_password = doc["password"] | "";
  user_uid = doc["uid"] | "";
  user_email = doc["email"] | "";

  // Save to Firestore
  if (Firebase.ready()) {
    FirebaseJson content;
    content.set("fields/ssid/stringValue", wifi_ssid);
    content.set("fields/password/stringValue", wifi_password);
    content.set("fields/uid/stringValue", user_uid);
    content.set("fields/email/stringValue", user_email);
    content.set("fields/timestamp/timestampValue", Firebase.getCurrentTimestamp());

    String documentPath = "devices/" + WiFi.macAddress();
    documentPath.replace(":", "");

    if (Firebase.Firestore.createDocument(&fbdo, FIREBASE_PROJECT_ID, "", documentPath.c_str(), content.raw())) {
      Serial.println("Credentials saved to Firestore");
    } else {
      Serial.println("Failed to save to Firestore: " + fbdo.errorReason());
    }
  }

  Serial.println("Received SSID: " + wifi_ssid);
  Serial.println("Received UID: " + user_uid);
  Serial.println("Received Email: " + user_email);

  wifi_credentials_received = true;
  connection_status = "connecting";

  DynamicJsonDocument res_doc(128);
  res_doc["status"] = "connecting";
  res_doc["message"] = "Connecting...";
  String res; 
  serializeJson(res_doc, res);
  server.send(200, "application/json", res);
}

void sendDummyDataToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi not connected, cannot send data.");
    return;
  }

  HTTPClient http;
  http.begin(backend_url);
  http.addHeader("Content-Type", "application/json");

  // Create dummy health data
  DynamicJsonDocument dummyData(256);
  dummyData["heartRate"] = random(60, 100);
  dummyData["steps"] = random(1000, 10000);
  dummyData["temperature"] = random(360, 380) / 10.0;
  dummyData["weight"] = random(500, 1000) / 10.0;

  // Create final payload with user email
  DynamicJsonDocument payload(512);
  payload["email"] = user_email;
  payload["data"] = dummyData;

  String jsonString;
  serializeJson(payload, jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Backend response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error sending POST: " + String(httpResponseCode));
  }

  http.end();
}

void connectToWifi() {
  if (!wifi_credentials_received) return;

  WiFi.disconnect();
  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());

  for (int i = 0; i < 20 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    server.handleClient();
  }

  if (WiFi.status() == WL_CONNECTED) {
    connection_status = "connected";
    Serial.println("Wi-Fi Connected!");
    Serial.println("IP Address: " + WiFi.localIP().toString());
    
    // Initialize Firebase after WiFi connection
    initFirebase();
    
    // Send dummy data to Firestore
    delay(2000); // Wait for Firebase to initialize
    sendDummyDataToFirestore();
  } else {
    connection_status = "failed";
    wifi_credentials_received = false;
    Serial.println("Wi-Fi Connection Failed");
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(local_ip, gateway, subnet);
  WiFi.softAP(AP_SSID);
  
  Serial.println("AP Mode Started. IP: " + WiFi.softAPIP().toString());

  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/scan", HTTP_GET, handleScan);
  server.on("/connect", HTTP_POST, handleConnect);

  // CORS preflight support
  server.on("/status", HTTP_OPTIONS, handleOptions);
  server.on("/scan", HTTP_OPTIONS, handleOptions);
  server.on("/connect", HTTP_OPTIONS, handleOptions);

  server.begin();
}

void loop() {
  server.handleClient();
  if (wifi_credentials_received && connection_status == "connecting") {
    connectToWifi();
  }
} 