export const MAP_EMPTY_RENDER_FRAME_LIMIT=90;

export function evaluateMapRenderHealth({width,height,drawCalls,zeroDrawFrames,contextLost=false}={}){
 if(contextLost)return{healthy:false,reason:'WebGL-контекст потерян'};
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)return{healthy:false,reason:'Холст карты имеет нулевой размер'};
 if(!Number.isFinite(drawCalls)||drawCalls<0)return{healthy:false,reason:'Некорректное число вызовов рендеринга'};
 if(drawCalls===0&&zeroDrawFrames>=MAP_EMPTY_RENDER_FRAME_LIMIT)return{healthy:false,reason:'3D-сцена не отрисовывает объекты в течение 90 кадров'};
 return{healthy:true,reason:''};
}

export function formatMapRenderFailure(reason=''){
 const message=String(reason??'').replace(/\\s+/g,' ').trim();
 if(!message)return'Неизвестная ошибка';
 return message.length>120?message.slice(0,117)+'…':message;
}
