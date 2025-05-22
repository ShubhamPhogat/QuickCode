const { WebSocketServer } = require("ws");

export class webSocketManager {
  constructor() {
    if (webSocketManager.instance) {
      return webSocketManager.instance;
    }
    this.wss = new WebSocketServer({ port: 8080 });
  }

  async getInstance() {
    if (webSocketManager.instance) {
      return webSocketManager.instance;
    }
    webSocketManager.instance = new webSocketManager();
    return webSocketManager.instance;
  }
}
