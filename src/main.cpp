#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <MAX3010x.h>
#include <Adafruit_MLX90614.h>
#include "HX711.h"
#include "filters.h"
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <WebServer.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// --- LCD Setup ---
LiquidCrystal_I2C lcd(0x27, 20, 4);

// --- MAX30102 Setup ---
MAX30105 sensor;
const auto kSamplingRate = sensor.SAMPLING_RATE_400SPS;
const float kSamplingFrequency = 400.0;
const unsigned long kFingerThreshold = 4000;
const unsigned int kFingerCooldownMs = 500;
const float kEdgeThreshold = -1000.0;
const bool kEnableAveraging = true;
const int kAveragingSamples = 10;
const int kSampleThreshold = 5;
const int kMinHeartbeatIntervalMs = 400;

LowPassFilter low_pass_filter_red(3.0, kSamplingFrequency);
LowPassFilter low_pass_filter_ir(3.0, kSamplingFrequency);
HighPassFilter high_pass_filter(0.3, kSamplingFrequency);
Differentiator differentiator(kSamplingFrequency);
MovingAverageFilter<kAveragingSamples> averager_bpm;
MovingAverageFilter<kAveragingSamples> averager_r;
MovingAverageFilter<kAveragingSamples> averager_spo2;
MinMaxAvgStatistic stat_red;
MinMaxAvgStatistic stat_ir;

long last_heartbeat = 0;
long finger_timestamp = 0;
bool finger_detected = false;
float last_diff = NAN;
bool crossed = false;
long crossed_time = 0;

int avg_bpm = 0;
float avg_spo2 = 0;
bool standby_shown = false;

// --- MLX90614 ---
Adafruit_MLX90614 mlx = Adafruit_MLX90614();
const float TEMP_OFFSET = 3.6;

// --- HX711 ---
#define DOUT  4
#define CLK   5
HX711 scale;
float calibration_factor = 20210.82;

// --- Firebase + Wi-Fi ---
#define WIFI_SSID "liyalliya"
#define WIFI_PASSWORD "liyadette"
#define API_KEY "AIzaSyD7VT-SIfm4VIr3f-nxq81Shq_-MqW45WY"
#define PROJECT_ID "scaleup-a4b46"

// Static IP configuration
IPAddress staticIP(192, 168, 139, 68);
IPAddress gateway(192, 168, 139, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(8, 8, 8, 8);

// Connection retry settings
#define WIFI_RETRY_DELAY 500
#define WIFI_MAX_RETRIES 20
#define FIREBASE_RETRY_DELAY 100
#define FIREBASE_MAX_RETRIES 50

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
WebServer server(80);
String userEmail = "";
String userPassword = "";

// --- Trigger & Timing ---
volatile bool triggerRecording = false;
unsigned long recordStartTime = 0;
const unsigned long recordDuration = 10000;

// --- Display Timer ---
unsigned long lastDisplayUpdate = 0;
const unsigned long DISPLAY_UPDATE_INTERVAL = 500;

// --- Setup Functions ---
void connectToWiFi() {
  int retries = 0;
  Serial.print("Connecting to Wi-Fi");
  
  // Configure static IP
  WiFi.config(staticIP, gateway, subnet, dns);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  while (WiFi.status() != WL_CONNECTED && retries < WIFI_MAX_RETRIES) {
    Serial.print(".");
    delay(WIFI_RETRY_DELAY);
    retries++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Wi-Fi connected");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Wi-Fi connection failed");
    Serial.println("Please check your WiFi credentials and try again");
  }
}

void handleSetCredentials() {
  if (server.hasArg("email") && server.hasArg("password")) {
    userEmail = server.arg("email");
    userPassword = server.arg("password");

    Serial.println("✅ Received credentials:");
    Serial.print("Email: ");
    Serial.println(userEmail);
    Serial.print("Password: ");
    Serial.println(userPassword);

    server.send(200, "text/plain", "✅ Credentials set. Initializing Firebase...");
    initFirebase();
  } else {
    server.send(400, "text/plain", "❌ Missing email or password");
  }
}

void handleRoot() {
  server.send(200, "text/plain", "ESP32 Web Server Running");
}

