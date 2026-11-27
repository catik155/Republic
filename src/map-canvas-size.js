function positiveDimension(value){
 const number=Number(value);
 return Number.isFinite(number)&&number>0?Math.max(1,Math.round(number)):0;
}
export function resolveMapCanvasSize({hostWidth,hostHeight,windowWidth,windowHeight,mobile=false}={}){
 const width=positiveDimension(hostWidth)||positiveDimension(windowWidth)||1;
 const minHeight=mobile?320:240;
 const viewportHeight=Number(windowHeight);
 const fallbackHeight=Number.isFinite(viewportHeight)&&viewportHeight>60?positiveDimension(viewportHeight-60):minHeight;
 const height=Math.max(minHeight,positiveDimension(hostHeight)||fallbackHeight);
 return{width,height};
}
