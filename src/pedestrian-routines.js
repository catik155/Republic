export function seededValue(seed){const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n)}

export function dailyStopCount(outing,seed){
  return outing?1+Math.floor(seededValue(seed)*2):0;
}
