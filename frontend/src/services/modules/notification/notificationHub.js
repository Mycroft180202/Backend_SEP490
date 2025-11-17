import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const HUB_URL = `${process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '')}/hubs/notifications`;

let connection = null;
let startPromise = null;

const buildConnection = () => new HubConnectionBuilder()
  .withUrl(HUB_URL, {
    accessTokenFactory: () => localStorage.getItem('accessToken') || '',
  })
  .withAutomaticReconnect()
  .configureLogging(LogLevel.Error)
  .build();

const startConnection = async () => {
  if (!connection) {
    connection = buildConnection();
  }
  if (connection.state === 'Connected') return connection;
  if (!startPromise) {
    startPromise = connection
      .start()
      .catch((err) => {
        console.error('SignalR start error:', err);
        startPromise = null;
        throw err;
      })
      .then(() => {
        startPromise = null;
        return connection;
      });
  }
  return startPromise;
};

export const NotificationHub = {
  async ensureConnected() {
    return startConnection();
  },

  on(event, handler) {
    if (!connection) connection = buildConnection();
    connection.on(event, handler);
    return () => connection.off(event, handler);
  },

  off(event, handler) {
    if (connection) connection.off(event, handler);
  },

  async stop() {
    if (connection) {
      try {
        await connection.stop();
      } catch (err) {
        console.error('SignalR stop error:', err);
      }
      connection = null;
      startPromise = null;
    }
  },

  getConnection() {
    if (!connection) connection = buildConnection();
    return connection;
  },
};
