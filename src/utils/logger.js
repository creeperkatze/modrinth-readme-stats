import { format, createLogger, transports } from "winston";
import path from "path";

const LOG_DIRECTORY = process.env.LOG_DIRECTORY || "./logs";
const isVercel = process.env.VERCEL === '1';

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
);

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
);

const loggerTransports = [
  new transports.Console({ format: consoleFormat })
];

// Only add file transports when not running on Vercel
if (!isVercel) {
  loggerTransports.push(
    new transports.File({
      filename: path.join(LOG_DIRECTORY, "error.log"),
      level: "error",
      maxsize: 5000000000, // 5 GB
      format: fileFormat,
    }),
    new transports.File({
      filename: path.join(LOG_DIRECTORY, "warn.log"),
      level: "warn",
      maxsize: 5000000000, // 5 GB
      format: fileFormat,
    }),
    new transports.File({
      filename: path.join(LOG_DIRECTORY, "info.log"),
      level: "info",
      maxsize: 5000000000, // 5 GB
      format: fileFormat,
    }),
    new transports.File({
      filename: path.join(LOG_DIRECTORY, "main.log"),
      maxsize: 5000000000, // 5 GB
      format: fileFormat
    })
  );
}

const logger = createLogger({
  level: "info",
  format: format.errors({ stack: true }),
  defaultMeta: { service: "superslide-backend" },
  transports: loggerTransports,
});

export default logger;