void handleTriggerRecording() {
  Serial.println("📥 Received trigger request");
  
  if (!triggerRecording) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("❌ Cannot start recording: WiFi not connected");
      server.send(503, "text/plain", "❌ WiFi not connected");
      return;
    }
    
    if (!Firebase.ready()) {
      Serial.println("❌ Cannot start recording: Firebase not ready");
      server.send(503, "text/plain", "❌ Firebase not ready");
      return;
    }
    
    if (userEmail == "" || userPassword == "") {
      Serial.println("❌ Cannot start recording: User credentials not set");
      server.send(401, "text/plain", "❌ User credentials not set");
      return;
    }
    
    triggerRecording = true;
    recordStartTime = millis();
    Serial.println("▶️ Recording triggered for 10 seconds");
    server.send(200, "text/plain", "✅ Recording started");
  } else {
    Serial.println("❌ Recording already in progress");
    server.send(400, "text/plain", "❌ Recording already in progress");
  }
}

void setupServer() {
  server.on("/", HTTP_GET, handleRoot);
  server.on("/set-credentials", HTTP_POST, handleSetCredentials);
  server.on("/trigger-record", HTTP_POST, handleTriggerRecording);
  server.begin();
}

void initFirebase() {
  config.api_key = API_KEY;
  config.database_url = "https://scaleup-a4b46.firebaseio.com";
  auth.user.email = userEmail.c_str();
  auth.user.password = userPassword.c_str();

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  int retries = 0;
  while (auth.token.uid == "" && retries < FIREBASE_MAX_RETRIES) {
    if (Firebase.ready()) {
      Serial.println("✅ Firebase authenticated.");
      return;
    }
    delay(FIREBASE_RETRY_DELAY);
    retries++;
  }
  
  if (auth.token.uid == "") {
    Serial.println("❌ Firebase authentication failed");
    Serial.println("Please check your credentials and try again");
  }
}

void checkConnections() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
  
  if (!Firebase.ready()) {
    Serial.println("⚠️ Firebase disconnected. Reconnecting...");
    initFirebase();
  }
}

// Send sensor data to Firestore
void sendToFirestore(float weight, int heartRate, float spo2, float tempC,
                     float fsr1, float fsr2, float fsr3, float fsr4) {
  String userId = String(auth.token.uid.c_str());
  String latestPath = "users/" + userId + "/latestData/latest";

  FirebaseJson content;
  content.set("fields/weight/doubleValue", String(weight));
  content.set("fields/heart_rate/integerValue", String(heartRate));
  content.set("fields/spo2/doubleValue", String(spo2));
  content.set("fields/temperature/doubleValue", String(tempC));
  content.set("fields/fsr1/doubleValue", String(fsr1));
  content.set("fields/fsr2/doubleValue", String(fsr2));
  content.set("fields/fsr3/doubleValue", String(fsr3));
  content.set("fields/fsr4/doubleValue", String(fsr4));

  uint64_t nowMillis = (uint64_t)time(nullptr) * 1000ULL;
  content.set("fields/timestamp/integerValue", String(nowMillis));

  // patch latest data
  if (!Firebase.Firestore.patchDocument(&fbdo,
                                      PROJECT_ID,
                                      "",
                                      latestPath.c_str(),
                                      content.raw(),
                                      "",
                                      "",
                                      "",
                                      "")) {
    if (fbdo.httpCode() == 404) {
      Serial.println("⚠️ latestData does not exist. Creating...");
      if (Firebase.Firestore.createDocument(&fbdo, PROJECT_ID, "", latestPath.c_str(), content.raw())) {
        Serial.println("✅ latestData created");
      } else {
        Serial.print("❌ Failed to create latestData: ");
        Serial.println(fbdo.errorReason());
      }
    } else {
      Serial.print("❌ Failed to patch latestData: ");
      Serial.println(fbdo.errorReason());
    }
  } else {
    Serial.println("✅ latestData patched");
  }

  // create history entry
  String historyPath = "users/" + userId + "/history/" + String(nowMillis);
  if (Firebase.Firestore.createDocument(&fbdo, PROJECT_ID, "", historyPath.c_str(), content.raw())) {
    Serial.println("✅ history entry created");
  } else {
    Serial.print("❌ Failed to create history entry: ");
    Serial.println(fbdo.errorReason());
  }
}

// --- Main Setup ---
void setup() {
  Serial.begin(115200);
  Wire.begin();
  lcd.init();
  lcd.backlight();

  if (sensor.begin() && sensor.setSamplingRate(kSamplingRate)) {
    Serial.println("MAX30102 initialized");
  } else {
    Serial.println("MAX30102 not found");
    while (1);
  }

  if (!mlx.begin()) {
    Serial.println("MLX90614 not found");
    while (1);
  }

  scale.begin(DOUT, CLK);
  scale.set_scale(calibration_factor);
  scale.tare();

  lcd.setCursor(0, 0);
  lcd.print("On standby");
  standby_shown = true;

  connectToWiFi();
  setupServer();
}

