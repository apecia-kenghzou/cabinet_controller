import { SerialPort } from "serialport";

// === CRC8 calculation (poly 0x8C, LSB-first) ===
function crc8(buffer) {
  let crc = 0x00;
  for (let byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x01) crc = (crc >> 1) ^ 0x8C;
      else crc >>= 1;
      crc &= 0xFF; // keep it 8-bit
    }
  }
  return crc;
}

// === Build serial command frame ===
function buildSerialFrame(dataBytes) {
  const header1 = 0xAA;
  const header2 = 0x55;
  const dataLength = 0x02;
  const boardAddress = 0x00;
  const instruction = 0x51;

  const frameWithoutCRC = [
    header1,
    header2,
    dataLength,
    boardAddress,
    instruction,
  //  ...dataBytes
  ];

  const crc = crc8(frameWithoutCRC);
  const fullFrame = [...frameWithoutCRC, crc];
  return Buffer.from(fullFrame);
}

// === Create frame ===
const data = [0x00];
const frame = buildSerialFrame(data);
console.log("Frame to send (hex):", frame.toString("hex").match(/.{1,2}/g).join(" "));

// === Open COM3 and send ===
const port = new SerialPort({
  path: "COM3",      // Change to your actual COM port
  baudRate: 9600,    // Adjust to your device
  dataBits: 8,       // 8 data bits
  stopBits: 1,       // 1 stop bit
  parity: "none",    // No parity
});

port.on("open", () => {
  console.log("✅ Serial port opened on COM3 (9600 8N1)");
  port.write(frame, (err) => {
    if (err) {
      return console.error("❌ Error writing to serial port:", err.message);
    }
    console.log("📤 Frame sent successfully!");
  });
});

port.on("error", (err) => {
  console.error("⚠️ Serial port error:", err.message);
});

// Optional: read response
port.on("data", (data) => {
  console.log("📥 Received:", data.toString("hex").match(/.{1,2}/g).join(" "));
});
