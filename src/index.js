import { config } from "./config.js";
import { clearStudentName, setStudentName, signOnce } from "./sign.js";
import { getOpenId, sleep } from "./util.js";
import { connectWebSocket } from "./websocket.js";

const main = async () =>{
  let openId = '';
  connectWebSocket()
  while(true) {
    try {
        if(!openId.length){
          openId = await getOpenId();
          console.log('Applied new openId:', openId);
        } 
        connectWebSocket()
        await setStudentName(openId)
        await signOnce(openId);
        await sleep(config.interval);
      } catch (e) {
        console.error(e);
        openId = ''
        clearStudentName()
      }
  }
}

main()
