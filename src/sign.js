import { config, qr } from "./config.js";
import { activeSign, getStudentName, signIn } from "./request.js";
import { extractSignId, sleep } from "./util.js";
import { subscribe } from "./websocket.js";
import qrcode from 'qrcode-terminal';
const signedIdSet = new Set()
let studentName;
const QRType = {
    code:1,
    result:3,
}
export const clearStudentName = ()=>{
    studentName = null
}
export const setStudentName = async (openId) =>{
    if(studentName) return 
    studentName = await getStudentName(openId)
    console.log(studentName)
}
export const handleQRSubscription = async (message) => {
  const { channel,data } = message;
  const signId = extractSignId(channel) 
  if(signedIdSet.has(signId)) return 
  switch (data.type) {
    case QRType.code: {
      const { qrUrl } = data;
      if (!qrUrl) {
        return;
      }
      switch (qr.mode) {
        case 'terminal': 
        case 'plain':
        default:
          console.log(qrUrl);
          qrcode.generate(qrUrl, {small: true}, function (qrcode) {
            console.log(qrcode);
          });
          break;
      }
      break;
    }
    case QRType.result: {
      const { student } = data;
      if (student && student.name === studentName) {
        signedIdSet.add(signId);
      }
      break;
    }
    default:
      break;
  }
  };
export const signOnce = async (openId)=>{
    const data = await activeSign(openId)
    if(!data.length){
        console.warn("No sign-in available")
        return ;
    } 
    const queue = [
    ...data.filter((sign) => !sign.isQR),
    ...data.filter((sign) => sign.isQR),
    ];
    for (const sign of queue) {
        const { signId, courseId, isGPS, isQR, name } = sign;

        if (signedIdSet.has(signId)) {
            console.log('already sign-in:', name);
            return 
        }
        console.log('current sign-in:', name);
        // 二维码签到
        if (isQR) {
            subscribe(courseId,signId);
        } else {
            let signInQuery = { courseId, signId };
            if (isGPS) {
              const { lat, lon } = config;
              signInQuery = { ...signInQuery, lat, lon };
            }
            await sleep(config.wait);
            const signInResp = await signIn(openId, signInQuery)
            console.log(signInResp)
            signedIdSet.add(signId);
         }
    }
}