// --- Update LCD ---
void updateLCD() {
  float temp = mlx.readObjectTempC() + TEMP_OFFSET;
  float weight = scale.get_units();
  weight = weight < 0 ? 0.0 : weight;

  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("BPM: "); lcd.print(avg_bpm);
  lcd.setCursor(10, 0); lcd.print("SpO2: "); lcd.print(avg_spo2, 1);
  lcd.setCursor(0, 1); lcd.print("Temp: "); lcd.print(temp, 1); lcd.print(" C");
  lcd.setCursor(0, 2); lcd.print("Weight: "); lcd.print(weight, 1); lcd.print(" kg");
}

// --- Main Loop ---
void loop() {
  server.handleClient();

  // Check WiFi and Firebase connection status
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
  
  if (!Firebase.ready()) {
    Serial.println("⚠️ Firebase disconnected. Reconnecting...");
    initFirebase();
  }

  // Debug trigger status
  if (triggerRecording) {
    Serial.print("⏱ Recording in progress. Time elapsed: ");
    Serial.print((millis() - recordStartTime) / 1000);
    Serial.println(" seconds");
  }

  auto sample = sensor.readSample(1000);
  float red = sample.red;
  float ir = sample.ir;

  if (red > kFingerThreshold) {
    if (millis() - finger_timestamp > kFingerCooldownMs) {
      finger_detected = true;
      if (standby_shown) {
        lcd.clear();
        standby_shown = false;
      }
    }
  } else {
    differentiator.reset(); averager_bpm.reset(); averager_r.reset(); averager_spo2.reset();
    low_pass_filter_red.reset(); low_pass_filter_ir.reset(); high_pass_filter.reset();
    stat_red.reset(); stat_ir.reset();

    finger_detected = false;
    finger_timestamp = millis();
    if (!standby_shown) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("On standby");
      standby_shown = true;
    }
  }

  if (finger_detected) {
    red = low_pass_filter_red.process(red);
    ir = low_pass_filter_ir.process(ir);
    stat_red.process(red);
    stat_ir.process(ir);

    float value = high_pass_filter.process(red);
    float diff = differentiator.process(value);

    if (!isnan(diff) && !isnan(last_diff)) {
      if (last_diff > 0 && diff < 0) {
        crossed = true;
        crossed_time = millis();
      }
      if (diff > 0) crossed = false;

      if (crossed && diff < kEdgeThreshold) {
        if (last_heartbeat != 0 && (crossed_time - last_heartbeat > kMinHeartbeatIntervalMs)) {
          int bpm = 60000 / (crossed_time - last_heartbeat);
          float rred = (stat_red.maximum() - stat_red.minimum()) / stat_red.average();
          float rir = (stat_ir.maximum() - stat_ir.minimum()) / stat_ir.average();
          float r = rred / rir;
          float spo2 = -9.29 * r + 101.82;

          if (bpm > 40 && bpm < 250) {
            avg_bpm = kEnableAveraging ? averager_bpm.process(bpm) : bpm;
            avg_spo2 = kEnableAveraging ? averager_spo2.process(spo2) : spo2;
          }
          stat_red.reset(); stat_ir.reset();
        }
        crossed = false;
        last_heartbeat = crossed_time;
      }
    }
    last_diff = diff;
  }

  if (millis() - lastDisplayUpdate >= DISPLAY_UPDATE_INTERVAL && finger_detected) {
    updateLCD();
    lastDisplayUpdate = millis();
  }

  if (userEmail != "" && userPassword != "" && Firebase.ready() && triggerRecording) {
    if (millis() - recordStartTime >= recordDuration) {
      float temp = mlx.readObjectTempC() + TEMP_OFFSET;
      float weight = scale.get_units();
      weight = (weight < 0) ? 0.0 : weight;

      // Generate random FSR values
      float fsr1 = random(0, 100);
      float fsr2 = random(0, 100);
      float fsr3 = random(0, 100);
      float fsr4 = random(0, 100);

      sendToFirestore(weight, avg_bpm, avg_spo2, temp, fsr1, fsr2, fsr3, fsr4);
      triggerRecording = false;
      Serial.println("⏹ Recording stopped and data sent.");
    }
  }
} 