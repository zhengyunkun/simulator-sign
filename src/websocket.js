import { WebSocket } from 'ws';
import { handleQRSubscription } from './sign.js';

const endPoint = 'wss://www.teachermate.com.cn/faye'
const ws = {
  client:null,
  seqId:null,
  clientId: null,
  interval:null,
}
export const connectWebSocket = () => {
  if(ws.client) return ;
  ws.client = new WebSocket(endPoint);
  ws.seqId = 0;
  ws.client.on('open',()=>{
    handshake()
  })
  ws.client.on('message', (message) => {
      const messages = JSON.parse(message.toString());
      handleMessage(messages);
  });
  ws.client.on('close', () => {
    console.log('WebSocket 连接已关闭');
    handleDisconnect()
  });

  // 监听错误事件
  ws.client.on('error', (error) => {
    // console.error('WebSocket 错误:', error);
    handleDisconnect()
  });
}

const handleDisconnect = () =>{
   if (ws.client) {
    ws.client = null;
  }
}
const sendMessage = (msg) => {
  const data = JSON.stringify(msg ? [msg] : []);
  // console.log('sendMessage', data);
  ws.client?.send(data);
};

const handshake = () =>{
  sendMessage({
      channel: '/meta/handshake',
      version: '1.0',
      supportedConnectionTypes: [
        'websocket',
        'eventsource',
        'long-polling',
        'cross-origin-long-polling',
        'callback-polling',
      ],
      id: ws.seqId++,
  });
}

const connect = () => {
    sendMessage({
      channel: '/meta/connect',
      clientId: ws.clientId,
      connectionType: 'websocket',
      id: ws.seqId++,
    });
  };

const startHeartbeat = (timeout) => {
  connect();
  ws.interval = setInterval(() => {
    connect();
  }, timeout);
};

export const subscribe = (courseId,signId) => {
    sendMessage({
      channel: '/meta/subscribe',
      clientId: ws.clientId,
      subscription: `/attendance/${courseId}/${signId}/qr`,
      id: ws.seqId++,
    });
}

const handleMessage = (messages)=>{
  // console.log('handleMessage', messages);
  if (Array.isArray(messages) && messages.length === 0) return ;
  const message = messages[0];
  const { channel, successful } = message;
  if(successful){
    switch (channel) {
      // 握手的意义在于获取客户端号
      case '/meta/handshake':
        const {
          clientId,advice: { timeout },
        } = message;
        ws.clientId = clientId;
        // 连接的意义在于保持于服务端的连接
        // 因此，服务端建议每隔15s就向服务端发送信息
        startHeartbeat(timeout);
        break;
      default:
        break;
    } 
  }else if (testQRSubscription(message)) {
      handleQRSubscription(message);
  } else {
    console.log(`${channel}: Failed!`);
    handleDisconnect()
  }
}

const testQRSubscription = (message) =>
    /attendance\/\d+\/\d+\/qr/.test(message.channel);